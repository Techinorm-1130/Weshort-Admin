"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { projectApi } from "@/lib/api/resources";
import { useList, useMutation } from "@/lib/hooks";
import { formatNumber } from "@/lib/format";
import type { Project } from "@/types";
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
  { value: "offline", label: "Offline" },
];

const KIND_LABELS: Record<Project["kind"], string> = {
  svod: "Subscription",
  avod: "Advertising",
  tvod: "Transactional",
  fast: "FAST",
};

export default function ProjectsPage() {
  const router = useRouter();
  const toast = useToast();
  const list = useList<Project>((q) => projectApi.list(q));
  const [toDelete, setToDelete] = useState<Project | null>(null);
  const [view, setView] = useState<"cards" | "table">("cards");

  const create = useMutation(() => projectApi.create({}));
  const remove = useMutation((id: string) => projectApi.remove(id));

  const onCreate = async () => {
    const project = await create.run();
    if (project) {
      toast.success("Project created");
      router.push(`/projects/${project.id}`);
    }
  };

  const columns: Column<Project>[] = [
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
          { value: "offline", label: "Offline" },
        ],
        onChange: (v) => list.setQuery({ status: v as Project["status"] }),
      },
    },
    {
      key: "kind",
      header: "Type",
      width: "90px",
      cell: (row) => (
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/12 text-brand" title={KIND_LABELS[row.kind]}>
          <Icon name={row.kind === "fast" ? "tv" : "store"} size={16} />
        </span>
      ),
    },
    {
      key: "name",
      header: "Project name",
      sortKey: "name",
      cell: (row) => (
        <div>
          <p className="font-semibold text-ink">{row.name}</p>
          <p className="text-xs text-muted">{row.domain || "no domain yet"}</p>
        </div>
      ),
    },
    {
      key: "offers",
      header: "Active offers",
      align: "center",
      sortKey: "activeOffers",
      cell: (row) => (row.activeOffers ? <Badge tone="brand">{row.activeOffers}</Badge> : <span className="text-muted">-</span>),
    },
    {
      key: "registered",
      header: "Registered users",
      align: "center",
      sortKey: "registeredUsers",
      cell: (row) => formatNumber(row.registeredUsers),
    },
    {
      key: "active",
      header: "Active users",
      align: "center",
      sortKey: "activeUsers",
      cell: (row) => (row.activeUsers ? formatNumber(row.activeUsers) : <span className="text-muted">-</span>),
    },
    {
      key: "trial",
      header: "Trial period",
      align: "center",
      cell: (row) => (row.trialUsers ? formatNumber(row.trialUsers) : <span className="text-muted">-</span>),
    },
    {
      key: "churned",
      header: "Churned users",
      align: "center",
      cell: (row) => (row.churnedUsers ? formatNumber(row.churnedUsers) : <span className="text-muted">-</span>),
    },
  ];

  return (
    <>
      <PageHeader
        title="Projects"
        crumbs={[{ label: "Publish & monetise" }, { label: "Projects" }]}
        actions={
          <Button icon="plus" loading={create.pending} onClick={onCreate}>
            Create a project
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-4">
        <h2 className="font-display text-xl font-bold tracking-tight text-ink">All projects</h2>
        <span className="text-[13px] text-muted underline underline-offset-4">{list.total} project{list.total > 1 ? "s" : ""}</span>

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
              icon="store"
              title="No project yet"
              description="A project is the storefront your viewers sign in to. Create one to start publishing."
              action={
                <Button icon="plus" onClick={onCreate}>
                  Create a project
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {list.items.map((project) => (
              <ListCard
                key={project.id}
                onOpen={() => router.push(`/projects/${project.id}`)}
                highlight={project.status === "online" && project.activeOffers > 1 ? "brand" : "none"}
                eyebrow={{
                  initials: project.name.slice(0, 2).toUpperCase(),
                  color: "#2f6bff",
                  title: KIND_LABELS[project.kind],
                  subtitle: project.domain || "no domain yet",
                }}
                tile={{ icon: project.kind === "fast" ? "tv" : "store", color: "#2f6bff" }}
                title={project.name}
                meta={
                  <>
                    <Icon name="users" size={12} />
                    {formatNumber(project.registeredUsers)} registered
                    <span className="text-muted/50">·</span>
                    {formatNumber(project.activeUsers)} active
                  </>
                }
                label="Offers"
                note={<span className="text-muted">{project.activeOffers} active</span>}
                chips={
                  <>
                    <TagChip>{KIND_LABELS[project.kind]}</TagChip>
                    {project.trialUsers ? <TagChip>{project.trialUsers} in trial</TagChip> : null}
                    {project.churnedUsers ? <TagChip>{project.churnedUsers} churned</TagChip> : null}
                  </>
                }
                dots={{ value: Math.max(1, Math.min(5, project.activeOffers + 1)), color: "#2f6bff" }}
                status={project.status}
                onDelete={() => setToDelete(project)}
                primary={{ icon: "pencil", label: "Edit", onClick: () => router.push(`/projects/${project.id}`) }}
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
        onRowClick={(row) => router.push(`/projects/${row.id}`)}
        emptyTitle="No project yet"
        emptyDescription="A project is the storefront your viewers sign in to. Create one to start publishing."
        emptyIcon="store"
        emptyAction={
          <Button icon="plus" onClick={onCreate}>
            Create a project
          </Button>
        }
        rowActions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <IconButton icon="pencil" label="Edit" size="sm" onClick={() => router.push(`/projects/${row.id}`)} />
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
        title="Delete project"
        message={`"${toDelete?.name}" and its offers will be removed. This cannot be undone.`}
        onConfirm={async () => {
          if (!toDelete) return;
          await remove.run(toDelete.id);
          setToDelete(null);
          toast.success("Project deleted");
          list.refresh();
        }}
      />
    </>
  );
}
