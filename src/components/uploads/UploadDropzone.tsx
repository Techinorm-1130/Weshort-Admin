"use client";

import { useRef, useState, type DragEvent } from "react";
import type { UploadConfig } from "@/types";
import { validateFiles, type RejectedFile } from "@/lib/upload/uploadMeta";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { Card } from "@/components/ui/Primitives";

/**
 * Click or drop, one file or twenty. The accepted formats and the size cap are
 * whatever the API reports — nothing about them is written into this component.
 */
export default function UploadDropzone({
  config, known, onAccepted,
}: {
  config: UploadConfig | null;
  /** Assets already in the library, so a re-upload can be flagged. */
  known: { fileName: string; sizeBytes: number }[];
  onAccepted: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [rejected, setRejected] = useState<RejectedFile[]>([]);
  const [duplicates, setDuplicates] = useState<File[]>([]);

  const formats = config?.allowedExtensions.map((e) => e.toUpperCase()).join(", ") ?? "";
  const limit = config ? `${(config.maxSizeBytes / 1024 ** 3).toFixed(0)} GB` : "";

  const take = (list: FileList | null) => {
    if (!list?.length) return;
    const result = validateFiles(Array.from(list), config, known);
    setRejected(result.rejected);
    setDuplicates(result.duplicates.map((d) => d.file));
    if (result.accepted.length) onAccepted(result.accepted);
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setOver(false);
    take(event.dataTransfer.files);
  };

  return (
    <Card className="mb-4">
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        accept={config?.allowedExtensions.map((e) => `.${e}`).join(",")}
        onChange={(event) => {
          take(event.target.files);
          event.target.value = "";
        }}
      />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
          over ? "border-accent bg-accent-soft" : "border-border hover:border-border-strong hover:bg-surface-2"
        }`}
      >
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Icon name="upload" size={20} />
        </span>
        <p className="font-display text-[15px] font-bold text-ink">Drag &amp; drop your video files here</p>
        <p className="mt-1 text-[13px] text-muted">or</p>
        <div className="mt-3">
          <Button
            icon="plus"
            onClick={(event) => {
              event.stopPropagation();
              inputRef.current?.click();
            }}
          >
            Select videos
          </Button>
        </div>
        <p className="mt-3 text-[12px] text-muted">
          {config ? (
            <>
              Supported: {formats} · up to {limit} per file · several at once
            </>
          ) : (
            "Checking upload limits…"
          )}
        </p>
      </div>

      {rejected.length ? (
        <div className="mt-3 space-y-2">
          {rejected.map((file) => (
            <div
              key={file.name}
              className="flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/8 px-3.5 py-2.5 text-[13px] text-danger"
            >
              <Icon name="close" size={14} className="mt-0.5 shrink-0" />
              <p>
                <strong className="font-semibold">Invalid video format</strong> — the file &ldquo;{file.name}
                &rdquo; was not added. {file.reason}
              </p>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setRejected([])}
            className="text-[12px] text-muted underline-offset-2 hover:text-ink hover:underline"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {duplicates.length ? (
        <div className="mt-3 rounded-lg border border-warn/30 bg-warn/8 px-3.5 py-3 text-[13px] text-warn">
          <p className="flex items-start gap-2.5">
            <Icon name="shield" size={14} className="mt-0.5 shrink-0" />
            <span>
              <strong className="font-semibold">Already uploaded</strong> —{" "}
              {duplicates.map((f) => `"${f.name}"`).join(", ")} matches a video in the library. Uploading it
              again creates a second asset; nothing is overwritten.
            </span>
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                onAccepted(duplicates);
                setDuplicates([]);
              }}
            >
              Upload anyway
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDuplicates([])}>
              Skip
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
