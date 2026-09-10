import type { IconName } from "@/components/ui/Icon";
import type { UploadConfig, UploadStatus } from "@/types";

/* -------------------------------- labels -------------------------------- */

export const UPLOAD_STATUS_LABELS: Record<UploadStatus, string> = {
  waiting: "Waiting",
  uploading: "Uploading",
  uploaded: "Uploaded",
  processing: "Processing",
  ready: "Ready",
  failed: "Failed",
  cancelled: "Cancelled",
};

export const UPLOAD_STATUS_TONES: Record<
  UploadStatus,
  "neutral" | "accent" | "ok" | "warn" | "danger"
> = {
  waiting: "neutral",
  uploading: "accent",
  uploaded: "accent",
  processing: "warn",
  ready: "ok",
  failed: "danger",
  cancelled: "neutral",
};

export const UPLOAD_STATUS_ICONS: Record<UploadStatus, IconName> = {
  waiting: "clock",
  uploading: "upload",
  uploaded: "check",
  processing: "bolt",
  ready: "check",
  failed: "close",
  cancelled: "close",
};

export const UPLOAD_STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "uploading", label: "Uploading" },
  { value: "processing", label: "Processing" },
  { value: "ready", label: "Ready" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

export const uploadStatusLabel = (status: UploadStatus) => UPLOAD_STATUS_LABELS[status];

/** Still moving — the dock keeps polling while any item is in one of these. */
export const IN_FLIGHT: UploadStatus[] = ["waiting", "uploading", "uploaded", "processing"];

/* ------------------------------ validation ------------------------------ */

export interface RejectedFile {
  name: string;
  reason: string;
}

export interface DuplicateFile {
  file: File;
  existing: string;
}

export interface ValidationResult {
  accepted: File[];
  rejected: RejectedFile[];
  /** Same name and size as something already uploaded — the admin decides. */
  duplicates: DuplicateFile[];
}

const extensionOf = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";

const gb = (bytes: number) => `${(bytes / 1024 ** 3).toFixed(bytes % 1024 ** 3 === 0 ? 0 : 1)} GB`;

/**
 * The quick check, so the admin hears about a wrong file before a byte moves.
 * The API runs the same rules again — this one is only for the waiting time.
 */
export function validateFiles(
  files: File[],
  config: UploadConfig | null,
  known: { fileName: string; sizeBytes: number }[] = [],
): ValidationResult {
  const result: ValidationResult = { accepted: [], rejected: [], duplicates: [] };

  for (const file of files) {
    const ext = extensionOf(file.name);

    if (config && !config.allowedExtensions.includes(ext)) {
      result.rejected.push({
        name: file.name,
        reason: `Not a supported video format (.${ext}). Supported: ${config.allowedExtensions
          .map((e) => e.toUpperCase())
          .join(", ")}.`,
      });
      continue;
    }
    if (file.size === 0) {
      result.rejected.push({ name: file.name, reason: "The file is empty." });
      continue;
    }
    if (config && file.size > config.maxSizeBytes) {
      result.rejected.push({
        name: file.name,
        reason: `Larger than the ${gb(config.maxSizeBytes)} limit.`,
      });
      continue;
    }

    const twin = known.find((k) => k.fileName === file.name && k.sizeBytes === file.size);
    if (twin) result.duplicates.push({ file, existing: twin.fileName });
    else result.accepted.push(file);
  }

  return result;
}

/** "12.4 MB/s" from a raw byte rate. */
export function formatSpeed(bytesPerSecond: number): string {
  if (!bytesPerSecond || !Number.isFinite(bytesPerSecond)) return "";
  const units = ["B/s", "KB/s", "MB/s", "GB/s"];
  let value = bytesPerSecond;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

/** "about 3 min left" — only ever shown when the number is measured. */
export function formatEta(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return "";
  if (seconds < 60) return `${Math.max(1, Math.round(seconds))}s left`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min left`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m left`;
}
