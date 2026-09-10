/* ---------------------------------------------------------------------------
 * Cross-origin access for the demo bridge.
 *
 * The public WeShort site runs on another origin and drives this same upload
 * pipeline, so the routes it calls have to answer cross-origin — including the
 * preflight that the byte PUT triggers because it carries a Content-Type.
 *
 * This is deliberately not a `proxy.ts`: a proxy clones and buffers the request
 * body in memory (10 MB by default), which is exactly what the upload route
 * avoids by streaming. Wrapping the handlers keeps the body untouched.
 *
 * Goes away with the rest of the demo bridge when the real backend is live.
 * ------------------------------------------------------------------------ */

/** Set DEMO_API_ORIGIN to the site's origin to stop allowing anything. */
export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": process.env.DEMO_API_ORIGIN ?? "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

type RouteHandler<C> = (request: Request, ctx: C) => Response | Promise<Response>;

/** Adds the headers to whatever the handler returns, body untouched. */
export function cors<C>(handler: RouteHandler<C>): RouteHandler<C> {
  return async (request: Request, ctx: C) => {
    const response = await handler(request, ctx);
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      response.headers.set(key, value);
    }
    return response;
  };
}

/** The preflight answer. Export as OPTIONS from any route `cors()` wraps. */
export function corsPreflight(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
