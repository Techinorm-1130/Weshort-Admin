"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fastApi } from "@/lib/api/resources";
import { useList, useMutation } from "@/lib/hooks";
import { formatDate, formatNumber } from "@/lib/format";
import type { FastChannel } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import Button, { Chip, IconButton } from "@/components/ui/Button";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { Pagination, SearchInput } from "@/components/ui/Toolbar";
import { Badge, EmptyState, ErrorBox, Skeleton, StatusDot } from "@/components/ui/Primitives";
import { ListCard, TagChip } from "@/components/ui/EntityCard";
import { ConfirmDialog } from "@/components/ui/Overlays";
import Icon from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "online", label: "Online" },
  { value: "draft", label: "Draft" },
  { value: "error", label: "Error" },
];

export default function FastChannelsPage() {
  const router = useRouter();
  const toast = useToast();
  const list = useList<FastChannel>((q) => fastApi.list(q));
  const [toDelete, setToDelete] = useState<FastChannel | null>(null);
  const [view, setView] = useState<"cards" | "table">("cards");

  const create = useMutation(() => fastApi.create({}));
  const remove = useMutation((id: string) => fastApi.remove(id));

  const onCreate = async () => {
    const channel = await create.run();
    if (channel) {
      toast.success("FAST broadcast created");
      router.push(`/fast-channels/${channel.id}`);
    }
  };

  const columns: Column<FastChannel>[] = [
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
        onChange: (v) => list.setQuery({ status: v as FastChannel["status"] }),
      },
    },
    {
      key: "type",
      header: "Type",
      width: "80px",
      cell: () => (
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/12 text-brand">
          <Icon name="tv" size={16} />
        </span>
      ),
      filter: {
        value: list.query.type ?? "all",
        options: [
          { value: "internal", label: "Internal" },
          { value: "external", label: "External" },
        ],
        onChange: (v) => list.setQuery({ type: v }),
      },
    },
    {
      key: "name",
      header: "Channel name",
      sortKey: "name",
      cell: (row) => (
        <div>
          <p className="font-semibold text-ink">{row.name}</p>
          <p className="truncate text-xs text-muted">{row.sourceUrl || "no source URL yet"}</p>
        </div>
      ),
    },
    {
      key: "source",
      header: "Source",
      align: "center",
      cell: (row) => <Badge tone={row.sourceType === "internal" ? "info" : "neutral"}>{row.sourceType}</Badge>,
    },
    {
      key: "ads",
      header: "Ads",
      align: "center",
      cell: (row) => (row.adsEnabled ? <Badge tone="ok">Enabled</Badge> : <span className="text-muted">-</span>),
    },
    {
      key: "viewers",
      header: "Viewers",
      align: "center",
      sortKey: "viewers",
      cell: (row) => formatNumber(row.viewers),
    },
    {
      key: "languages",
      header: "Languages",
      align: "center",
      cell: (row) => <span className="text-[13px] uppercase">{row.languages.join(", ")}</span>,
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
        title="FAST broadcasts"
        count={list.total}
        crumbs={[{ label: "Catalogue" }, { label: "FAST broadcasts" }]}
        subtitle="Free ad-supported linear channels streamed 24/7."
        actions={
          <Button icon="plus" loading={create.pending} onClick={onCreate}>
            Create a FAST broadcast
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-4">
        <h2 className="font-display text-xl font-bold tracking-tight text-ink">Channels</h2>
        <span className="text-[13px] text-muted underline underline-offset-4">{list.total} channel{list.total > 1 ? "s" : ""}</span>

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
              icon="tv"
              title="Ready to create your first content?"
              description="A FAST broadcast plays your catalogue as a continuous channel, with ad breaks and an EPG."
              action={
                <Button icon="plus" onClick={onCreate}>
                  Create a FAST broadcast
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {list.items.map((channel) => (
              <ListCard
                key={channel.id}
                onOpen={() => router.push(`/fast-channels/${channel.id}`)}
                highlight={channel.status === "online" && channel.viewers > 100 ? "brand" : "none"}
                eyebrow={{
                  initials: channel.name.slice(0, 2).toUpperCase(),
                  color: "#38bdf8",
                  title: channel.sourceType === "internal" ? "Internal source" : "External source",
                  subtitle: channel.sourceUrl || "no source URL yet",
                }}
                tile={{ icon: "tv", color: channel.viewers > 100 ? "#0c0c0e" : "#38bdf8", image: channel.logo }}
                title={channel.name}
                meta={
                  <>
                    <Icon name="users" size={12} />
                    {formatNumber(channel.viewers)} viewers
                    <span className="text-muted/50">·</span>
                    {formatDate(channel.updatedAt)}
                  </>
                }
                label="Languages"
                note={<span className="text-muted">{channel.adsEnabled ? "Ads on" : "No ads"}</span>}
                chips={
                  <>
                    {channel.languages.map((lang) => (
                      <TagChip key={lang}>{lang.toUpperCase()}</TagChip>
                    ))}
                    {channel.epgUrl ? <TagChip icon="calendar">EPG</TagChip> : null}
                  </>
                }
                dots={{ value: channel.status === "online" ? 5 : 2, color: channel.viewers > 100 ? "#e50914" : "#38bdf8" }}
                status={channel.status}
                onDelete={() => setToDelete(channel)}
                primary={{ icon: "play", label: "Open", onClick: () => router.push(`/fast-channels/${channel.id}`) }}
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
        onRowClick={(row) => router.push(`/fast-channels/${row.id}`)}
        emptyTitle="Ready to create your first content?"
        emptyDescription="A FAST broadcast plays your catalogue as a continuous channel, with ad breaks and an EPG."
        emptyIcon="tv"
        emptyAction={
          <Button icon="plus" onClick={onCreate}>
            Create a FAST broadcast
          </Button>
        }
        rowActions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <IconButton icon="pencil" label="Edit" size="sm" onClick={() => router.push(`/fast-channels/${row.id}`)} />
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
        title="Delete FAST broadcast"
        message={`"${toDelete?.name}" will stop streaming immediately.`}
        onConfirm={async () => {
          if (!toDelete) return;
          await remove.run(toDelete.id);
          setToDelete(null);
          toast.success("FAST broadcast deleted");
          list.refresh();
        }}
      />
    </>
  );
}
