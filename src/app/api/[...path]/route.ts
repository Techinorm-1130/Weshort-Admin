/* ---------------------------------------------------------------------------
 * Demo API.
 *
 * A thin HTTP face over the same mock router the admin UI already uses, so the
 * public WeShort site and this dashboard can share one store while there is no
 * real backend: the dashboard publishes a title or a landing page here and the
 * site reads the same rows back.
 *
 * The store lives on globalThis in this server process, so it is shared across
 * requests and survives hot reloads — but not a restart. That is deliberate:
 * this file exists to demonstrate the flow, and is deleted the day the real API
 * is live (both apps then just point NEXT_PUBLIC_API_BASE_URL at it).
 * ------------------------------------------------------------------------ */

import { NextResponse } from "next/server";
import { handleMock } from "@/lib/api/mock-db";

/** The public site runs on another origin, so its calls are cross-origin. */
const CORS = {
  "Access-Control-Allow-Origin": process.env.DEMO_API_ORIGIN ?? "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

type Ctx = { params: Promise<{ path: string[] }> };

async function run(req: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  const search = new URL(req.url).search;
  const target = `/${path.join("/")}${search}`;

  let body: unknown;
  if (req.method !== "GET" && req.method !== "DELETE") {
    body = await req.json().catch(() => undefined);
  }

  try {
    const data = await handleMock<unknown>(req.method, target, body);
    return NextResponse.json(data ?? null, { headers: CORS });
  } catch (error) {
    const message = (error as Error).message || "Request failed";
    // the mock throws a plain Error for a missing row; 404 is the honest status
    const status = /not found/i.test(message) ? 404 : 400;
    return NextResponse.json({ message }, { status, headers: CORS });
  }
}

export const GET = run;
export const POST = run;
export const PATCH = run;
export const PUT = run;
export const DELETE = run;

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
