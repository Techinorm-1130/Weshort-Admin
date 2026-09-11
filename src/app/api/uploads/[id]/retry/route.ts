import { NextResponse } from "next/server";
import { fileSizeOf, getAsset, updateAsset } from "@/server/uploads/store";
import { runProcessing } from "@/server/uploads/processing";
import { cors, corsPreflight } from "@/server/uploads/cors";

/**
 * Retries the processing pass for a file that is already in storage. A failed
 * *upload* is retried by sending the bytes again, not through here.
 */
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function postHandler(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const asset = await getAsset(id);
  if (!asset) return NextResponse.json({ message: "Video not found" }, { status: 404 });

  if ((await fileSizeOf(asset)) === 0) {
    return NextResponse.json(
      { message: "There is no stored file to process. Upload the video again." },
      { status: 409 },
    );
  }

  const restarted = await updateAsset(id, { status: "uploaded", failedStage: "", error: "" });
  // run it here, not afterwards: work left behind a response does not resume
  const finished = restarted ? await runProcessing(restarted) : undefined;
  // what was just written, rather than a re-read that can still be the old copy
  return NextResponse.json(finished ?? restarted);
}

/* The public site calls these from another origin. */
export const POST = cors(postHandler);
export const OPTIONS = corsPreflight;
