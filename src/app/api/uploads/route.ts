/* ---------------------------------------------------------------------------
 * Video assets: the list, and the record that is created before any bytes move.
 *
 * POST /uploads      — register an upload, get back the asset to send bytes to
 * GET  /uploads      — search / filter / sort / page the asset list
 * ------------------------------------------------------------------------ */

import { NextResponse } from "next/server";
import { addAsset, listAssets, makeAssetId, uploadConfig, extensionOf } from "@/server/uploads/store";
import { contentsUsingAsset } from "@/lib/api/mock-db";
import { CURRENT_USER } from "@/lib/session";
import type { UploadAsset, UploadStatus } from "@/types";
import { cors, corsPreflight } from "@/server/uploads/cors";

export const dynamic = "force-dynamic";

type CreateBody = {
  fileName?: string;
  sizeBytes?: number;
  contentType?: string;
  /** What the browser read off the file before sending it. */
  media?: Partial<UploadAsset["media"]>;
};

const SORTABLE = new Set(["createdAt", "fileName", "sizeBytes", "durationSec", "status"]);

function sortValue(asset: UploadAsset, key: string): string | number {
  if (key === "durationSec") return asset.media.durationSec;
  if (key === "sizeBytes") return asset.sizeBytes;
  if (key === "fileName") return asset.internalName.toLowerCase();
  if (key === "status") return asset.status;
  return asset.createdAt;
}

async function getHandler(request: Request) {
  const params = new URL(request.url).searchParams;
  const search = (params.get("search") ?? "").trim().toLowerCase();
  const status = params.get("status") ?? "all";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const ids = params.get("ids");
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const perPage = Math.min(100, Math.max(1, Number(params.get("perPage") ?? 10)));
  const sort = params.get("sort") ?? "-createdAt";

  let items = [...(await listAssets())];

  if (ids) {
    const wanted = new Set(ids.split(",").filter(Boolean));
    items = items.filter((a) => wanted.has(a.id));
    // A status poll wants every asset it asked about, unpaged.
    return NextResponse.json({ items, total: items.length, page: 1, perPage: items.length });
  }

  if (search) {
    items = items.filter((a) =>
      [a.internalName, a.displayName, a.fileName].some((v) => v.toLowerCase().includes(search)),
    );
  }
  if (status !== "all") items = items.filter((a) => a.status === (status as UploadStatus));
  if (from) items = items.filter((a) => a.createdAt.slice(0, 10) >= from);
  if (to) items = items.filter((a) => a.createdAt.slice(0, 10) <= to);

  const desc = sort.startsWith("-");
  const key = desc ? sort.slice(1) : sort;
  if (SORTABLE.has(key)) {
    items.sort((a, b) => {
      const av = sortValue(a, key);
      const bv = sortValue(b, key);
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return desc ? -cmp : cmp;
    });
  }

  const total = items.length;
  const start = (page - 1) * perPage;

  return NextResponse.json({
    items: items.slice(start, start + perPage).map((a) => ({ ...a, usedBy: contentsUsingAsset(a.id) })),
    total,
    page,
    perPage,
  });
}

async function postHandler(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CreateBody;
  const fileName = (body.fileName ?? "").trim();
  const sizeBytes = Number(body.sizeBytes ?? 0);
  const config = uploadConfig();

  // The browser checks these too, for a fast error — but this is the one that counts.
  if (!fileName) {
    return NextResponse.json({ message: "A file name is required" }, { status: 400 });
  }
  const ext = extensionOf(fileName);
  if (!config.allowedExtensions.includes(ext)) {
    return NextResponse.json(
      { message: `Unsupported video format ".${ext}". Supported: ${config.allowedExtensions.join(", ")}.` },
      { status: 415 },
    );
  }
  if (sizeBytes <= 0) {
    return NextResponse.json({ message: "The file is empty" }, { status: 400 });
  }
  if (sizeBytes > config.maxSizeBytes) {
    return NextResponse.json(
      { message: `The file is larger than the ${Math.round(config.maxSizeBytes / 1024 ** 3)} GB limit` },
      { status: 413 },
    );
  }

  const now = new Date().toISOString();
  const asset: UploadAsset = {
    id: makeAssetId(),
    fileName,
    internalName: fileName.replace(/\.[^.]+$/, ""),
    displayName: "",
    description: "",
    contentType: body.contentType ?? "",
    sizeBytes,
    receivedBytes: 0,
    status: "waiting",
    failedStage: "",
    error: "",
    media: {
      durationSec: Number(body.media?.durationSec ?? 0),
      width: Number(body.media?.width ?? 0),
      height: Number(body.media?.height ?? 0),
      aspectRatio: body.media?.aspectRatio ?? "",
      container: body.media?.container ?? ext.toUpperCase(),
      videoCodec: body.media?.videoCodec ?? "",
      audioCodec: body.media?.audioCodec ?? "",
      frameRate: Number(body.media?.frameRate ?? 0),
    },
    hasThumbnail: false,
    checksum: "",
    duplicateOf: null,
    uploadedBy: {
      id: CURRENT_USER.id,
      name: CURRENT_USER.name,
      initials: CURRENT_USER.initials,
      color: CURRENT_USER.color,
    },
    createdAt: now,
    uploadedAt: "",
    readyAt: "",
    usedBy: [],
  };

  await addAsset(asset);
  return NextResponse.json(asset, { status: 201 });
}

/* The public site calls these from another origin. */
export const GET = cors(getHandler);
export const POST = cors(postHandler);
export const OPTIONS = corsPreflight;
