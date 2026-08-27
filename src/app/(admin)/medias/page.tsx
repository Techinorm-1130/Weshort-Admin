"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { mediaApi, orgApi } from "@/lib/api/resources";
import { useList, useMutation, useQuery } from "@/lib/hooks";
import { formatDate, formatDuration, formatMinutes, percent } from "@/lib/format";
import type { Media } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import Button, { Chip, IconButton } from "@/components/ui/Button";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { Pagination, SearchInput } from "@/components/ui/Toolbar";
import { Avatar, ErrorBox, ProgressBar, Skeleton, StatusDot, STATUS_LABELS } from "@/components/ui/Primitives";
import {
  CardDivider, CardFooter, CardHead, CardHeading, DotRating, EntityCard, IconTile,
  MicroLabel, OpenAction, RoundAction, SelectPill, TagChip,
} from "@/components/ui/EntityCard";
import { EmptyState } from "@/components/ui/Primitives";
import { ConfirmDialog, Dropdown } from "@/components/ui/Overlays";
import Icon, { type IconName } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";

const KIND_ICONS: Record<Media["kind"], IconName> = {
  video: "film",
  audio: "music",
  linked: "layers",
  live: "tv",
};

const KIND_COLORS: Record<Media["kind"], string> = {
  video: "#e50914",
  audio: "#7c5cff",
  linked: "#2f6bff",
  live: "#38bdf8",
};

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "online", label: "Online" },
  { value: "processing", label: "Encoding" },
  { value: "draft", label: "Draft" },
  { value: "error", label: "Error" },
];

const KIND_LABELS: Record<Media["kind"], string> = {
  video: "Hosted video",
  audio: "Hosted audio",
  linked: "Linked contents",
  live: "Live",
};

function MediasView() {
  const router = useRouter();
  const toast = useToast();
  const params = useSearchParams();

  const list = useList<Media>((q) => mediaApi.list(q), { search: params.get("search") ?? "" });
  const { data: org } = useQuery(() => orgApi.get(), []);
  const [toDelete, setToDelete] = useState<Media | null>(null);
  const [view, setView] = useState<"cards" | "table">("cards");

  const create = useMutation((kind: Media["kind"]) => mediaApi.create({ kind }));
  const remove = useMutation((id: string) => mediaApi.remove(id));

  const onCreate = async (kind: Media["kind"]) => {
    const media = await create.run(kind);
    if (media) {
      toast.success(`${KIND_LABELS[kind]} created`);
      router.push(`/medias/${media.id}`);
    }
  };

  const quotaPct = org ? percent(org.encodingUsedMin, org.encodingQuotaMin) : 0;

  const columns: Column<Media>[] = [
    {
      key: "status",
      header: "Status",
      width: "90px",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <StatusDot status={row.status} />
          {row.status === "processing" ? (
            <span className="w-10">
              <ProgressBar value={row.encodingProgress} tone="info" />
            </span>
          ) : null}
        </div>
      ),
      filter: {
        value: list.query.status ?? "all",
        options: [
          { value: "online", label: "Online" },
          { value: "draft", label: "Draft" },
          { value: "processing", label: "Processing" },
          { value: "error", label: "Error" },
        ],
        onChange: (v) => list.setQuery({ status: v as Media["status"] }),
      },
    },
    {
      key: "kind",
      header: "Type",
      width: "80px",
      cell: (row) => (
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/12 text-brand"
          title={KIND_LABELS[row.kind]}
        >
          <Icon name={KIND_ICONS[row.kind]} size={16} />
        </span>
      ),
      filter: {
        value: list.query.type ?? "all",
        options: Object.entries(KIND_LABELS).map(([value, label]) => ({ value, label })),
        onChange: (v) => list.setQuery({ type: v }),
      },
    },
    {
      key: "title",
      header: "Title",
      sortKey: "title",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-2 text-muted">
            {row.poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.poster} alt="" className="h-full w-full object-cover" />
            ) : (
              <Icon name="image" size={15} />
            )}
          </span>
          <span className="font-semibold text-ink">{row.title}</span>
        </div>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      align: "center",
      cell: (row) =>
        row.metadata.durationSec ? (
          <span className="font-mono text-[13px]">{formatDuration(row.metadata.durationSec)}</span>
        ) : (
          <span className="text-muted">-</span>
        ),
    },
    {
      key: "restrictions",
      header: "Restrictions",
      align: "center",
      cell: (row) => (
        <span className="inline-flex items-center gap-1 text-muted" title={row.restrictions.join(", ")}>
          <Icon name="globe" size={16} />
          <sup className="text-[10px]">{row.restrictions.length}</sup>
        </span>
      ),
      filter: {
        value: list.query.status === "all" ? "all" : "all",
        options: [
          { value: "ww", label: "Worldwide" },
          { value: "it", label: "Italy only" },
        ],
        onChange: () => toast.info("Restriction filter is served by the backend"),
      },
    },
    {
      key: "languages",
      header: "Languages",
      align: "center",
      cell: (row) => <span className="text-[13px] uppercase">{row.languages.join(", ")}</span>,
    },
    {
      key: "subtitles",
      header: "Subtitles",
      align: "center",
      cell: (row) =>
        row.subtitles.length ? (
          <span className="text-[13px] uppercase">{row.subtitles.join(", ")}</span>
        ) : (
          <span className="text-muted">-</span>
        ),
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
        title="Medias"
        count={list.total}
        subtitle={
          org ? (
            <span className="flex items-center gap-2">
              <Icon name="chart" size={15} />
              Quota: {formatMinutes(org.encodingUsedMin)} used of {formatMinutes(org.encodingQuotaMin)} ({quotaPct}%)
              <span className="ml-2 hidden w-40 sm:inline-block">
                <ProgressBar value={quotaPct} />
              </span>
            </span>
          ) : null
        }
        crumbs={[{ label: "Catalogue" }, { label: "Medias" }]}
        actions={
          <>
            <Button
              variant="secondary"
              icon="download"
              onClick={() => toast.info("Showing medias whose rights have expired")}
            >
              Expired rights
            </Button>
            <Dropdown
              trigger={({ toggle, open }) => (
                <Button icon="plus" iconRight={open ? "chevron-down" : undefined} onClick={toggle}>
                  Create a media to encode
                </Button>
              )}
              items={[
                { label: "Hosted video", icon: "film", onSelect: () => onCreate("video") },
                { label: "Hosted audio", icon: "music", onSelect: () => onCreate("audio") },
                { label: "Linked contents", icon: "layers", onSelect: () => onCreate("linked") },
              ]}
            />
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-4">
        <h2 className="font-display text-xl font-bold tracking-tight text-ink">Catalogue</h2>
        <span className="text-[13px] text-muted underline underline-offset-4">
          {list.total} media{list.total > 1 ? "s" : ""}
        </span>

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
              onClick={() => list.setQuery({ status: filter.value as Media["status"] })}
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
              icon="film"
              title="Ready to create your first content?"
              description="Upload a video or audio file, or link an existing content to start encoding."
              action={
                <Button icon="plus" onClick={() => onCreate("video")}>
                  Create a media
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {list.items.map((media) => (
              <EntityCard
                key={media.id}
                onClick={() => router.push(`/medias/${media.id}`)}
                highlight={media.status === "processing" ? "brand" : "none"}
                head={
                  <CardHead
                    avatar={
                      <Avatar
                        initials={media.creator.initials}
                        name={media.creator.name}
                        color={media.creator.color}
                        size={40}
                        ring={false}
                      />
                    }
                    title={media.creator.name}
                    subtitle={KIND_LABELS[media.kind]}
                  />
                }
                actions={
                  <>
                    <span onClick={(e) => e.stopPropagation()}>
                      <Dropdown
                        trigger={({ toggle }) => (
                          <RoundAction icon="dots" label="Actions" onClick={toggle} size="sm" />
                        )}
                        items={[
                          { label: "Edit", icon: "pencil", onSelect: () => router.push(`/medias/${media.id}`) },
                          {
                            label: "Start encoding",
                            icon: "bolt",
                            onSelect: async () => {
                              await mediaApi.startEncoding(media.id);
                              toast.success("Encoding started");
                              list.refresh();
                            },
                          },
                          { label: "Delete", icon: "trash", tone: "danger", onSelect: () => setToDelete(media) },
                        ]}
                      />
                    </span>
                    <OpenAction onClick={() => router.push(`/medias/${media.id}`)} />
                  </>
                }
              >
                <CardHeading
                  tile={
                    <IconTile
                      icon={KIND_ICONS[media.kind]}
                      color={media.status === "processing" ? "#0c0c0e" : KIND_COLORS[media.kind]}
                      image={media.poster}
                    />
                  }
                  title={media.title}
                  meta={
                    <>
                      <Icon name="clock" size={12} />
                      {media.metadata.durationSec ? formatDuration(media.metadata.durationSec) : "--:--:--"}
                      <span className="opacity-50">·</span>
                      {formatDate(media.updatedAt)}
                    </>
                  }
                />

                <CardDivider />

                <MicroLabel note={<span className="text-muted">{media.restrictions.join(", ").toUpperCase()}</span>}>
                  Languages
                </MicroLabel>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {media.languages.map((lang) => (
                      <TagChip key={lang}>{lang.toUpperCase()}</TagChip>
                    ))}
                    {media.subtitles.length ? (
                      <TagChip icon="file">{media.subtitles.length} sub</TagChip>
                    ) : null}
                  </div>
                  <DotRating
                    value={Math.max(1, Math.round(media.encodingProgress / 20))}
                    color={media.status === "processing" ? "#e50914" : "#2f6bff"}
                  />
                </div>

                <p className="mb-2 mt-5 text-[12px] font-medium text-muted">Status</p>
                <CardFooter>
                  <SelectPill
                    leading={
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-3">
                        <StatusDot status={media.status} />
                      </span>
                    }
                    onClick={() => router.push(`/medias/${media.id}`)}
                  >
                    {STATUS_LABELS[media.status]}
                    {media.status === "processing" ? ` · ${media.encodingProgress}%` : ""}
                  </SelectPill>
                  <RoundAction icon="trash" label="Delete" onClick={() => setToDelete(media)} />
                  <RoundAction
                    icon="bolt"
                    label="Start encoding"
                    solid
                    onClick={async () => {
                      await mediaApi.startEncoding(media.id);
                      toast.success("Encoding started");
                      list.refresh();
                    }}
                  />
                </CardFooter>
              </EntityCard>
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
        onRowClick={(row) => router.push(`/medias/${row.id}`)}
        emptyTitle="Ready to create your first content?"
        emptyDescription="Upload a video or audio file, or link an existing content to start encoding."
        emptyIcon="film"
        emptyAction={
          <Button icon="plus" onClick={() => onCreate("video")}>
            Create a media
          </Button>
        }
        rowActions={(row) => (
          <Dropdown
            trigger={({ toggle }) => <IconButton icon="settings" label="Actions" size="sm" onClick={toggle} />}
            items={[
              { label: "Edit", icon: "pencil", onSelect: () => router.push(`/medias/${row.id}`) },
              {
                label: "Start encoding",
                icon: "bolt",
                onSelect: async () => {
                  await mediaApi.startEncoding(row.id);
                  toast.success("Encoding started");
                  list.refresh();
                },
              },
              { label: "Delete", icon: "trash", tone: "danger", onSelect: () => setToDelete(row) },
            ]}
          />
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
        title="Delete media"
        message={`"${toDelete?.title}" will be removed from the catalogue and from every project.`}
        onConfirm={async () => {
          if (!toDelete) return;
          await remove.run(toDelete.id);
          setToDelete(null);
          toast.success("Media deleted");
          list.refresh();
        }}
      />
    </>
  );
}

export default function MediasPage() {
  return (
    <Suspense fallback={null}>
      <MediasView />
    </Suspense>
  );
}
