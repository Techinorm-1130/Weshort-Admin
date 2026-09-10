"use client";

import { useRef, useState } from "react";
import { useDebounced, useQuery } from "@/lib/hooks";
import { formatBytes, formatDuration } from "@/lib/format";
import type { UploadAsset, VideoAsset } from "@/types";
import { uploadApi } from "@/lib/upload/client";
import { useUploadManager } from "@/components/uploads/UploadManager";
import {
  formatEta, formatSpeed, uploadStatusLabel, validateFiles,
} from "@/lib/upload/uploadMeta";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import { Badge, ProgressBar } from "@/components/ui/Primitives";
import { Modal } from "@/components/ui/Overlays";
import { FileDrop } from "@/components/ui/Uploader";
import { Field } from "@/components/ui/Fields";
import { useToast } from "@/components/ui/Toast";

/**
 * The wizard's video field, on the real upload pipeline.
 *
 * Picking a file registers an asset, streams the bytes to storage with real
 * progress, and then waits on the server for processing to finish — the same
 * API and the same states as the Video uploads page. Nothing here advances on a
 * timer, and a video already in the library can be attached instead of sending
 * it a second time.
 */
export default function VideoUploader({
  label, hint, value, onChange, required,
}: {
  label: string;
  hint?: string;
  value: VideoAsset | null;
  onChange: (asset: VideoAsset | null) => void;
  /** Kept for call-site compatibility; renditions come from the backend now. */
  withQualities?: boolean;
  required?: boolean;
}) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [picking, setPicking] = useState(false);

  // One queue for the whole dashboard: the field hands the file over and gets
  // told what happens to it, so the floating manager shows it like any other.
  const { config, upload, cancel } = useUploadManager();
  const queueIdRef = useRef<string | null>(null);

  /** Everything the field knows about a video comes from one asset record. */
  const fromAsset = (asset: UploadAsset, previous?: VideoAsset | null): VideoAsset => ({
    id: asset.id,
    name: asset.fileName,
    sizeBytes: asset.sizeBytes,
    progress: asset.status === "ready" || asset.status === "processing" ? 100 : previous?.progress ?? 0,
    state:
      asset.status === "ready"
        ? "ready"
        : asset.status === "failed"
          ? "failed"
          : asset.status === "uploading" || asset.status === "waiting"
            ? "uploading"
            : "processing",
    qualities: [],
    previewUrl: uploadApi.streamUrl(asset.id),
    error: asset.error || undefined,
    failedStage: asset.failedStage,
    durationSec: asset.media.durationSec,
    width: asset.media.width,
    height: asset.media.height,
  });

  /* -------------------------------- upload -------------------------------- */

  const startUpload = (file: File) => {
    const rejected = validateFiles([file], config).rejected[0];
    if (rejected) {
      toast.error(`${rejected.name} — ${rejected.reason}`);
      return;
    }

    queueIdRef.current = upload(file, {
      onAsset: (asset) => onChange(fromAsset(asset)),
      onProgress: (progress, asset) =>
        onChange({
          ...fromAsset(asset),
          state: "uploading",
          progress: progress.percent,
          loadedBytes: progress.loaded,
          speedBps: progress.speedBps,
          etaSec: progress.etaSec,
        }),
      onSettled: (asset, error) => {
        if (asset) {
          onChange(fromAsset(asset));
          if (asset.status === "failed") toast.error(asset.error || "Processing failed");
          return;
        }
        // Cancelled uploads clear the field; a real failure keeps it, to retry.
        if (!error) {
          onChange(null);
          return;
        }
        onChange({
          id: "",
          name: file.name,
          sizeBytes: file.size,
          progress: 0,
          state: "failed",
          qualities: [],
          error,
          failedStage: "upload",
        });
      },
    });
  };

  const retry = async () => {
    if (!value) return;
    // Processing is the only step that can be rerun on its own; a failed
    // transfer needs the file again.
    if (value.failedStage === "processing" && value.id) {
      try {
        const asset = await uploadApi.retryProcessing(value.id);
        onChange(fromAsset(asset));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not retry processing");
      }
      return;
    }
    inputRef.current?.click();
  };

  const clear = () => {
    // Cancelling in the queue aborts the request and clears the stored bytes.
    if (queueIdRef.current) {
      cancel(queueIdRef.current);
      queueIdRef.current = null;
    } else if (value?.id && (value.state === "uploading" || value.state === "failed")) {
      void uploadApi.cancel(value.id).catch(() => undefined);
    }
    onChange(null);
  };

  /* --------------------------------- view --------------------------------- */

  const detail = value
    ? [
        formatBytes(value.sizeBytes),
        value.durationSec ? formatDuration(value.durationSec) : "",
        value.width && value.height ? `${value.width}×${value.height}` : "",
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <Field label={label} hint={value ? undefined : hint} required={required}>
      <input
        ref={inputRef}
        type="file"
        accept={config?.allowedExtensions.map((e) => `.${e}`).join(",") ?? "video/*"}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) startUpload(file);
        }}
      />

      {!value ? (
        <div className="space-y-2">
          <FileDrop
            accept={config?.allowedExtensions.map((e) => `.${e}`).join(",") ?? "video/*"}
            multiple={false}
            title={`Drop your ${label.toLowerCase()} here`}
            hint={
              config
                ? `${config.allowedExtensions.map((e) => e.toUpperCase()).join(", ")} up to ${Math.round(
                    config.maxSizeBytes / 1024 ** 3,
                  )} GB`
                : "Checking upload limits…"
            }
            onFiles={() => undefined}
            onRawFiles={(files) => {
              const first = files[0];
              if (first) startUpload(first);
            }}
          />
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="text-[12px] font-semibold text-accent underline-offset-2 hover:underline"
          >
            or choose a video already uploaded
          </button>
        </div>
      ) : (
        <div className="rounded-lg bg-surface-2 p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-surface-3 text-ink">
              <Icon name="film" size={18} />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{value.name}</p>
                <Badge
                  tone={
                    value.state === "ready"
                      ? "ok"
                      : value.state === "failed"
                        ? "danger"
                        : value.state === "processing"
                          ? "warn"
                          : "accent"
                  }
                >
                  {uploadStatusLabel(
                    value.state === "idle"
                      ? "waiting"
                      : value.state === "processing"
                        ? "processing"
                        : value.state,
                  )}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted">{detail}</p>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                title="Replace file"
                aria-label="Replace file"
                onClick={() => inputRef.current?.click()}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-3 text-muted transition hover:text-ink"
              >
                <Icon name="upload" size={15} />
              </button>
              <button
                type="button"
                title={value.state === "uploading" ? "Cancel upload" : "Remove file"}
                aria-label={value.state === "uploading" ? "Cancel upload" : "Remove file"}
                onClick={clear}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-3 text-muted transition hover:bg-danger/15 hover:text-danger"
              >
                <Icon name={value.state === "uploading" ? "close" : "trash"} size={15} />
              </button>
            </div>
          </div>

          {value.state === "uploading" ? (
            <div className="mt-3">
              <ProgressBar value={value.progress} tone="accent" size="md" />
              <p className="mt-1.5 text-[11px] text-muted">
                {[
                  `${value.progress}% uploaded`,
                  value.loadedBytes !== undefined
                    ? `${formatBytes(value.loadedBytes)} / ${formatBytes(value.sizeBytes)}`
                    : "",
                  formatSpeed(value.speedBps ?? 0),
                  formatEta(value.etaSec ?? null),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          ) : null}

          {value.state === "processing" ? (
            // The pipeline reports no percentage, so none is shown.
            <p className="mt-3 flex items-center gap-2 text-[12px] text-warn">
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Processing the video…
            </p>
          ) : null}

          {value.state === "failed" ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-danger/10 px-3.5 py-2.5 text-[13px] text-danger">
              <span className="flex min-w-0 items-center gap-2">
                <Icon name="close" size={14} className="shrink-0" />
                <span className="min-w-0">{value.error ?? "Upload failed"}</span>
              </span>
              <Button size="sm" variant="secondary" onClick={() => void retry()}>
                {value.failedStage === "processing" ? "Retry processing" : "Retry upload"}
              </Button>
            </div>
          ) : null}

          {value.state === "ready" ? (
            <video
              controls
              preload="metadata"
              src={value.previewUrl ?? undefined}
              className="mt-3 w-full rounded-lg bg-black"
            />
          ) : null}
        </div>
      )}

      <LibraryPicker
        open={picking}
        onClose={() => setPicking(false)}
        onPick={(asset) => {
          onChange(fromAsset(asset));
          setPicking(false);
        }}
      />
    </Field>
  );
}

/* ---------------------------- library picker ---------------------------- */

function LibraryPicker({
  open, onClose, onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (asset: UploadAsset) => void;
}) {
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search);

  const { data, loading } = useQuery(
    () =>
      open
        ? uploadApi.list({ status: "ready", perPage: 50, search: debounced })
        : Promise.resolve(null),
    [open, debounced],
  );
  const assets = data?.items ?? [];

  return (
    <Modal open={open} onClose={onClose} title="Choose a video" width="max-w-lg">
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search uploaded videos…"
        className="mb-3 h-9 w-full rounded-lg border border-border bg-surface px-3 text-[13px] text-ink outline-none focus:border-accent"
      />
      {loading ? (
        <p className="py-6 text-center text-[13px] text-muted">Loading videos…</p>
      ) : assets.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-muted">
          No processed videos yet. Upload one here or on the Video uploads page.
        </p>
      ) : (
        <ul className="max-h-80 divide-y divide-line overflow-y-auto">
          {assets.map((asset) => (
            <li key={asset.id}>
              <button
                type="button"
                onClick={() => onPick(asset)}
                className="flex w-full items-center gap-3 px-1 py-2.5 text-left transition hover:bg-surface-2"
              >
                <span className="flex h-10 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-2 text-muted">
                  {asset.hasThumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={uploadApi.thumbnailUrl(asset.id, asset.readyAt)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Icon name="film" size={14} />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-ink">
                    {asset.displayName || asset.internalName}
                  </span>
                  <span className="block truncate text-[11px] text-muted">
                    {[
                      asset.fileName,
                      formatBytes(asset.sizeBytes),
                      asset.media.durationSec ? formatDuration(asset.media.durationSec) : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
