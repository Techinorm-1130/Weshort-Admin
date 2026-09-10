/* ---------------------------------------------------------------------------
 * One video asset: read it, edit the fields an admin owns, delete it.
 * ------------------------------------------------------------------------ */

import { NextResponse } from "next/server";
import { getAsset, removeAsset, updateAsset } from "@/server/uploads/store";
import { contentsUsingAsset } from "@/lib/api/mock-db";
import { cors, corsPreflight } from "@/server/uploads/cors";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const missing = () => NextResponse.json({ message: "Video not found" }, { status: 404 });

async function getHandler(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const asset = await getAsset(id);
  if (!asset) return missing();
  return NextResponse.json({ ...asset, usedBy: contentsUsingAsset(id) });
}

/** Only the descriptive fields are editable — never the detected technical ones. */
async function patchHandler(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const asset = await getAsset(id);
  if (!asset) return missing();

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const text = (key: string, current: string) =>
    typeof body[key] === "string" ? (body[key] as string) : current;

  const internalName = text("internalName", asset.internalName).trim();
  if (!internalName) {
    return NextResponse.json({ message: "Internal name is required" }, { status: 400 });
  }

  const updated = await updateAsset(id, {
    internalName,
    displayName: text("displayName", asset.displayName),
    description: text("description", asset.description),
  });
  return NextResponse.json(updated);
}

async function deleteHandler(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const asset = await getAsset(id);
  if (!asset) return missing();

  // Something is still pointing at these bytes — deleting would break it.
  const usedBy = contentsUsingAsset(id);
  if (usedBy.length) {
    return NextResponse.json(
      {
        message: `This video is used by ${usedBy.map((c) => `"${c.title}"`).join(", ")}. Remove it there first.`,
        usedBy,
      },
      { status: 409 },
    );
  }

  await removeAsset(id);
  return NextResponse.json({ ok: true });
}

/* The public site calls these from another origin. */
export const GET = cors(getHandler);
export const PATCH = cors(patchHandler);
export const DELETE = cors(deleteHandler);
export const OPTIONS = corsPreflight;
