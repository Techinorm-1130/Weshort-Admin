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
import { tmpdir } from "node:os";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import { del } from "@vercel/blob";
import { hasBlobStore, readState, writeState } from "@/server/persist";
import type { UploadAsset, UploadConfig, UploadStatus } from "@/types";

/* -------------------------------- config -------------------------------- */

const DEFAULT_EXTENSIONS = ["mp4", "mov", "mkv", "webm", "m4v"];
const DEFAULT_MIME = ["video/mp4", "video/quicktime", "video/x-matroska", "video/webm"];

export { hasBlobStore } from "@/server/persist";

/** Limits come from here, not from the components. */
export function uploadConfig(): UploadConfig {
  const list = (value: string | undefined, fallback: string[]) =>
    value
      ? value
          .split(",")
          .map((v) => v.trim().toLowerCase())
          .filter(Boolean)
      : fallback;

  /*
   * A serverless request body is capped by the platform at about 4.5 MB, and
   * the rejection happens before any of this code runs — so it arrives at the
   * browser as a bare 413 with no CORS header, which reads as a CORS failure
   * and tells nobody the truth. Advertising 10 GB there would be a promise the
   * host will not keep, so the real ceiling is reported and the file is refused
   * up front with a reason. Lifting it means not sending bytes through a
   * function at all: the browser uploads straight to object storage instead.
   */
  const serverless = Boolean(process.env.VERCEL ?? process.env.AWS_LAMBDA_FUNCTION_NAME);

  /*
   * With a blob store connected the browser uploads straight to it and this app
   * never touches the bytes, so the cap above does not apply and a real film
   * goes through. Without one there is nowhere else to send them, and on a
   * serverless host that means the 4 MB ceiling stands.
   */
  const transport = hasBlobStore() ? "blob" : "stream";
  const ceiling =
    transport === "blob" || !serverless ? 10 * 1024 * 1024 * 1024 : 4 * 1024 * 1024;

  return {
    transport,
    maxSizeBytes: Number(process.env.UPLOAD_MAX_BYTES ?? ceiling),
    allowedExtensions: list(process.env.UPLOAD_ALLOWED_EXTENSIONS, DEFAULT_EXTENSIONS),
    allowedMimeTypes: list(process.env.UPLOAD_ALLOWED_MIME, DEFAULT_MIME),
    maxParallelUploads: Number(process.env.UPLOAD_MAX_PARALLEL ?? 3),
  };
}

/**
 * Where the bytes live.
 *
 * A serverless host gives you a read-only project directory and one writable
 * scratch dir, so a deployment cannot use `.uploads` beside the source — every
 * write would throw. It falls back to the OS temp dir there, which is
 * per-instance and wiped between invocations: enough to walk the flow through,
 * not a place anything survives. Point UPLOAD_DIR at a mounted volume, or swap
 * this module for S3/R2, before it holds something that has to last.
 */
function defaultUploadDir(): string {
  const serverless = process.env.VERCEL ?? process.env.AWS_LAMBDA_FUNCTION_NAME;
  return serverless ? path.join(tmpdir(), "weshort-uploads") : path.join(process.cwd(), ".uploads");
}

/*
 * The `turbopackIgnore` comments below are not decoration. The bundler traces
 * filesystem calls to decide what to ship, and a path it cannot resolve at
 * build time makes it give up and include the whole project — every source
 * file and all of `public/` — in the server bundle. These paths are only known
 * at runtime, so it is told not to follow them.
 */
export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? defaultUploadDir();
const INDEX_FILE = path.join(/* turbopackIgnore: true */ UPLOAD_DIR, "index.json");

export const extensionOf = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";

/* --------------------------------- index -------------------------------- */

type Index = { assets: UploadAsset[] };

const globalRef = globalThis as unknown as { __weshortUploads?: Index };

async function load(): Promise<Index> {
  /*
   * With a shared store the index is read every time, not cached in memory: the
   * instance answering this request may never have seen the asset the last one
   * registered, which is exactly how an upload went missing between being
   * created and being attached.
   */
  if (hasBlobStore()) {
    const shared = await readState<Index>("uploads");
    const index = { assets: shared?.assets ?? [] };
    globalRef.__weshortUploads = index;
    return index;
  }

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
  if (hasBlobStore()) {
    await writeState("uploads", { assets: index.assets });
    return;
  }

  writing = writing.then(async () => {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(INDEX_FILE, JSON.stringify({ assets: index.assets }, null, 2), "utf8");
  });
  return writing;
}

/* --------------------------------- paths -------------------------------- */

export function filePathFor(asset: UploadAsset): string {
  const ext = extensionOf(asset.fileName);
  return path.join(/* turbopackIgnore: true */ UPLOAD_DIR, ext ? `${asset.id}.${ext}` : asset.id);
}

const partPathFor = (asset: UploadAsset) => `${filePathFor(asset)}.part`;
export const thumbPathFor = (id: string) =>
  path.join(/* turbopackIgnore: true */ UPLOAD_DIR, `${id}.thumb.jpg`);

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
  if (asset.blobUrl) {
    // A failure here must not stop the record being removed — an orphaned blob
    // is untidy, a row pointing at bytes that are gone is broken.
    await del(asset.blobUrl).catch(() => undefined);
  }

  await Promise.all([
    rm(filePathFor(asset), { force: true }),
    rm(partPathFor(asset), { force: true }),
    rm(thumbPathFor(asset.id), { force: true }),
  ]);
}

export async function fileSizeOf(asset: UploadAsset): Promise<number> {
  // Held in object storage: there is no local file to measure, and the size is
  // whatever the completed upload reported.
  if (asset.blobUrl) return asset.receivedBytes;
  try {
    return (await stat(/* turbopackIgnore: true */ filePathFor(asset))).size;
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

/**
 * Wraps a file read as a web stream the response can hand back.
 *
 * Not `Readable.toWeb`: a browser abandons range requests constantly while
 * seeking, and that helper keeps pushing into the closed controller, which
 * surfaces as an uncaught exception and can take the process down. Here a
 * cancelled response destroys the file handle, and every controller call is
 * guarded for the chunk already in flight when that happens.
 */
export function webStreamFrom(source: NodeJS.ReadableStream & { destroy: () => void }): ReadableStream {
  let closed = false;

  return new ReadableStream({
    start(controller) {
      source.on("data", (chunk: Buffer) => {
        if (closed) return;
        try {
          controller.enqueue(new Uint8Array(chunk));
        } catch {
          closed = true;
          source.destroy();
        }
      });
      source.on("end", () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          /* the client already went away */
        }
      });
      source.on("error", (error: Error) => {
        if (closed) return;
        closed = true;
        try {
          controller.error(error);
        } catch {
          /* nothing left to tell */
        }
      });
    },
    cancel() {
      closed = true;
      source.destroy();
    },
  });
}

export async function sizeOfFile(file: string): Promise<number> {
  try {
    return (await stat(/* turbopackIgnore: true */ file)).size;
  } catch {
    return 0;
  }
}

/* -------------------------------- helpers ------------------------------- */

export const ACTIVE_STATUSES: UploadStatus[] = ["waiting", "uploading", "uploaded", "processing"];

export function makeAssetId(): string {
  return `vid_${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/* --------------------------------- images -------------------------------- */

/**
 * Artwork — posters, thumbnails, banners.
 *
 * These used to be object URLs or base64 strings on the record, which is why a
 * poster uploaded on the public site showed as a broken image here: a
 * `blob:` URL only resolves inside the tab that made it. They are files now,
 * stored beside the videos and served by /api/images.
 *
 * The extension is carried in the id, so serving one needs no index.
 */
const IMAGE_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
};

/** Only ids this pattern produces can ever reach the filesystem. */
const IMAGE_ID = /^img_[a-z0-9]+\.(jpg|jpeg|png|webp|avif|gif)$/;

/*
 * Artwork still comes through this app, so it lives under the same request-body
 * ceiling a serverless host imposes. Promising 12 MB there would fail the same
 * confusing way a large film did.
 */
export const MAX_IMAGE_BYTES = Number(
  process.env.UPLOAD_MAX_IMAGE_BYTES ??
    (process.env.VERCEL ?? process.env.AWS_LAMBDA_FUNCTION_NAME ? 4 * 1024 * 1024 : 12 * 1024 * 1024),
);

export function imageExtensionFor(contentType: string, fileName = ""): string | null {
  const fromName = extensionOf(fileName);
  if (fromName && IMAGE_TYPES[fromName]) return fromName;
  const match = Object.keys(IMAGE_TYPES).find((ext) => IMAGE_TYPES[ext] === contentType.toLowerCase());
  return match ?? null;
}

export const imageTypeOf = (id: string) => IMAGE_TYPES[extensionOf(id)] ?? "application/octet-stream";

export function makeImageId(extension: string): string {
  return `img_${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}.${extension}`;
}

/** Null for anything that is not an id we issued — never touches the disk. */
export function imagePathFor(id: string): string | null {
  return IMAGE_ID.test(id) ? path.join(/* turbopackIgnore: true */ UPLOAD_DIR, id) : null;
}

export async function writeImage(id: string, bytes: Buffer): Promise<void> {
  const file = imagePathFor(id);
  if (!file) throw new Error("Bad image id");
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(file, bytes);
}
