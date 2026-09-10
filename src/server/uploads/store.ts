/* ---------------------------------------------------------------------------
 * Video asset storage.
 *
 * Local object storage: the bytes go to a directory on disk (UPLOAD_DIR, or
 * .uploads next to the project) and the records live in an index file beside
 * them, so assets survive a restart. Everything the rest of the app needs goes
 * through the functions here — swapping this file for S3/R2 later means
 * reimplementing `writeStream`, `readRange`, `removeFiles` and nothing else.
 *
 * Server-only: never import this from a client component.
 * ------------------------------------------------------------------------ */

import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import type { UploadAsset, UploadConfig, UploadStatus } from "@/types";

/* -------------------------------- config -------------------------------- */

const DEFAULT_EXTENSIONS = ["mp4", "mov", "mkv", "webm", "m4v"];
const DEFAULT_MIME = ["video/mp4", "video/quicktime", "video/x-matroska", "video/webm"];

/** Limits come from here, not from the components. */
export function uploadConfig(): UploadConfig {
  const list = (value: string | undefined, fallback: string[]) =>
    value
      ? value
          .split(",")
          .map((v) => v.trim().toLowerCase())
          .filter(Boolean)
      : fallback;

  return {
    maxSizeBytes: Number(process.env.UPLOAD_MAX_BYTES ?? 10 * 1024 * 1024 * 1024),
    allowedExtensions: list(process.env.UPLOAD_ALLOWED_EXTENSIONS, DEFAULT_EXTENSIONS),
    allowedMimeTypes: list(process.env.UPLOAD_ALLOWED_MIME, DEFAULT_MIME),
    maxParallelUploads: Number(process.env.UPLOAD_MAX_PARALLEL ?? 3),
  };
}

export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), ".uploads");
const INDEX_FILE = path.join(UPLOAD_DIR, "index.json");

export const extensionOf = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";

/* --------------------------------- index -------------------------------- */

type Index = { assets: UploadAsset[] };

const globalRef = globalThis as unknown as { __weshortUploads?: Index };

async function load(): Promise<Index> {
  if (globalRef.__weshortUploads) return globalRef.__weshortUploads;

  await mkdir(UPLOAD_DIR, { recursive: true });
  let assets: UploadAsset[] = [];
  try {
    const raw = await readFile(INDEX_FILE, "utf8");
    assets = (JSON.parse(raw) as Index).assets ?? [];
  } catch {
    /* first run — the index is written on the first mutation */
  }

  // An upload that was mid-flight when the server stopped can never resume.
  for (const asset of assets) {
    if (asset.status === "uploading" || asset.status === "processing") {
      const stage = asset.status === "processing" ? "processing" : "upload";
      asset.status = "failed";
      asset.failedStage = stage;
      asset.error = "Interrupted when the server restarted. Retry to run it again.";
    }
  }

  globalRef.__weshortUploads = { assets };
  return globalRef.__weshortUploads;
}

/** Writes are serialised so two requests cannot clobber the index. */
let writing: Promise<void> = Promise.resolve();

async function persist(index: Index): Promise<void> {
  writing = writing.then(async () => {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(INDEX_FILE, JSON.stringify({ assets: index.assets }, null, 2), "utf8");
  });
  return writing;
}

/* --------------------------------- paths -------------------------------- */

export function filePathFor(asset: UploadAsset): string {
  const ext = extensionOf(asset.fileName);
  return path.join(UPLOAD_DIR, ext ? `${asset.id}.${ext}` : asset.id);
}

const partPathFor = (asset: UploadAsset) => `${filePathFor(asset)}.part`;
export const thumbPathFor = (id: string) => path.join(UPLOAD_DIR, `${id}.thumb.jpg`);

/* -------------------------------- records ------------------------------- */

export async function listAssets(): Promise<UploadAsset[]> {
  const index = await load();
  return index.assets;
}

export async function getAsset(id: string): Promise<UploadAsset | undefined> {
  const index = await load();
  return index.assets.find((a) => a.id === id);
}

export async function addAsset(asset: UploadAsset): Promise<UploadAsset> {
  const index = await load();
  index.assets.unshift(asset);
  await persist(index);
  return asset;
}

export async function updateAsset(
  id: string,
  patch: Partial<UploadAsset>,
): Promise<UploadAsset | undefined> {
  const index = await load();
  const asset = index.assets.find((a) => a.id === id);
  if (!asset) return undefined;
  Object.assign(asset, patch);
  await persist(index);
  return asset;
}

export async function removeAsset(id: string): Promise<boolean> {
  const index = await load();
  const asset = index.assets.find((a) => a.id === id);
  if (!asset) return false;
  index.assets = index.assets.filter((a) => a.id !== id);
  globalRef.__weshortUploads = index;
  await removeFiles(asset);
  await persist(index);
  return true;
}

/* --------------------------------- bytes -------------------------------- */

/**
 * Streams the request body to disk, hashing as it goes. The bytes land in a
 * `.part` file that is only promoted once the whole body arrived, so an aborted
 * upload never leaves a half file pretending to be a video.
 */
export async function writeStream(
  asset: UploadAsset,
  body: WebReadableStream<Uint8Array>,
): Promise<{ bytes: number; checksum: string }> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const part = partPathFor(asset);
  const hash = createHash("sha256");
  let bytes = 0;

  const source = Readable.fromWeb(body);
  source.on("data", (chunk: Buffer) => {
    bytes += chunk.length;
    hash.update(chunk);
  });

  try {
    await pipeline(source, createWriteStream(part));
  } catch (error) {
    await rm(part, { force: true });
    throw error;
  }

  await rename(part, filePathFor(asset));
  return { bytes, checksum: hash.digest("hex") };
}

/** Drops every file belonging to an asset, finished or partial. */
export async function removeFiles(asset: UploadAsset): Promise<void> {
  await Promise.all([
    rm(filePathFor(asset), { force: true }),
    rm(partPathFor(asset), { force: true }),
    rm(thumbPathFor(asset.id), { force: true }),
  ]);
}

export async function fileSizeOf(asset: UploadAsset): Promise<number> {
  try {
    return (await stat(filePathFor(asset))).size;
  } catch {
    return 0;
  }
}

export async function writeThumbnail(id: string, body: WebReadableStream<Uint8Array>): Promise<void> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  await pipeline(Readable.fromWeb(body), createWriteStream(thumbPathFor(id)));
}

export async function removeThumbnail(id: string): Promise<void> {
  await rm(thumbPathFor(id), { force: true });
}

/** A byte range of the stored file, for the `<video>` player's seek bar. */
export function readRange(file: string, start: number, end: number) {
  return createReadStream(file, { start, end });
}

export async function sizeOfFile(file: string): Promise<number> {
  try {
    return (await stat(file)).size;
  } catch {
    return 0;
  }
}

/* -------------------------------- helpers ------------------------------- */

export const ACTIVE_STATUSES: UploadStatus[] = ["waiting", "uploading", "uploaded", "processing"];

export function makeAssetId(): string {
  return `vid_${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}
