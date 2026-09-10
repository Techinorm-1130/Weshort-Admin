/* ---------------------------------------------------------------------------
 * The bytes.
 *
 * PUT /uploads/{id}/file streams the request body straight to storage. The
 * browser sends it with XHR so it can report real progress, and aborting that
 * request lands here as a stream error — which deletes the partial file.
 * ------------------------------------------------------------------------ */

import { NextResponse } from "next/server";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import {
  fileSizeOf, getAsset, removeAsset, removeFiles, updateAsset, writeStream,
} from "@/server/uploads/store";
import { findDuplicate, queueProcessing } from "@/server/uploads/processing";
import { cors, corsPreflight } from "@/server/uploads/cors";

export const dynamic = "force-dynamic";

/**
 * How long the platform lets this function run.
 *
 * The body streams through and nothing is buffered, but that does not exempt it
 * from the host's ceiling — and asking for more than the plan allows is refused
 * when the deployment is *created*, after a build that looks perfectly green.
 * This asked for an hour, which no plan permits. 60s is the limit everywhere;
 * raise it only as far as yours actually goes.
 *
 * A file too large to arrive inside that window should not come through a
 * function at all — it wants a signed URL straight to object storage, which is
 * the same change that replaces the local disk in server/uploads/store.ts.
 */
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

async function putHandler(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const asset = await getAsset(id);
  if (!asset) return NextResponse.json({ message: "Video not found" }, { status: 404 });
  if (!request.body) return NextResponse.json({ message: "No file body" }, { status: 400 });

  await updateAsset(id, { status: "uploading", receivedBytes: 0, error: "", failedStage: "" });

  try {
    const { bytes, checksum } = await writeStream(
      asset,
      request.body as unknown as WebReadableStream<Uint8Array>,
    );

    // The client can cancel between the last chunk and here.
    const current = await getAsset(id);
    if (!current || current.status === "cancelled") {
      await removeFiles(asset);
      return NextResponse.json({ message: "Upload cancelled" }, { status: 409 });
    }

    const uploaded = await updateAsset(id, {
      status: "uploaded",
      receivedBytes: bytes,
      checksum,
      uploadedAt: new Date().toISOString(),
    });

    /*
     * Exactly the same bytes as a video already stored and ready? Hand that one
     * back and drop this copy. Sending the same file twice is normal — a failed
     * submission retried, a wizard restarted — and every retry used to leave
     * another row behind in Video files, so one upload looked like four.
     */
    if (uploaded) {
      const twin = await findDuplicate(uploaded);
      if (twin) {
        await removeAsset(id);
        return NextResponse.json(twin);
      }
    }

    // Processing runs on its own; the client polls for the result.
    queueProcessing(id);

    return NextResponse.json(await getAsset(id));
  } catch {
    const landed = await fileSizeOf(asset);
    await removeFiles(asset);
    const current = await getAsset(id);
    // An abort from the browser is a cancel, not a failure.
    if (current?.status === "cancelled") {
      return NextResponse.json({ message: "Upload cancelled" }, { status: 409 });
    }
    await updateAsset(id, {
      status: "failed",
      failedStage: "upload",
      receivedBytes: landed,
      error: "The connection dropped before the whole file arrived.",
    });
    return NextResponse.json({ message: "Upload failed" }, { status: 500 });
  }
}

/* The public site calls these from another origin. */
export const PUT = cors(putHandler);
export const OPTIONS = corsPreflight;
