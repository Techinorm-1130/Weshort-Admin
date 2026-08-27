"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { contributionApi } from "@/lib/api/resources";
import { useList, useMutation } from "@/lib/hooks";
import { formatDate, formatDuration } from "@/lib/format";
import type { Contribution } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import Button, { Chip, IconButton } from "@/components/ui/Button";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { Pagination, SearchInput } from "@/components/ui/Toolbar";
import { Avatar, EmptyState, ErrorBox, Skeleton, StatusDot } from "@/components/ui/Primitives";
import { ListCard, TagChip } from "@/components/ui/EntityCard";
import { ConfirmDialog } from "@/components/ui/Overlays";
import Icon from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "online", label: "Published" },
  { value: "draft", label: "In review" },
  { value: "error", label: "Error" },
];

export default function ContributionsPage() {
  const router = useRouter();
  const toast = useToast();
  const list = useList<Contribution>((q) => contributionApi.list(q));
  const [toDelete, setToDelete] = useState<Contribution | null>(null);
  const [view, setView] = useState<"cards" | "table">("cards");

  const create = useMutation(() => contributionApi.create({}));
  const remove = useMutation((id: string) => contributionApi.remove(id));

  const onCreate = async () => {
    const created = await create.run();
    if (created) {
      toast.success("External contribution created");
      router.push(`/contributions/${created.id}`);
    }
  };

  const columns: Column<Contribution>[] = [
    {
      key: "status",
      header: "Status",
      width: "90px",
      cell: (row) => <StatusDot status={row.status} />,
      filter: {
        value: list.query.status ?? "all",
        options: [
          { value: "online", label: "Online" },
          { value: "draft", label: "Draft" },
          { value: "error", label: "Error" },
        ],
        onChange: (v) => list.setQuery({ status: v as Contribution["status"] }),
      },
    },
    {
      key: "type",
      header: "Type",
      width: "80px",
      cell: () => (
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/12 text-brand">
          <Icon name="film" size={16} />
        </span>
      ),
      filter: {
        value: list.query.type ?? "all",
        options: [
          { value: "flux", label: "Stream" },
          { value: "external", label: "External" },
        ],
        onChange: (v) => list.setQuery({ type: v }),
      },
    },
    {
      key: "title",
      header: "Title",
      sortKey: "title",
      cell: (row) => (
        <div>
          <p className="font-semibold text-ink">{row.title}</p>
          <p className="truncate text-xs text-muted">{row.sourceUrl || "no source URL yet"}</p>
        </div>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      align: "center",
      cell: (row) =>
        row.durationSec ? (
          <span className="font-mono text-[13px]">{formatDuration(row.durationSec)}</span>
        ) : (
          <span className="text-muted">-</span>
        ),
    },
    {
      key: "restrictions",
      header: "Restrictions",
      align: "center",
      cell: () => (
        <span className="inline-flex items-center gap-1 text-muted">
          <Icon name="globe" size={16} />
          <sup className="text-[10px]">1</sup>
        </span>
      ),
    },
    {
      key: "languages",
      header: "Languages",
      align: "center",
      cell: (row) => <span className="text-[13px] uppercase">{row.languages.join(", ")}</span>,
    },
    {
      key: "creator",
      header: "Creator",
      align: "center",
      cell: (row) => <Avatar initials={row.creator.initials} name={row.creator.name} color={row.creator.color} size={28} />,
    },
    {
      key: "updatedAt",
      header: "Modif. date",
      align: "right",
      sortKey: "updatedAt",
      cell: (row) => <span className="text-[13px]">{formatDate(row.updatedAt)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="External contributions"
        count={list.total}
        crumbs={[{ label: "Catalogue" }, { label: "External contributions" }]}
        subtitle="Streams and files submitted by partners for review."
        actions={
          <Button icon="plus" loading={create.pending} onClick={onCreate}>
            Add an external contribution
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-4">
        <h2 className="font-display text-xl font-bold tracking-tight text-ink">Submissions</h2>
        <span className="text-[13px] text-muted underline underline-offset-4">{list.total} submission{list.total > 1 ? "s" : ""}</span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <SearchInput
            value={list.query.search ?? ""}
            onChange={(v) => list.setQuery({ search: v })}
            placeholder="Search"
            className="w-full sm:w-64"
          />
          {STATUS_FILTERS.map((filter) => (
            <Chip
              key={filter.value}
              active={(list.query.status ?? "all") === filter.value}
              onClick={() => list.setQuery({ status: filter.value as never })}
            >
              {filter.label}
            </Chip>
          ))}
          <span className="mx-1 h-6 w-px bg-border" />
          <Chip active={view === "cards"} icon="layers" onClick={() => setView("cards")}>
            Cards
          </Chip>
          <Chip active={view === "table"} icon="sort" onClick={() => setView("table")}>
            Table
          </Chip>
        </div>
      </div>

      {list.error ? <ErrorBox message={list.error} onRetry={list.refresh} /> : null}

      {view === "cards" ? (
        list.loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-[26px]" />
            ))}
          </div>
        ) : list.items.length === 0 ? (
          <div className="card-premium">
            <EmptyState
              icon="inbox"
              title="No external contribution yet"
              description="Partners can submit a stream or a file that you review before publishing."
              action={
                <Button icon="plus" onClick={onCreate}>
                  Add an external contribution
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {list.items.map((contribution) => (
              <ListCard
                key={contribution.id}
                onOpen={() => router.push(`/contributions/${contribution.id}`)}
                highlight={contribution.status === "draft" ? "brand" : "none"}
                eyebrow={{
                  initials: contribution.creator.initials,
                  color: contribution.creator.color,
                  title: contribution.creator.name,
                  subtitle: contribution.sourceType === "flux" ? "Stream" : "External player",
                }}
                tile={{ icon: "inbox", color: contribution.status === "draft" ? "#0c0c0e" : "#7c5cff" }}
                title={contribution.title}
                meta={
                  <>
                    <Icon name="clock" size={12} />
                    {contribution.durationSec ? formatDuration(contribution.durationSec) : "--:--:--"}
                    <span className="text-muted/50">·</span>
                    {formatDate(contribution.updatedAt)}
                  </>
                }
                label="Source"
                note={
                  contribution.status === "draft" ? (
                    <span className="text-brand">Needs review</span>
                  ) : (
                    <span className="text-muted">Approved</span>
                  )
                }
                chips={
                  <>
                    {contribution.languages.map((lang) => (
                      <TagChip key={lang}>{lang.toUpperCase()}</TagChip>
                    ))}
                    {contribution.epgUrl ? <TagChip icon="calendar">EPG</TagChip> : null}
                  </>
                }
                dots={{ value: contribution.status === "online" ? 5 : 2, color: contribution.status === "draft" ? "#e50914" : "#7c5cff" }}
                status={contribution.status}
                onDelete={() => setToDelete(contribution)}
                primary={{
                  icon: "check",
                  label: "Review",
                  onClick: () => router.push(`/contributions/${contribution.id}`),
                }}
              />
            ))}
          </div>
        )
      ) : (
      <DataTable
        columns={columns}
        rows={list.items}
        loading={list.loading}
        sort={list.query.sort}
        onSortChange={(sort) => list.setQuery({ sort })}
        onRowClick={(row) => router.push(`/contributions/${row.id}`)}
        emptyTitle="No external contribution yet"
        emptyDescription="Partners can submit a stream or a file that you review before publishing."
        emptyIcon="inbox"
        emptyAction={
          <Button icon="plus" onClick={onCreate}>
            Add an external contribution
          </Button>
        }
        rowActions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <IconButton icon="pencil" label="Edit" size="sm" onClick={() => router.push(`/contributions/${row.id}`)} />
            <IconButton icon="trash" label="Delete" size="sm" onClick={() => setToDelete(row)} />
          </div>
        )}
      />
      )}

      <Pagination
        page={list.page}
        pageCount={list.pageCount}
        perPage={list.perPage}
        total={list.total}
        onPage={(page) => list.setQuery({ page })}
        onPerPage={(perPage) => list.setQuery({ perPage })}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        pending={remove.pending}
        title="Delete contribution"
        message={`"${toDelete?.title}" will be removed.`}
        onConfirm={async () => {
          if (!toDelete) return;
          await remove.run(toDelete.id);
          setToDelete(null);
          toast.success("Contribution deleted");
          list.refresh();
        }}
      />
    </>
  );
}
