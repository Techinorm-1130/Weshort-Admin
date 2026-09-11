/* ---------------------------------------------------------------------------
 * Records a film that went straight to object storage.
 *
 * The browser uploads the bytes itself, so the first this app hears of them is
 * here: the URL they landed at and how many arrived. From that point the asset
 * behaves like any other — it processes, it turns ready, it can be attached to
 * a title and played back.
 *
 * Deliberately not Blob's own upload-completed callback: that is delivered to
 * whichever instance happens to answer, and the asset it belongs to may have
 * been registered on a different one. The browser knows the outcome and can
 * simply say so.
 * ------------------------------------------------------------------------ */

import { NextResponse } from "next/server";
import { getAsset, updateAsset } from "@/server/uploads/store";
import { runProcessing } from "@/server/uploads/processing";
import { cors, corsPreflight } from "@/server/uploads/cors";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function postHandler(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const asset = await getAsset(id);
  if (!asset) return NextResponse.json({ message: "Video not found" }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as {
    url?: string;
    sizeBytes?: number;
  };

  const url = (body.url ?? "").trim();
  // Only somewhere we could have sent it. A record may not be pointed at an
  // arbitrary address just because someone asked.
  if (!/^https:\/\/[^/]+\.(vercel-storage\.com|public\.blob\.vercel-storage\.com)\//.test(url)) {
    return NextResponse.json({ message: "That is not a blob storage URL" }, { status: 400 });
  }

  const received = Number(body.sizeBytes ?? 0);
  if (received <= 0) {
    return NextResponse.json({ message: "No bytes were reported" }, { status: 400 });
  }

  const attached = await updateAsset(id, {
    blobUrl: url,
    status: "uploaded",
    receivedBytes: received,
    uploadedAt: new Date().toISOString(),
    error: "",
    failedStage: "",
  });

  /*
   * Processed here rather than handed to a background task. A serverless
   * function is frozen the moment it answers, so work left running afterwards
   * does not resume until something else happens to wake that instance — which
   * is why a film sat at "processing" far longer than the work takes.
   *
   * The answer is therefore the finished asset, and the browser has nothing to
   * poll for.
   */
  const finished = attached ? await runProcessing(attached) : undefined;

  // What was just written, not a re-read of it: reading back a document this
  // fresh can still return the copy from before the write.
  return NextResponse.json(finished ?? attached);
}

export const POST = cors(postHandler);
export const OPTIONS = corsPreflight;
