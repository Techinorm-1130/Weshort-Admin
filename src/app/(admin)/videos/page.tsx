"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UploadAsset } from "@/types";
import { useDebounced, useQuery } from "@/lib/hooks";
import { formatBytes, formatDate, formatDuration } from "@/lib/format";
import { uploadApi } from "@/lib/upload/client";
import {
  UPLOAD_STATUS_FILTERS, UPLOAD_STATUS_TONES, uploadStatusLabel,
} from "@/lib/upload/uploadMeta";
import PageHeader from "@/components/ui/PageHeader";
import Button, { IconButton } from "@/components/ui/Button";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { Pagination, SearchInput } from "@/components/ui/Toolbar";
import { Badge, Card, ErrorBox } from "@/components/ui/Primitives";
import { ConfirmDialog, Dropdown } from "@/components/ui/Overlays";
import { DateInput } from "@/components/ui/Fields";
import Icon from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { useUploadManager } from "@/components/uploads/UploadManager";
import UploadQueue from "@/components/uploads/UploadQueue";
import VideoDetailsDrawer from "@/components/uploads/VideoDetailsDrawer";

const PER_PAGE = 10;

export default function VideoFilesPage() {
  const router = useRouter();
  const toast = useToast();
  const {
    items, cancel, retry, remove, clearFinished, version, pendingOpenId, clearPendingOpen,
  } = useUploadManager();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(PER_PAGE);
  const debounced = useDebounced(search);

  const [ownOpenId, setOwnOpenId] = useState<string | null>(null);
  /** The dock can ask this page to open a video the moment it turns ready. */
  const openId = ownOpenId ?? pendingOpenId;
  const [toDelete, setToDelete] = useState<UploadAsset | null>(null);
  const [deleting, setDeleting] = useState(false);

  const list = useQuery(
    () => uploadApi.list({ search: debounced, status, from, to, sort, page, perPage }),
    [debounced, status, from, to, sort, page, perPage, version],
  );

  const opened = useQuery(
    () => (openId ? uploadApi.get(openId) : Promise.resolve(null)),
    [openId, version],
  );

  const openAsset = (id: string) => {
    clearPendingOpen();
    setOwnOpenId(id);
  };

  const closeDrawer = () => {
    clearPendingOpen();
    setOwnOpenId(null);
  };

  const rows = list.data?.items ?? [];
  const total = list.data?.total ?? 0;

  const refreshAll = () => {
    list.refresh();
    opened.refresh();
  };

  /* ------------------------------- actions ------------------------------- */

  const cancelAsset = async (asset: UploadAsset) => {
    // A transfer this tab started is aborted locally; anything else is stopped
    // on the server, which is what clears the partial file either way.
    const queued = items.find((i) => i.assetId === asset.id && i.status === "uploading");
    if (queued) {
      cancel(queued.localId);
    } else {
      await uploadApi.cancel(asset.id).catch(() => undefined);
    }
    toast.success(`Upload of "${asset.internalName}" cancelled`);
    refreshAll();
  };

  const retryProcessing = async (asset: UploadAsset) => {
    try {
      await uploadApi.retryProcessing(asset.id);
      toast.success("Processing started again");
      refreshAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not retry processing");
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await uploadApi.remove(toDelete.id);
      toast.success(`"${toDelete.internalName}" and its stored file were deleted`);
      setToDelete(null);
      if (openId === toDelete.id) closeDrawer();
      refreshAll();
    } catch (error) {
      // The API refuses while a title still points at the asset.
      toast.error(error instanceof Error ? error.message : "Could not delete this video");
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  /* -------------------------------- table -------------------------------- */

  const columns: Column<UploadAsset>[] = [
    {
      key: "thumbnail",
      header: "Preview",
      width: "92px",
      cell: (row) => (
        <div className="flex h-11 w-16 items-center justify-center overflow-hidden rounded-md border border-line bg-surface-2">
          {row.hasThumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={uploadApi.thumbnailUrl(row.id, row.readyAt)}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <Icon name="film" size={15} className="text-muted" />
          )}
        </div>
      ),
    },
    {
      key: "internalName",
      header: "Video name",
      sortKey: "fileName",
      width: "34%",
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{row.internalName}</p>
          <p className="truncate text-[11px] text-muted">{row.fileName}</p>
        </div>
      ),
    },
    {
      key: "displayName",
      header: "Display name",
      width: "16%",
      cell: (row) => (
        <span className="block truncate text-[13px] text-muted-strong">{row.displayName || "—"}</span>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      align: "center",
      width: "104px",
      sortKey: "durationSec",
      cell: (row) => (
        <span className="whitespace-nowrap tabular-nums text-[13px]">
          {row.media.durationSec ? formatDuration(row.media.durationSec) : "—"}
        </span>
      ),
    },
    {
      key: "size",
      header: "Size",
      align: "center",
      width: "104px",
      sortKey: "sizeBytes",
      cell: (row) => <span className="whitespace-nowrap text-[13px]">{formatBytes(row.sizeBytes)}</span>,
    },
    {
      key: "resolution",
      header: "Resolution",
      align: "center",
      width: "124px",
      cell: (row) => (
        <span className="whitespace-nowrap text-[13px]">
          {row.media.width && row.media.height ? `${row.media.width}×${row.media.height}` : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      width: "132px",
      cell: (row) => (
        <div>
          <Badge tone={UPLOAD_STATUS_TONES[row.status]}>{uploadStatusLabel(row.status)}</Badge>
          {row.status === "failed" && row.error ? (
            <p className="mt-1 max-w-[220px] text-[11px] text-danger">{row.error}</p>
          ) : null}
        </div>
      ),
      filter: {
        value: status,
        options: UPLOAD_STATUS_FILTERS.filter((f) => f.value !== "all"),
        onChange: (value) => {
          setStatus(value);
          setPage(1);
        },
      },
    },
    {
      key: "createdAt",
      header: "Uploaded",
      align: "right",
      width: "116px",
      sortKey: "createdAt",
      cell: (row) => <span className="whitespace-nowrap text-[13px]">{formatDate(row.createdAt)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Video files"
        count={total}
        icon="film"
        iconColor="#0d9488"
        crumbs={[{ label: "Catalogue" }, { label: "Video files" }]}
        subtitle="Every video sent to storage — status, details and playback. Videos are added in Upload content."
        actions={
          <Button icon="plus" onClick={() => router.push("/content/upload")}>
            Upload content
          </Button>
        }
      />

      <UploadQueue
        items={items}
        onCancel={cancel}
        onRetry={retry}
        onRemove={remove}
        onOpen={openAsset}
        onClear={clearFinished}
      />

      {list.error ? <ErrorBox message={list.error} onRetry={list.refresh} /> : null}

      {/* ------------------------------ filters ------------------------------ */}
      <Card className="mb-3" padded>
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
          <div className="w-full sm:w-72">
            <p className="mb-1.5 text-[12px] font-medium text-muted-strong">Search</p>
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Video name…"
            />
          </div>
          <div className="w-36">
            <DateInput
              label="Uploaded from"
              value={from}
              onChange={(value) => {
                setFrom(value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-36">
            <DateInput
              label="Uploaded to"
              value={to}
              onChange={(value) => {
                setTo(value);
                setPage(1);
              }}
            />
          </div>
          {from || to || search || status !== "all" ? (
            <Button
              variant="ghost"
              icon="close"
              className="h-9"
              onClick={() => {
                setSearch("");
                setFrom("");
                setTo("");
                setStatus("all");
                setPage(1);
              }}
            >
              Clear
            </Button>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
          {UPLOAD_STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => {
                setStatus(filter.value);
                setPage(1);
              }}
              className={`h-8 rounded-lg px-3 text-[12px] font-semibold transition ${
                status === filter.value
                  ? "bg-accent text-white"
                  : "bg-surface-2 text-muted-strong hover:bg-surface-3 hover:text-ink"
              }`}
            >
              {filter.label}
            </button>
          ))}
          <span className="ml-auto text-[12px] text-muted">
            {total} video{total === 1 ? "" : "s"}
          </span>
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={rows}
        loading={list.loading}
        sort={sort}
        onSortChange={setSort}
        onRowClick={(row) => openAsset(row.id)}
        emptyTitle="No videos uploaded yet"
        emptyDescription="Videos appear here as soon as you attach one in Upload content — with its progress, processing state and details."
        emptyIcon="film"
        emptyAction={
          <Button icon="plus" onClick={() => router.push("/content/upload")}>
            Upload content
          </Button>
        }
        rowActions={(row) => (
          <Dropdown
            trigger={({ toggle }) => <IconButton icon="dots" label="Actions" size="sm" onClick={toggle} />}
            items={[
              ...(row.status === "uploading" || row.status === "waiting"
                ? [{ label: "Cancel upload", icon: "close" as const, onSelect: () => void cancelAsset(row) }]
                : []),
              ...(row.status === "processing" || row.status === "uploaded"
                ? [{ label: "View details", icon: "eye" as const, onSelect: () => openAsset(row.id) }]
                : []),
              ...(row.status === "ready"
                ? [
                    { label: "View", icon: "eye" as const, onSelect: () => openAsset(row.id) },
                    { label: "Edit details", icon: "pencil" as const, onSelect: () => openAsset(row.id) },
                  ]
                : []),
              ...(row.status === "failed" && row.failedStage === "processing"
                ? [
                    {
                      label: "Retry processing",
                      icon: "upload" as const,
                      onSelect: () => void retryProcessing(row),
                    },
                  ]
                : []),
              ...(row.status !== "uploading"
                ? [
                    {
                      label: "Delete",
                      icon: "trash" as const,
                      tone: "danger" as const,
                      onSelect: () => setToDelete(row),
                    },
                  ]
                : []),
            ]}
          />
        )}
      />

      <Pagination
        page={page}
        pageCount={Math.max(1, Math.ceil(total / perPage))}
        perPage={perPage}
        total={total}
        onPage={setPage}
        onPerPage={(value) => {
          setPerPage(value);
          setPage(1);
        }}
      />

      <VideoDetailsDrawer
        key={opened.data?.id ?? "loading"}
        asset={opened.data ?? null}
        open={!!openId}
        onClose={closeDrawer}
        onSaved={(asset) => {
          opened.setData(asset);
          list.refresh();
        }}
        onDelete={(asset) => setToDelete(asset)}
        onRetryProcessing={(asset) => void retryProcessing(asset)}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        pending={deleting}
        title="Delete video?"
        confirmLabel="Delete"
        message={`This permanently removes "${toDelete?.internalName ?? ""}" and the file stored for it. It cannot be undone.`}
        onConfirm={confirmDelete}
      />
    </>
  );
}
