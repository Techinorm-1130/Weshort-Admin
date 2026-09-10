import { NextResponse } from "next/server";
import { getAsset, removeFiles, updateAsset } from "@/server/uploads/store";
import { cors, corsPreflight } from "@/server/uploads/cors";

/** Stops an upload and clears whatever partial bytes reached storage. */
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function postHandler(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const asset = await getAsset(id);
  if (!asset) return NextResponse.json({ message: "Video not found" }, { status: 404 });

  await removeFiles(asset);
  const updated = await updateAsset(id, {
    status: "cancelled",
    receivedBytes: 0,
    failedStage: "",
    error: "",
    hasThumbnail: false,
  });
  return NextResponse.json(updated);
}

/* The public site calls these from another origin. */
export const POST = cors(postHandler);
export const OPTIONS = corsPreflight;
