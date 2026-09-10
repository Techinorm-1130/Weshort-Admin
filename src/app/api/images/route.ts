/* ---------------------------------------------------------------------------
 * Artwork upload.
 *
 * POST /images with the image as the raw body. Answers with the id and the URL
 * to store on the record — an absolute one, because the public site is on
 * another origin and has to be able to render it too.
 * ------------------------------------------------------------------------ */

import { NextResponse } from "next/server";
import {
  MAX_IMAGE_BYTES, imageExtensionFor, makeImageId, writeImage,
} from "@/server/uploads/store";
import { cors, corsPreflight } from "@/server/uploads/cors";

export const dynamic = "force-dynamic";

async function postHandler(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  // the browser sends the file name so a .jpg posted as octet-stream still works
  const fileName = request.headers.get("x-file-name") ?? "";

  const extension = imageExtensionFor(contentType, fileName);
  if (!extension) {
    return NextResponse.json(
      { message: `Unsupported image type "${contentType || "unknown"}". Send JPEG, PNG, WEBP, AVIF or GIF.` },
      { status: 415 },
    );
  }

  const bytes = Buffer.from(await request.arrayBuffer());
  if (bytes.length === 0) {
    return NextResponse.json({ message: "The image is empty" }, { status: 400 });
  }
  if (bytes.length > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { message: `The image is larger than the ${Math.round(MAX_IMAGE_BYTES / 1024 ** 2)} MB limit` },
      { status: 413 },
    );
  }

  const id = makeImageId(extension);
  await writeImage(id, bytes);

  const origin = new URL(request.url).origin;
  return NextResponse.json({ id, url: `${origin}/api/images/${id}`, sizeBytes: bytes.length }, { status: 201 });
}

/* The public site posts artwork from another origin. */
export const POST = cors(postHandler);
export const OPTIONS = corsPreflight;
