/* ---------------------------------------------------------------------------
 * Serves one piece of artwork. Cached hard: an id is only ever issued once and
 * the bytes behind it never change.
 * ------------------------------------------------------------------------ */

import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { imagePathFor, imageTypeOf } from "@/server/uploads/store";
import { cors, corsPreflight } from "@/server/uploads/cors";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function getHandler(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  // Anything that is not an id we issued is refused before touching the disk.
  const file = imagePathFor(id);
  if (!file) return new NextResponse(null, { status: 400 });

  try {
    const bytes = await readFile(file);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": imageTypeOf(id),
        "Content-Length": String(bytes.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}

export const GET = cors(getHandler);
export const OPTIONS = corsPreflight;
