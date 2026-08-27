/* ---------------------------------------------------------------------------
 * Transport layer.
 *
 * Everything in the app talks to the backend through `request()`. While
 * NEXT_PUBLIC_API_BASE_URL is empty the call is served by the in-memory mock
 * router (src/lib/api/mock-db.ts) that speaks the same REST paths, so plugging
 * the real API in later is a one-line env change — no component edits.
 * ------------------------------------------------------------------------ */

import { handleMock } from "./mock-db";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
export const USING_MOCK = API_BASE.length === 0;

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function authHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("weshort.admin.token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Builds `/medias?search=foo&page=2` from a params object, skipping empties. */
export function withQuery(path: string, params?: Record<string, unknown>): string {
  if (!params) return path;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "" || value === "all") continue;
    qs.set(key, String(value));
  }
  const q = qs.toString();
  return q ? `${path}?${q}` : path;
}

export async function request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  if (USING_MOCK) return handleMock<T>(method, path, body);

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = (await res.json()) as { message?: string; detail?: string };
      message = data.message ?? data.detail ?? message;
    } catch {
      /* body was not json — keep the status text */
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const http = {
  get: <T>(path: string, params?: Record<string, unknown>) => request<T>("GET", withQuery(path, params)),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
};
