"use client";

import { useRouter } from "next/navigation";
import { encodingApi, orgApi } from "@/lib/api/resources";
import { useList, useQuery } from "@/lib/hooks";
import { formatDate, formatDuration, formatMinutes, percent } from "@/lib/format";
import type { EncodingJob } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import { IconButton } from "@/components/ui/Button";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { Pagination, SearchInput, Toolbar } from "@/components/ui/Toolbar";
import { Badge, Card, ErrorBox, ProgressBar } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";

const STATE_TONES: Record<EncodingJob["state"], "ok" | "info" | "warn" | "danger"> = {
  done: "ok",
  running: "info",
  queued: "warn",
  failed: "danger",
};

export default function EncodingsPage() {
  const router = useRouter();
  const toast = useToast();
  const list = useList<EncodingJob>((q) => encodingApi.jobs(q));
  const { data: org } = useQuery(() => orgApi.get(), []);

  const quotaPct = org ? percent(org.encodingUsedMin, org.encodingQuotaMin) : 0;

  const columns: Column<EncodingJob>[] = [
    {
      key: "state",
      header: "State",
      width: "130px",
      cell: (row) => <Badge tone={STATE_TONES[row.state]}>{row.state}</Badge>,
      filter: {
        value: list.query.status ?? "all",
        options: [
          { value: "running", label: "Running" },
          { value: "queued", label: "Queued" },
          { value: "done", label: "Done" },
          { value: "failed", label: "Failed" },
        ],
        onChange: (v) => list.setQuery({ status: v as never }),
      },
    },
    {
      key: "media",
      header: "Media",
      sortKey: "mediaTitle",
      cell: (row) => (
        <button
          onClick={() => router.push(`/medias/${row.mediaId}`)}
          className="font-semibold text-ink transition hover:text-brand"
        >
          {row.mediaTitle}
        </button>
      ),
    },
    { key: "profile", header: "Profile", align: "center", cell: (row) => row.profileName },
    {
      key: "progress",
      header: "Progress",
      width: "160px",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <ProgressBar
            value={row.progress}
            tone={row.state === "failed" ? "brand" : row.state === "done" ? "ok" : "info"}
          />
          <span className="w-9 text-right text-xs text-muted">{row.progress}%</span>
        </div>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      align: "center",
      cell: (row) => <span className="font-mono text-[13px]">{formatDuration(row.durationSec)}</span>,
    },
    {
      key: "cost",
      header: "Cost",
      align: "center",
      cell: (row) => <span className="text-[13px]">x{row.costMultiplier}</span>,
    },
    {
      key: "startedAt",
      header: "Started",
      align: "right",
      sortKey: "startedAt",
      cell: (row) => <span className="text-[13px]">{formatDate(row.startedAt, true)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Encodings"
        count={list.total}
        crumbs={[{ label: "Catalogue" }, { label: "Encodings" }]}
        subtitle="Every encoding job run against your quota."
      />

      {org ? (
        <Card className="mb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted">Encoding quota</p>
              <p className="mt-1 font-display text-xl font-bold text-ink">
                {formatMinutes(org.encodingUsedMin)}{" "}
                <span className="text-base font-normal text-muted">
                  of {formatMinutes(org.encodingQuotaMin)} ({quotaPct}%)
                </span>
              </p>
            </div>
            <div className="w-full sm:w-72">
              <ProgressBar value={quotaPct} />
            </div>
          </div>
        </Card>
      ) : null}

      <Toolbar
        left={
          <SearchInput
            value={list.query.search ?? ""}
            onChange={(v) => list.setQuery({ search: v })}
            placeholder="Search by media"
            className="w-full sm:w-72"
          />
        }
      />

      {list.error ? <ErrorBox message={list.error} onRetry={list.refresh} /> : null}

      <DataTable
        columns={columns}
        rows={list.items}
        loading={list.loading}
        sort={list.query.sort}
        onSortChange={(sort) => list.setQuery({ sort })}
        emptyTitle="No encoding yet"
        emptyDescription="Encoding jobs appear here as soon as you start one from a media."
        emptyIcon="gauge"
        rowActions={(row) =>
          row.state === "running" || row.state === "queued" ? (
            <IconButton
              icon="close"
              label="Cancel job"
              size="sm"
              onClick={async () => {
                await encodingApi.cancelJob(row.id);
                toast.success("Encoding cancelled");
                list.refresh();
              }}
            />
          ) : (
            <IconButton icon="eye" label="Open media" size="sm" onClick={() => router.push(`/medias/${row.mediaId}`)} />
          )
        }
      />

      <Pagination
        page={list.page}
        pageCount={list.pageCount}
        perPage={list.perPage}
        total={list.total}
        onPage={(page) => list.setQuery({ page })}
        onPerPage={(perPage) => list.setQuery({ perPage })}
      />
    </>
  );
}
