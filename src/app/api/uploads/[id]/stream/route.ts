/* ---------------------------------------------------------------------------
 * Plays the stored file back.
 *
 * Range requests are honoured so the player's seek bar works on a large file
 * instead of downloading the whole thing first.
 * ------------------------------------------------------------------------ */

import { NextResponse } from "next/server";
import { filePathFor, getAsset, readRange, sizeOfFile, webStreamFrom } from "@/server/uploads/store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const CONTENT_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/quicktime",
  mkv: "video/x-matroska",
  webm: "video/webm",
};

export async function GET(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const asset = await getAsset(id);
  if (!asset) return new NextResponse(null, { status: 404 });

  // Held in object storage: it is served from there, with its own range support.
  if (asset.blobUrl) return NextResponse.redirect(asset.blobUrl);

  const file = filePathFor(asset);
  const size = await sizeOfFile(file);
  if (!size) return new NextResponse(null, { status: 404 });

  const ext = asset.fileName.split(".").pop()?.toLowerCase() ?? "";
  const type = asset.contentType || CONTENT_TYPES[ext] || "application/octet-stream";
  const range = request.headers.get("range");

  if (!range) {
    const whole = webStreamFrom(readRange(file, 0, size - 1));
    return new NextResponse(whole, {
      headers: {
        "Content-Type": type,
        "Content-Length": String(size),
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
      },
    });
  }

  const [rawStart, rawEnd] = range.replace(/bytes=/, "").split("-");
  const start = Number(rawStart) || 0;
  const end = rawEnd ? Math.min(Number(rawEnd), size - 1) : size - 1;
  if (start >= size || start > end) {
    return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  }

  const part = webStreamFrom(readRange(file, start, end));
  return new NextResponse(part, {
    status: 206,
    headers: {
      "Content-Type": type,
      "Content-Length": String(end - start + 1),
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
    },
  });
}
