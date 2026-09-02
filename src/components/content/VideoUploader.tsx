"use client";

import { useEffect, useRef } from "react";
import { formatBytes } from "@/lib/format";
import type { QualityLevel, UploadState, VideoAsset } from "@/types";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import { Badge, ProgressBar } from "@/components/ui/Primitives";
import { FileDrop } from "@/components/ui/Uploader";
import { Field } from "@/components/ui/Fields";

const QUALITY_LADDER: QualityLevel[] = ["360p", "480p", "720p", "1080p", "4k"];

const STATE_TONES: Record<UploadState, "neutral" | "accent" | "ok" | "danger" | "warn"> = {
  idle: "neutral",
  uploading: "accent",
  processing: "warn",
  ready: "ok",
  failed: "danger",
};

const STATE_LABELS: Record<UploadState, string> = {
  idle: "Waiting",
  uploading: "Uploading",
  processing: "Processing",
  ready: "Ready",
  failed: "Failed",
};

/**
 * File upload with progress, cancel/replace and per-quality processing status.
 *
 * The transfer itself is simulated here so the UI is complete; when the backend
 * lands, replace the ticker in the effect with the real upload progress events —
 * the `VideoAsset` shape it produces is what the API is expected to return.
 */
export default function VideoUploader({
  label, hint, value, onChange, withQualities = true, required,
}: {
  label: string;
  hint?: string;
  value: VideoAsset | null;
  onChange: (asset: VideoAsset | null) => void;
  /** Movies/episodes transcode into a ladder; trailers do not need one. */
  withQualities?: boolean;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
  });

  // Drives upload progress, then the per-quality transcode, one tick at a time.
  useEffect(() => {
    if (!value || (value.state !== "uploading" && value.state !== "processing")) return;

    const timer = setInterval(() => {
      const current = valueRef.current;
      if (!current) return;

      if (current.state === "uploading") {
        const next = Math.min(100, current.progress + 9);
        onChangeRef.current(
          next >= 100
            ? { ...current, progress: 100, state: withQualities ? "processing" : "ready" }
            : { ...current, progress: next },
        );
        return;
      }

      const pending = current.qualities.findIndex((q) => q.state !== "ready");
      onChangeRef.current(
        pending === -1
          ? { ...current, state: "ready" }
          : {
              ...current,
              qualities: current.qualities.map((q, i) => (i === pending ? { ...q, state: "ready" } : q)),
            },
      );
    }, 380);

    return () => clearInterval(timer);
  }, [value, withQualities]);

  const start = (file: File) => {
    onChange({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      name: file.name,
      sizeBytes: file.size,
      progress: 0,
      state: "uploading",
      previewUrl: URL.createObjectURL(file),
      qualities: withQualities
        ? QUALITY_LADDER.map((level) => ({ level, state: "processing" as UploadState }))
        : [],
    });
  };

  return (
    <Field label={label} hint={value ? undefined : hint} required={required}>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) start(file);
          e.target.value = "";
        }}
      />

      {!value ? (
        <FileDrop
          accept="video/*"
          multiple={false}
          title={`Drop your ${label.toLowerCase()} here`}
          hint="MP4, MOV or MKV up to 10 GB"
          onFiles={(files) => {
            const first = files[0];
            if (!first) return;
            onChange({
              id: first.id,
              name: first.name,
              sizeBytes: first.size,
              progress: 0,
              state: "uploading",
              previewUrl: first.previewUrl,
              qualities: withQualities
                ? QUALITY_LADDER.map((level) => ({ level, state: "processing" as UploadState }))
                : [],
            });
          }}
        />
      ) : (
        <div className="rounded-lg bg-surface-2 p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-surface-3 text-ink">
              <Icon name="film" size={18} />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{value.name}</p>
                <Badge tone={STATE_TONES[value.state]}>{STATE_LABELS[value.state]}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted">
                {formatBytes(value.sizeBytes)}
                {value.state === "uploading" ? ` · ${value.progress}% uploaded` : ""}
              </p>
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
                onClick={() => onChange(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-3 text-muted transition hover:bg-danger/15 hover:text-danger"
              >
                <Icon name={value.state === "uploading" ? "close" : "trash"} size={15} />
              </button>
            </div>
          </div>

          {value.state === "uploading" ? (
            <div className="mt-3">
              <ProgressBar value={value.progress} tone="accent" size="md" />
            </div>
          ) : null}

          {value.state === "failed" ? (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-danger/10 px-3.5 py-2.5 text-[13px] text-danger">
              <span className="flex items-center gap-2">
                <Icon name="close" size={14} /> {value.error ?? "Upload failed"}
              </span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onChange({ ...value, state: "uploading", progress: 0, error: undefined })}
              >
                Retry
              </Button>
            </div>
          ) : null}

          {withQualities && value.qualities.length ? (
            <div className="mt-4">
              <p className="mb-2 text-[12px] font-medium text-muted">Quality renditions</p>
              <div className="flex flex-wrap gap-2">
                {value.qualities.map((q) => {
                  const ready = q.state === "ready" && value.state !== "uploading";
                  return (
                    <span
                      key={q.level}
                      className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold ${
                        ready ? "bg-ok/15 text-ok" : "bg-surface-3 text-muted"
                      }`}
                    >
                      {ready ? <Icon name="check" size={12} /> : <Icon name="clock" size={12} />}
                      {q.level.toUpperCase()}
                    </span>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </Field>
  );
}
