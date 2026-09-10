"use client";

/* ---------------------------------------------------------------------------
 * The upload queue, held above the page tree.
 *
 * It lives in the admin layout, so moving between dashboard pages does not
 * interrupt a transfer. Every number it exposes is measured: upload progress
 * comes from the XHR progress events, and once the bytes have landed the status
 * comes from polling the API — the client never advances a state by itself.
 * ------------------------------------------------------------------------ */

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import type { UploadAsset, UploadConfig, UploadStatus } from "@/types";
import {
  probeVideo, sendFile, uploadApi, type Transfer, type TransferProgress,
} from "@/lib/upload/client";
import { IN_FLIGHT } from "@/lib/upload/uploadMeta";

export interface QueueItem {
  /** Stable id for this queue row; the asset id arrives once the API has it. */
  localId: string;
  file: File;
  fileName: string;
  sizeBytes: number;
  assetId: string | null;
  status: UploadStatus;
  progress: TransferProgress;
  error: string;
  failedStage: "upload" | "processing" | "";
  duplicateOf: string | null;
}

interface UploadManagerValue {
  items: QueueItem[];
  config: UploadConfig | null;
  /** Bumped whenever an asset reaches a final state, so lists can refresh. */
  version: number;
  enqueue: (files: File[]) => void;
  cancel: (localId: string) => void;
  retry: (localId: string) => void;
  remove: (localId: string) => void;
  clearFinished: () => void;
  /** Asset the dock asked the uploads page to open, if any. */
  pendingOpenId: string | null;
  requestOpen: (assetId: string) => void;
  clearPendingOpen: () => void;
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}

const noop = () => undefined;

const UploadManagerContext = createContext<UploadManagerValue>({
  items: [],
  config: null,
  version: 0,
  enqueue: noop,
  cancel: noop,
  retry: noop,
  remove: noop,
  clearFinished: noop,
  pendingOpenId: null,
  requestOpen: noop,
  clearPendingOpen: noop,
  collapsed: false,
  setCollapsed: noop,
});

export const useUploadManager = () => useContext(UploadManagerContext);

const emptyProgress: TransferProgress = {
  loaded: 0,
  total: 0,
  percent: 0,
  speedBps: 0,
  etaSec: null,
};

const POLL_MS = 1500;

export default function UploadManagerProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [config, setConfig] = useState<UploadConfig | null>(null);
  const [version, setVersion] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [pendingOpenId, setPendingOpenId] = useState<string | null>(null);

  /** Mirrors `items` so the pump can read the queue without stale closures. */
  const itemsRef = useRef<QueueItem[]>([]);
  const transfers = useRef(new Map<string, Transfer>());
  const configRef = useRef<UploadConfig | null>(null);

  useEffect(() => {
    itemsRef.current = items;
  });

  useEffect(() => {
    let alive = true;
    uploadApi
      .config()
      .then((value) => {
        if (!alive) return;
        configRef.current = value;
        setConfig(value);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const patch = useCallback((localId: string, values: Partial<QueueItem>) => {
    setItems((prev) => prev.map((item) => (item.localId === localId ? { ...item, ...values } : item)));
  }, []);

  /* ------------------------------- the pump ------------------------------ */

  /** Held in a ref so the pump and the transfer can call each other. */
  const startRef = useRef<(item: QueueItem) => Promise<void>>(async () => undefined);

  const pump = useCallback(() => {
    const parallel = configRef.current?.maxParallelUploads ?? 3;
    const running = itemsRef.current.filter((i) => i.status === "uploading").length;
    const next = itemsRef.current
      .filter((i) => i.status === "waiting")
      .slice(0, Math.max(0, parallel - running));

    for (const item of next) {
      // Mark it here so a second pump in the same tick cannot start it twice.
      itemsRef.current = itemsRef.current.map((i) =>
        i.localId === item.localId ? { ...i, status: "uploading" as UploadStatus } : i,
      );
      patch(item.localId, { status: "uploading", error: "", failedStage: "" });
      void startRef.current(item);
    }
  }, [patch]);

  const start = useCallback(
    async (item: QueueItem) => {
      try {
        // Registering the asset first means the file is only ever sent to a
        // record the backend has already accepted.
        let assetId = item.assetId;
        if (!assetId) {
          const media = await probeVideo(item.file);
          const asset = await uploadApi.create({
            fileName: item.file.name,
            sizeBytes: item.file.size,
            contentType: item.file.type,
            media,
          });
          assetId = asset.id;
          patch(item.localId, { assetId });
        }

        const transfer = sendFile(assetId, item.file, (progress) =>
          patch(item.localId, { progress }),
        );
        transfers.current.set(item.localId, transfer);

        const uploaded = await transfer.promise;
        patch(item.localId, {
          status: uploaded.status,
          duplicateOf: uploaded.duplicateOf,
          progress: {
            ...emptyProgress,
            loaded: uploaded.receivedBytes,
            total: uploaded.receivedBytes,
            percent: 100,
          },
        });
      } catch (error) {
        const aborted = error instanceof DOMException && error.name === "AbortError";
        patch(item.localId, {
          status: aborted ? "cancelled" : "failed",
          failedStage: aborted ? "" : "upload",
          error: aborted ? "" : error instanceof Error ? error.message : "Upload failed",
        });
      } finally {
        transfers.current.delete(item.localId);
        setVersion((v) => v + 1);
        pump();
      }
    },
    [patch, pump],
  );

  useEffect(() => {
    startRef.current = start;
  });

  /* ------------------------------- polling ------------------------------- */

  const watched = items
    .filter((i) => i.assetId && (i.status === "uploaded" || i.status === "processing"))
    .map((i) => i.assetId as string);
  const watchKey = watched.join(",");

  useEffect(() => {
    if (!watchKey) return;

    let alive = true;
    const tick = async () => {
      try {
        const assets = await uploadApi.statusOf(watchKey.split(","));
        if (!alive) return;
        setItems((prev) =>
          prev.map((item) => {
            const asset = assets.find((a: UploadAsset) => a.id === item.assetId);
            if (!asset || asset.status === item.status) return item;
            return {
              ...item,
              status: asset.status,
              error: asset.error,
              failedStage: asset.failedStage,
              duplicateOf: asset.duplicateOf,
            };
          }),
        );
        if (assets.some((a: UploadAsset) => !IN_FLIGHT.includes(a.status))) {
          setVersion((v) => v + 1);
        }
      } catch {
        /* a dropped poll is not worth surfacing; the next one will land */
      }
    };

    const timer = setInterval(tick, POLL_MS);
    void tick();
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [watchKey]);

  /* ------------------------------- actions ------------------------------- */

  const enqueue = useCallback(
    (files: File[]) => {
      if (!files.length) return;
      const added: QueueItem[] = files.map((file, index) => ({
        localId: `q_${Date.now().toString(36)}_${index}_${Math.random().toString(36).slice(2, 7)}`,
        file,
        fileName: file.name,
        sizeBytes: file.size,
        assetId: null,
        status: "waiting",
        progress: { ...emptyProgress, total: file.size },
        error: "",
        failedStage: "",
        duplicateOf: null,
      }));

      itemsRef.current = [...itemsRef.current, ...added];
      setItems((prev) => [...prev, ...added]);
      setCollapsed(false);
      pump();
    },
    [pump],
  );

  const cancel = useCallback(
    (localId: string) => {
      const item = itemsRef.current.find((i) => i.localId === localId);
      transfers.current.get(localId)?.abort();
      patch(localId, { status: "cancelled", error: "", failedStage: "" });
      itemsRef.current = itemsRef.current.map((i) =>
        i.localId === localId ? { ...i, status: "cancelled" as UploadStatus } : i,
      );
      // Tell the server too, so the partial file is cleaned up.
      if (item?.assetId) void uploadApi.cancel(item.assetId).catch(() => undefined);
      setVersion((v) => v + 1);
      pump();
    },
    [patch, pump],
  );

  const retry = useCallback(
    (localId: string) => {
      const item = itemsRef.current.find((i) => i.localId === localId);
      if (!item) return;

      // Processing failed on a file that is already stored — rerun that step
      // only, no second upload.
      if (item.assetId && item.failedStage === "processing") {
        patch(localId, { status: "processing", error: "", failedStage: "" });
        void uploadApi
          .retryProcessing(item.assetId)
          .catch((error: unknown) =>
            patch(localId, {
              status: "failed",
              failedStage: "processing",
              error: error instanceof Error ? error.message : "Retry failed",
            }),
          );
        return;
      }

      // The browser still holds the file, so a failed transfer just goes again.
      const reset: Partial<QueueItem> = {
        status: "waiting",
        error: "",
        failedStage: "",
        assetId: null,
        progress: { ...emptyProgress, total: item.sizeBytes },
      };
      itemsRef.current = itemsRef.current.map((i) => (i.localId === localId ? { ...i, ...reset } : i));
      patch(localId, reset);
      pump();
    },
    [patch, pump],
  );

  const remove = useCallback(
    (localId: string) => {
      transfers.current.get(localId)?.abort();
      transfers.current.delete(localId);
      itemsRef.current = itemsRef.current.filter((i) => i.localId !== localId);
      setItems((prev) => prev.filter((i) => i.localId !== localId));
      pump();
    },
    [pump],
  );

  const clearFinished = useCallback(() => {
    itemsRef.current = itemsRef.current.filter((i) => IN_FLIGHT.includes(i.status));
    setItems((prev) => prev.filter((i) => IN_FLIGHT.includes(i.status)));
  }, []);

  const requestOpen = useCallback((assetId: string) => setPendingOpenId(assetId), []);
  const clearPendingOpen = useCallback(() => setPendingOpenId(null), []);

  const value = useMemo<UploadManagerValue>(
    () => ({
      items,
      config,
      version,
      enqueue,
      cancel,
      retry,
      remove,
      clearFinished,
      pendingOpenId,
      requestOpen,
      clearPendingOpen,
      collapsed,
      setCollapsed,
    }),
    [
      items, config, version, enqueue, cancel, retry, remove, clearFinished, pendingOpenId,
      requestOpen, clearPendingOpen, collapsed,
    ],
  );

  return <UploadManagerContext.Provider value={value}>{children}</UploadManagerContext.Provider>;
}
