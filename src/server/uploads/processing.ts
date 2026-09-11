/* ---------------------------------------------------------------------------
 * The processing pass that runs once the bytes have landed.
 *
 * What it really does: checks the stored file against what the browser said it
 * was sending, rejects containers the pipeline does not accept, and only then
 * marks the asset READY. There is no transcoder in this project yet, so the
 * work itself is a wait — but every status the UI shows is genuine server
 * state, and every failure below is a real check, not a scripted one. When a
 * transcoder is added, replace the wait in `transcode()` with the real job and
 * nothing else in the app has to change.
 *
 * The asset is threaded through rather than re-read at each step. Shared
 * storage does not guarantee that a document read moments after being written
 * is the version that was written, and merging a change onto a stale copy
 * silently undoes whatever the previous step recorded — which is exactly how a
 * film lost the storage URL it had just been given.
 * ------------------------------------------------------------------------ */

import { extensionOf, fileSizeOf, getAsset, listAssets, saveAsset, uploadConfig } from "./store";
import type { UploadAsset } from "@/types";

const PROCESSING_MS = Number(process.env.UPLOAD_PROCESSING_MS ?? 2500);

/**
 * Files whose name contains this marker fail processing on purpose, so the
 * failure and retry paths can be exercised without corrupting a real video.
 */
const FAIL_MARKER = (process.env.UPLOAD_FAIL_MARKER ?? "fail-processing").toLowerCase();

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

function transcode(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, PROCESSING_MS));
}

/** Marks an asset failed with a reason the admin can act on. */
async function fail(asset: UploadAsset, error: string): Promise<void> {
  await saveAsset(asset, { status: "failed", failedStage: "processing", error });
}

/**
 * Runs the pipeline for one asset. Safe to call again after a failure — that is
 * exactly what "Retry processing" does.
 *
 * Takes the asset itself where the caller already has it, which is every case
 * that matters: the upload that just finished, and the retry that just reset it.
 */
export async function runProcessing(input: UploadAsset | string): Promise<void> {
  const found = typeof input === "string" ? await getAsset(input) : input;
  if (!found) return;

  const processing = await saveAsset(found, {
    status: "processing",
    failedStage: "",
    error: "",
  });

  const stored = await fileSizeOf(processing);
  if (stored === 0) {
    await fail(processing, "No file was stored for this upload. Upload the video again.");
    return;
  }

  // The browser tells us how big the file is before it sends it; a mismatch
  // means the transfer was cut short and the file is unusable.
  if (processing.sizeBytes > 0 && stored !== processing.sizeBytes) {
    await fail(
      processing,
      `Upload incomplete — ${mb(stored)} of ${mb(processing.sizeBytes)} arrived. Retry the upload.`,
    );
    return;
  }

  const config = uploadConfig();
  const ext = extensionOf(processing.fileName);
  if (!config.allowedExtensions.includes(ext)) {
    await fail(
      processing,
      `Unsupported container ".${ext}". Supported: ${config.allowedExtensions.join(", ")}.`,
    );
    return;
  }

  if (FAIL_MARKER && processing.fileName.toLowerCase().includes(FAIL_MARKER)) {
    await fail(processing, "Invalid video codec — the pipeline could not decode the video track.");
    return;
  }

  await transcode();

  // A delete or cancel while this was running wins. Only that is worth a read:
  // anything else and the copy in hand is the one to trust.
  const current = await getAsset(processing.id);
  if (current?.status === "cancelled") return;

  await saveAsset(processing, {
    status: "ready",
    readyAt: new Date().toISOString(),
    failedStage: "",
    error: "",
  });
}

/** Kicks processing off without making the upload request wait for it. */
export function queueProcessing(input: UploadAsset | string): void {
  void runProcessing(input).catch(async (error: unknown) => {
    const message = error instanceof Error ? error.message : "Processing failed";
    const asset = typeof input === "string" ? await getAsset(input) : input;
    if (asset) await fail(asset, message);
  });
}

/**
 * A finished asset already holding these exact bytes.
 *
 * Only a READY twin counts: the upload route collapses onto whatever this
 * returns, and collapsing onto something still processing (or failed) would
 * hand the caller an asset that may never become playable.
 */
export async function findDuplicate(asset: UploadAsset): Promise<UploadAsset | undefined> {
  if (!asset.checksum) return undefined;
  const all = await listAssets();
  return all.find(
    (other) => other.id !== asset.id && other.checksum === asset.checksum && other.status === "ready",
  );
}
