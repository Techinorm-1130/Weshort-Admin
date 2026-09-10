"use client";

import { formatBytes } from "@/lib/format";
import type { QueueItem } from "./UploadManager";
import {
  UPLOAD_STATUS_ICONS, UPLOAD_STATUS_TONES, formatEta, formatSpeed, uploadStatusLabel,
} from "@/lib/upload/uploadMeta";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { Badge, Card, ProgressBar } from "@/components/ui/Primitives";

/** What the admin can do with a row depends on where it is in the flow. */
function RowActions({
  item, onCancel, onRetry, onRemove, onOpen, size = "sm",
}: {
  item: QueueItem;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
  onOpen?: (assetId: string) => void;
  size?: "sm" | "md";
}) {
  if (item.status === "uploading") {
    return (
      <Button size={size} variant="secondary" icon="close" onClick={() => onCancel(item.localId)}>
        Cancel
      </Button>
    );
  }
  if (item.status === "waiting") {
    return (
      <Button size={size} variant="ghost" icon="trash" onClick={() => onRemove(item.localId)}>
        Remove
      </Button>
    );
  }
  if (item.status === "failed") {
    return (
      <div className="flex items-center gap-1.5">
        <Button size={size} variant="secondary" icon="upload" onClick={() => onRetry(item.localId)}>
          {item.failedStage === "processing" ? "Retry processing" : "Retry"}
        </Button>
        <Button size={size} variant="ghost" icon="trash" onClick={() => onRemove(item.localId)}>
          Remove
        </Button>
      </div>
    );
  }
  if (item.status === "ready" && item.assetId && onOpen) {
    return (
      <Button size={size} variant="secondary" icon="eye" onClick={() => onOpen(item.assetId as string)}>
        View details
      </Button>
    );
  }
  if (item.status === "cancelled") {
    return (
      <div className="flex items-center gap-1.5">
        <Button size={size} variant="secondary" icon="upload" onClick={() => onRetry(item.localId)}>
          Upload again
        </Button>
        <Button size={size} variant="ghost" icon="trash" onClick={() => onRemove(item.localId)}>
          Remove
        </Button>
      </div>
    );
  }
  return null;
}

/** The progress line: real bytes, real speed, real time remaining. */
function ProgressCell({ item }: { item: QueueItem }) {
  if (item.status === "uploading") {
    const { loaded, total, percent, speedBps, etaSec } = item.progress;
    const parts = [
      `${formatBytes(loaded)} / ${formatBytes(total || item.sizeBytes)}`,
      formatSpeed(speedBps),
      formatEta(etaSec),
    ].filter(Boolean);
    return (
      <div className="min-w-[180px]">
        <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
          <span>{percent}% uploaded</span>
        </div>
        <ProgressBar value={percent} tone="accent" size="md" />
        <p className="mt-1 truncate text-[11px] text-muted">{parts.join(" · ")}</p>
      </div>
    );
  }

  if (item.status === "processing" || item.status === "uploaded") {
    // No percentage is invented here: the pipeline does not report one.
    return (
      <span className="inline-flex items-center gap-2 text-[12px] text-warn">
        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
        {item.status === "uploaded" ? "Queued for processing…" : "Processing…"}
      </span>
    );
  }

  if (item.status === "failed") {
    return <p className="max-w-[280px] text-[12px] text-danger">{item.error || "Failed"}</p>;
  }
  if (item.status === "ready") {
    return <span className="text-[12px] text-ok">Processing completed</span>;
  }
  if (item.status === "cancelled") {
    return <span className="text-[12px] text-muted">Cancelled — nothing was stored</span>;
  }
  return <span className="text-[12px] text-muted">Waiting for a free slot</span>;
}

/* --------------------------------- table -------------------------------- */

export default function UploadQueue({
  items, onCancel, onRetry, onRemove, onOpen, onClear,
}: {
  items: QueueItem[];
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
  onOpen: (assetId: string) => void;
  onClear: () => void;
}) {
  if (!items.length) return null;

  const finished = items.filter((i) => ["ready", "failed", "cancelled"].includes(i.status)).length;

  return (
    <Card className="mb-4" padded={false}>
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
        <h2 className="font-display text-[14px] font-bold text-ink">Upload queue</h2>
        <span className="text-[12px] text-muted">
          {items.length} file{items.length === 1 ? "" : "s"}
        </span>
        {finished ? (
          <Button className="ml-auto" size="sm" variant="ghost" icon="check" onClick={onClear}>
            Clear finished
          </Button>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="border-b border-line text-left text-[12px] font-semibold text-muted">
              <th className="px-4 py-2.5">File name</th>
              <th className="px-4 py-2.5 w-28">Size</th>
              <th className="px-4 py-2.5 w-32">Status</th>
              <th className="px-4 py-2.5">Progress</th>
              <th className="px-4 py-2.5 w-56 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((item) => (
              <tr key={item.localId} className="text-[13px] text-ink">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-2 text-muted">
                      <Icon name="film" size={15} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{item.fileName}</p>
                      {item.duplicateOf ? (
                        <p className="truncate text-[11px] text-warn">
                          Same file as an existing video — kept as a separate asset
                        </p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted">{formatBytes(item.sizeBytes)}</td>
                <td className="px-4 py-3">
                  <Badge tone={UPLOAD_STATUS_TONES[item.status]}>
                    <Icon name={UPLOAD_STATUS_ICONS[item.status]} size={11} className="mr-1" />
                    {uploadStatusLabel(item.status)}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <ProgressCell item={item} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <RowActions
                      item={item}
                      onCancel={onCancel}
                      onRetry={onRetry}
                      onRemove={onRemove}
                      onOpen={onOpen}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export { ProgressCell, RowActions };
