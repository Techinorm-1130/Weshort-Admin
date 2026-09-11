/* ---------------------------------------------------------------------------
 * Shared state for the demo backend.
 *
 * Each serverless instance gets its own memory and its own /tmp, so a record
 * written while answering one request is not there when the next request is
 * answered somewhere else. That is what made a draft vanish between the step
 * that created it and the step that saved it: two requests, two instances.
 *
 * These two functions put the state somewhere both instances can see. It is a
 * JSON document in the same blob store the films go to — read at the start of a
 * request, written at the end of one that changed something.
 *
 * This is a demo store, not a database. Two people editing the same collection
 * at the same instant can still have one overwrite the other. When the real
 * backend arrives, this file and the mock router go with it.
 *
 * Server-only: never import this from a client component.
 * ------------------------------------------------------------------------ */

import { head, put } from "@vercel/blob";

/**
 * Whether there is anywhere shared to write.
 *
 * Specifically the read-write token: the SDK authenticates most calls with an
 * OIDC token it fetches at runtime, but not the ones that mint upload tokens,
 * so this is the credential that decides what is actually possible.
 */
export const hasBlobStore = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const pathFor = (name: string) => `state/${name}.json`;

/** The stored document, or null when nothing has been written yet. */
export async function readState<T>(name: string): Promise<T | null> {
  if (!hasBlobStore()) return null;

  try {
    const found = await head(pathFor(name));
    // `no-store` matters: this is the one thing that must never be a cached copy
    const response = await fetch(found.url, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    // not written yet, or the store is unreachable — the caller falls back to
    // whatever it already has in memory
    return null;
  }
}

export async function writeState<T>(name: string, data: T): Promise<void> {
  if (!hasBlobStore()) return;

  try {
    await put(pathFor(name), JSON.stringify(data), {
      access: "public",
      contentType: "application/json",
      // a fixed path, replaced in place, never cached
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
    });
  } catch {
    /* the request itself still succeeded; losing the write is not worth failing it */
  }
}
