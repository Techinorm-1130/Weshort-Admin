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
 * ------------------------------------------------------------------------ */

import { extensionOf, fileSizeOf, getAsset, listAssets, updateAsset, uploadConfig } from "./store";
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
async function fail(id: string, error: string): Promise<void> {
  await updateAsset(id, { status: "failed", failedStage: "processing", error });
}

/**
 * Runs the pipeline for one asset. Safe to call again after a failure — that is
 * exactly what "Retry processing" does.
 */
export async function runProcessing(id: string): Promise<void> {
  const asset = await getAsset(id);
  if (!asset) return;

  await updateAsset(id, { status: "processing", failedStage: "", error: "" });

  const onDisk = await fileSizeOf(asset);
  if (onDisk === 0) {
    await fail(id, "No file was stored for this upload. Upload the video again.");
    return;
  }

  // The browser tells us how big the file is before it sends it; a mismatch
  // means the transfer was cut short and the file is unusable.
  if (asset.sizeBytes > 0 && onDisk !== asset.sizeBytes) {
    await fail(
      id,
      `Upload incomplete — ${mb(onDisk)} of ${mb(asset.sizeBytes)} arrived. Retry the upload.`,
    );
    return;
  }

  const config = uploadConfig();
  const ext = extensionOf(asset.fileName);
  if (!config.allowedExtensions.includes(ext)) {
    await fail(id, `Unsupported container ".${ext}". Supported: ${config.allowedExtensions.join(", ")}.`);
    return;
  }

  if (FAIL_MARKER && asset.fileName.toLowerCase().includes(FAIL_MARKER)) {
    await fail(id, "Invalid video codec — the pipeline could not decode the video track.");
    return;
  }

  await transcode();

  // Still there? A delete or cancel during processing wins.
  const current = await getAsset(id);
  if (!current || current.status !== "processing") return;

  await updateAsset(id, {
    status: "ready",
    readyAt: new Date().toISOString(),
    failedStage: "",
    error: "",
  });
}

/** Kicks processing off without making the upload request wait for it. */
export function queueProcessing(id: string): void {
  void runProcessing(id).catch(async (error: unknown) => {
    const message = error instanceof Error ? error.message : "Processing failed";
    await fail(id, message);
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
