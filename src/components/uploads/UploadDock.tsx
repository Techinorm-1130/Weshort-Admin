"use client";

import { useRouter } from "next/navigation";
import { formatBytes } from "@/lib/format";
import { UPLOAD_STATUS_TONES, formatEta, formatSpeed, uploadStatusLabel } from "@/lib/upload/uploadMeta";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import { Badge, ProgressBar } from "@/components/ui/Primitives";
import { useUploadManager } from "./UploadManager";

/**
 * The floating upload manager.
 *
 * It sits in the admin layout so it survives navigation: start ten uploads,
 * walk off to Users, and they keep going with the numbers still ticking here.
 */
export default function UploadDock() {
  const router = useRouter();
  const { items, collapsed, setCollapsed, cancel, retry, remove, requestOpen } = useUploadManager();

  if (!items.length) return null;

  const count = (...statuses: string[]) => items.filter((i) => statuses.includes(i.status)).length;
  const uploading = count("waiting", "uploading");
  const processing = count("uploaded", "processing");
  const ready = count("ready");
  const failed = count("failed");

  const summary = [
    uploading ? `${uploading} uploading` : "",
    processing ? `${processing} processing` : "",
    ready ? `${ready} ready` : "",
    failed ? `${failed} failed` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(380px,calc(100vw-2rem))]">
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-pop)]">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center gap-2.5 border-b border-line px-3.5 py-2.5 text-left transition hover:bg-surface-2"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
            <Icon name="upload" size={14} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold text-ink">
              Uploads · {items.length} file{items.length === 1 ? "" : "s"}
            </span>
            <span className="block truncate text-[11px] text-muted">{summary || "Finished"}</span>
          </span>
          <Icon
            name="chevron-down"
            size={15}
            className={`text-muted transition ${collapsed ? "rotate-180" : ""}`}
          />
        </button>

        {collapsed ? null : (
          <>
            <ul className="max-h-[46vh] divide-y divide-line overflow-y-auto">
              {items.map((item) => (
                <li key={item.localId} className="px-3.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <p className="min-w-0 flex-1 truncate text-[12px] font-medium text-ink">
                      {item.fileName}
                    </p>
                    <Badge tone={UPLOAD_STATUS_TONES[item.status]}>{uploadStatusLabel(item.status)}</Badge>
                  </div>

                  {item.status === "uploading" ? (
                    <div className="mt-1.5">
                      <ProgressBar value={item.progress.percent} tone="accent" />
                      <p className="mt-1 truncate text-[11px] text-muted">
                        {[
                          `${item.progress.percent}%`,
                          `${formatBytes(item.progress.loaded)} / ${formatBytes(item.sizeBytes)}`,
                          formatSpeed(item.progress.speedBps),
                          formatEta(item.progress.etaSec),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  ) : null}

                  {item.status === "processing" || item.status === "uploaded" ? (
                    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-warn">
                      <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      Processing…
                    </p>
                  ) : null}

                  {item.status === "failed" ? (
                    <p className="mt-1 text-[11px] text-danger">{item.error}</p>
                  ) : null}

                  <div className="mt-1.5 flex items-center gap-1.5">
                    {item.status === "uploading" ? (
                      <Button size="sm" variant="ghost" onClick={() => cancel(item.localId)}>
                        Cancel
                      </Button>
                    ) : null}
                    {item.status === "failed" || item.status === "cancelled" ? (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => retry(item.localId)}>
                          {item.failedStage === "processing" ? "Retry processing" : "Retry"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(item.localId)}>
                          Remove
                        </Button>
                      </>
                    ) : null}
                    {item.status === "ready" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (item.assetId) requestOpen(item.assetId);
                          router.push("/videos");
                        }}
                      >
                        View details
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between border-t border-line px-3.5 py-2">
              <span className="text-[11px] text-muted">Uploads continue while you work</span>
              <Button size="sm" variant="ghost" onClick={() => router.push("/videos")}>
                Open uploads
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
