import { NextResponse } from "next/server";
import { uploadConfig } from "@/server/uploads/store";
import { cors, corsPreflight } from "@/server/uploads/cors";

/** Limits and accepted formats. The UI asks for these instead of hardcoding them. */
export const dynamic = "force-dynamic";

async function getHandler() {
  return NextResponse.json(uploadConfig());
}

/* The public site calls this from another origin. */
export const GET = cors(getHandler);
export const OPTIONS = corsPreflight;
