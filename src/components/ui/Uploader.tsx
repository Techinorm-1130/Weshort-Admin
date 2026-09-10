"use client";

import { useRef, useState, type DragEvent } from "react";
import { formatBytes } from "@/lib/format";
import { displayableImage, uploadImage } from "@/lib/upload/client";
import Icon from "./Icon";

/* ------------------------------- file drop ------------------------------ */

export interface DroppedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  /** Object URL kept only for the local preview; the backend returns the real one. */
  previewUrl: string;
}

export function FileDrop({
  onFiles, onRawFiles, accept = "video/*,audio/*,.vtt,.srt",
  hint = "Supports MOV, MP4, MKV, WAV, VTT up to 10 GB",
  title = "Drop your video, audio or subtitle file here", multiple = true, compact = false,
}: {
  onFiles: (files: DroppedFile[]) => void;
  /** The untouched File objects, for callers that upload the bytes themselves. */
  onRawFiles?: (files: File[]) => void;
  accept?: string;
  hint?: string;
  title?: string;
  multiple?: boolean;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const handle = (list: FileList | null) => {
    if (!list?.length) return;
    onRawFiles?.(Array.from(list));
    onFiles(
      Array.from(list).map((f) => ({
        id: `${f.name}-${f.size}-${f.lastModified}`,
        name: f.name,
        size: f.size,
        type: f.type,
        previewUrl: URL.createObjectURL(f),
      })),
    );
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    handle(e.dataTransfer.files);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-[22px] border-2 border-dashed text-center transition ${
        compact ? "gap-1.5 px-4 py-6" : "gap-3 px-6 py-12"
      } ${over ? "border-accent bg-accent-soft" : "border-border-strong hover:border-ink/40 hover:bg-surface-2"}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={(e) => handle(e.target.files)}
      />
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted">
        <Icon name="upload" size={20} />
      </span>
      <p className={`font-semibold text-ink ${compact ? "text-[13px]" : "text-sm"}`}>{title}</p>
      <p className="text-xs text-muted">{hint}</p>
    </div>
  );
}

/* -------------------------------- file row ------------------------------ */

export function FileRow({
  name, size, kind, onRemove,
}: {
  name: string;
  size: number;
  kind: "video" | "audio" | "subtitle";
  onRemove?: () => void;
}) {
  const icon = kind === "audio" ? "music" : kind === "subtitle" ? "file" : "film";
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-3 text-ink">
        <Icon name={icon} size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-ink">{name}</span>
        <span className="block text-xs text-muted">{formatBytes(size)}</span>
      </span>
      {onRemove ? (
        <button
          onClick={onRemove}
          aria-label="Remove file"
          className="rounded-full p-2 text-muted transition hover:bg-danger/15 hover:text-danger"
        >
          <Icon name="trash" size={15} />
        </button>
      ) : null}
    </div>
  );
}

/* ------------------------------- image drop ----------------------------- */

/**
 * Artwork slot.
 *
 * The file is uploaded and the record keeps the URL. It used to keep a base64
 * data URL instead, which meant a multi-megabyte poster travelled inside every
 * copy of the row — and the public site, which had the same field as an object
 * URL, showed a broken image here. Both go through /api/images now.
 */
export function ImageDrop({
  ratio, value, onChange, label,
}: {
  ratio: string;
  value?: string;
  onChange: (url: string | undefined) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [w, h] = ratio.split(":").map(Number);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const src = displayableImage(value);

  const pick = async (file?: File) => {
    if (!file) return;
    setProblem("");
    setBusy(true);
    try {
      onChange(await uploadImage(file));
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "Could not upload that image");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        style={{ aspectRatio: `${w} / ${h}` }}
        className="group relative w-full overflow-hidden rounded-2xl bg-surface-2 ring-1 ring-border transition hover:ring-ink/40"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            void pick(file);
          }}
        />
        {busy ? (
          <span className="flex h-full w-full items-center justify-center text-muted">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </span>
        ) : src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-muted transition group-hover:text-ink">
            <Icon name="upload" size={26} />
          </span>
        )}
        {value ? (
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(undefined);
            }}
            className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white/80 opacity-0 transition group-hover:opacity-100 hover:text-white"
          >
            <Icon name="trash" size={13} />
          </span>
        ) : null}
      </button>
      <span className="text-xs text-muted">{label ?? ratio}</span>
      {problem ? <span className="text-[11px] text-danger">{problem}</span> : null}
    </div>
  );
}
