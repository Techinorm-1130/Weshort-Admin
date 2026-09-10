/* ---------------------------------------------------------------------------
 * Poster image for one video: upload, serve, remove.
 * ------------------------------------------------------------------------ */

import { NextResponse } from "next/server";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import {
  getAsset, removeThumbnail, sizeOfFile, thumbPathFor, updateAsset, writeThumbnail,
} from "@/server/uploads/store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const file = thumbPathFor(id);
  const size = await sizeOfFile(file);
  if (!size) return new NextResponse(null, { status: 404 });

  const stream = Readable.toWeb(createReadStream(file)) as unknown as ReadableStream;
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(size),
      "Cache-Control": "no-store",
    },
  });
}

export async function PUT(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const asset = await getAsset(id);
  if (!asset) return NextResponse.json({ message: "Video not found" }, { status: 404 });
  if (!request.body) return NextResponse.json({ message: "No image body" }, { status: 400 });

  await writeThumbnail(id, request.body as unknown as WebReadableStream<Uint8Array>);
  return NextResponse.json(await updateAsset(id, { hasThumbnail: true }));
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const asset = await getAsset(id);
  if (!asset) return NextResponse.json({ message: "Video not found" }, { status: 404 });

  await removeThumbnail(id);
  return NextResponse.json(await updateAsset(id, { hasThumbnail: false }));
}
