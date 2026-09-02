"use client";

import { useState } from "react";
import { taxonomyApi, viewerApi, type ViewerQuery } from "@/lib/api/resources";
import { useList, useMutation, useQuery } from "@/lib/hooks";
import { formatDate, formatMinutes, formatNumber, initialsOf, labelOf, timeAgo } from "@/lib/format";
import type { SubscriptionPlan, Viewer, ViewerStatus } from "@/types";
import { PLAN_OPTIONS, VIEWER_STATUS_OPTIONS } from "@/lib/api/seed-ott";
import PageHeader from "@/components/ui/PageHeader";
import Button, { Chip, IconButton } from "@/components/ui/Button";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { Pagination, SearchInput } from "@/components/ui/Toolbar";
import { Avatar, Badge, Card, ErrorBox, Skeleton } from "@/components/ui/Primitives";
import { ConfirmDialog, Dropdown, Modal } from "@/components/ui/Overlays";
import { DateInput, Select, TextInput } from "@/components/ui/Fields";
import Icon, { type IconName } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import UserDetailsDrawer from "@/components/users/UserDetailsDrawer";
import { PLAN_TONES, STATUS_TONES, planLabel, statusLabel } from "@/components/users/userMeta";

const STAT_CARDS: { key: string; label: string; icon: IconName; color: string }[] = [
  { key: "total", label: "Total users", icon: "users", color: "#0d9488" },
  { key: "active", label: "Active users", icon: "user", color: "#047857" },
  { key: "premium", label: "Premium users", icon: "billing", color: "#7c3aed" },
  { key: "newThisMonth", label: "New this month", icon: "sparkles", color: "#b45309" },
];

export default function UsersPage() {
  const toast = useToast();
  const list = useList<Viewer>((q) => viewerApi.list(q as ViewerQuery), { perPage: 10, sort: "-joinedAt" });
  const { data: stats, loading: statsLoading, refresh: refreshStats } = useQuery(() => viewerApi.stats(), []);
  const { data: taxonomies } = useQuery(() => taxonomyApi.all(), []);

  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Viewer | null>(null);
  const [toDelete, setToDelete] = useState<Viewer | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<Viewer | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const query = list.query as ViewerQuery;
  const setQuery = (patch: Partial<ViewerQuery>) => list.setQuery(patch as never);

  const update = useMutation((id: string, payload: Partial<Viewer>) => viewerApi.update(id, payload));
  const remove = useMutation((id: string) => viewerApi.remove(id));

  const refreshAll = () => {
    list.refresh();
    refreshStats();
  };

  const applyStatus = async (viewer: Viewer, status: ViewerStatus) => {
    const saved = await update.run(viewer.id, { status });
    if (saved) {
      toast.success(`${viewer.name} is now ${statusLabel(status).toLowerCase()}`);
      refreshAll();
    }
  };

  const countryOptions = taxonomies?.countries ?? [];

  const columns: Column<Viewer>[] = [
    {
      key: "user",
      header: "User",
      sortKey: "name",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar initials={initialsOf(row.name)} color={row.avatarColor} size={38} ring={false} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{row.name}</p>
            <p className="truncate text-xs text-muted">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      cell: (row) => <span className="whitespace-nowrap text-[13px]">{row.phone}</span>,
    },
    {
      key: "country",
      header: "Country",
      align: "center",
      cell: (row) => (
        <span className="inline-flex items-center gap-1.5 text-[13px]">
          <Icon name="globe" size={13} className="text-muted" />
          {labelOf(countryOptions, row.country)}
        </span>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      align: "center",
      sortKey: "plan",
      cell: (row) => <Badge tone={PLAN_TONES[row.plan]}>{planLabel(row.plan)}</Badge>,
      filter: {
        value: query.plan ?? "all",
        options: PLAN_OPTIONS,
        onChange: (v) => setQuery({ plan: v }),
      },
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      cell: (row) => <Badge tone={STATUS_TONES[row.status]}>{statusLabel(row.status)}</Badge>,
      filter: {
        value: query.status ?? "all",
        options: VIEWER_STATUS_OPTIONS,
        onChange: (v) => setQuery({ status: v as never }),
      },
    },
    {
      key: "watchTime",
      header: "Watch time",
      align: "center",
      sortKey: "watchTimeMin",
      cell: (row) => <span className="whitespace-nowrap text-[13px]">{formatMinutes(row.watchTimeMin)}</span>,
    },
    {
      key: "lastActive",
      header: "Last active",
      align: "center",
      sortKey: "lastActiveAt",
      cell: (row) => <span className="whitespace-nowrap text-[13px]">{timeAgo(row.lastActiveAt)}</span>,
    },
    {
      key: "joined",
      header: "Joined",
      align: "right",
      sortKey: "joinedAt",
      cell: (row) => <span className="whitespace-nowrap text-[13px]">{formatDate(row.joinedAt)}</span>,
    },
  ];

  const activeFilters =
    (query.plan && query.plan !== "all" ? 1 : 0) +
    (query.status && query.status !== "all" ? 1 : 0) +
    (query.country && query.country !== "all" ? 1 : 0) +
    (query.from ? 1 : 0) +
    (query.to ? 1 : 0);

  return (
    <>
      <PageHeader
        title="Users"
        count={list.total}
        icon="users"
        iconColor="#0d9488"
        crumbs={[{ label: "Audience" }, { label: "Users" }]}
        activeTab={query.status ?? "all"}
        tabs={[
          { id: "all", label: "All users", icon: "users", color: "#0d9488", onSelect: () => setQuery({ status: "all" }) },
          ...VIEWER_STATUS_OPTIONS.map((option) => ({
            id: option.value,
            label: option.label,
            icon: (option.value === "active" ? "check" : option.value === "inactive" ? "clock" : "shield") as IconName,
            color: option.value === "active" ? "#047857" : option.value === "inactive" ? "#b45309" : "#dc2626",
            onSelect: () => setQuery({ status: option.value as ViewerStatus }),
          })),
        ]}
        actions={
          <>
            <Button variant="ghost" icon="filter" onClick={() => setShowFilters((v) => !v)}>
              Filters{activeFilters ? ` (${activeFilters})` : ""}
            </Button>
            <Button variant="secondary" icon="download" onClick={() => toast.success("User export queued")}>
              Export
            </Button>
          </>
        }
      />

      {/* ------------------------------- stats -------------------------------- */}
      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {statsLoading || !stats
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
          : STAT_CARDS.map((card) => (
              <Card key={card.key} className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${card.color}1a`, color: card.color }}
                >
                  <Icon name={card.icon} size={17} />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-[19px] font-bold leading-none tabular-nums text-ink">
                    {formatNumber(stats[card.key as keyof typeof stats])}
                  </p>
                  <p className="mt-1 text-[12px] text-muted">{card.label}</p>
                </div>
              </Card>
            ))}
      </div>

      {/* ------------------------------ filters ------------------------------- */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchInput
          value={query.search ?? ""}
          onChange={(v) => setQuery({ search: v })}
          placeholder="Search name or email"
          className="w-full sm:w-72"
        />
        {PLAN_OPTIONS.map((plan) => (
          <Chip
            key={plan.value}
            active={query.plan === plan.value}
            onClick={() => setQuery({ plan: query.plan === plan.value ? "all" : plan.value })}
          >
            {plan.label}
          </Chip>
        ))}
        <span className="ml-auto text-[12px] text-muted">
          {list.total} account{list.total === 1 ? "" : "s"}
        </span>
      </div>

      {showFilters ? (
        <Card className="mb-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Select
              label="Subscription"
              options={PLAN_OPTIONS}
              placeholder="All plans"
              value={query.plan ?? ""}
              onChange={(e) => setQuery({ plan: e.target.value || "all" })}
            />
            <Select
              label="Country"
              options={countryOptions}
              placeholder="All countries"
              value={query.country ?? ""}
              onChange={(e) => setQuery({ country: e.target.value || "all" })}
            />
            <DateInput label="Joined from" value={query.from ?? ""} onChange={(v) => setQuery({ from: v })} />
            <DateInput label="Joined to" value={query.to ?? ""} onChange={(v) => setQuery({ to: v })} />
          </div>

          {activeFilters ? (
            <div className="mt-4 flex justify-end">
              <Button
                variant="subtle"
                icon="close"
                size="sm"
                onClick={() =>
                  setQuery({ plan: "all", status: "all", country: "all", from: "", to: "" })
                }
              >
                Clear filters
              </Button>
            </div>
          ) : null}
        </Card>
      ) : null}

      {list.error ? <ErrorBox message={list.error} onRetry={list.refresh} /> : null}

      {/* ------------------------------- table -------------------------------- */}
      <DataTable
        columns={columns}
        rows={list.items}
        loading={list.loading}
        sort={query.sort}
        onSortChange={(sort) => setQuery({ sort })}
        onRowClick={(row) => setOpenId(row.id)}
        emptyTitle="No user matches these filters"
        emptyDescription="Try a different search term, plan or date range."
        emptyIcon="users"
        emptyAction={
          activeFilters || query.search ? (
            <Button
              icon="close"
              onClick={() => setQuery({ search: "", plan: "all", status: "all", country: "all", from: "", to: "" })}
            >
              Clear filters
            </Button>
          ) : null
        }
        rowActions={(row) => (
          <Dropdown
            trigger={({ toggle }) => <IconButton icon="dots" label="Actions" size="sm" onClick={toggle} />}
            items={[
              { label: "View user", icon: "eye", onSelect: () => setOpenId(row.id) },
              { label: "Edit user", icon: "pencil", onSelect: () => setEditing(row) },
              {
                label: row.status === "suspended" ? "Activate user" : "Suspend user",
                icon: row.status === "suspended" ? "check" : "shield",
                onSelect: () => setConfirmStatus(row),
              },
              { label: "Delete user", icon: "trash", tone: "danger", onSelect: () => setToDelete(row) },
            ]}
          />
        )}
      />

      <Pagination
        page={list.page}
        pageCount={list.pageCount}
        perPage={list.perPage}
        total={list.total}
        onPage={(page) => setQuery({ page })}
        onPerPage={(perPage) => setQuery({ perPage })}
      />

      {/* ------------------------------- drawer ------------------------------- */}
      <UserDetailsDrawer
        viewerId={openId}
        open={!!openId}
        onClose={() => setOpenId(null)}
        onEdit={(viewer) => {
          setOpenId(null);
          setEditing(viewer);
        }}
        onToggleStatus={(viewer) => {
          setOpenId(null);
          setConfirmStatus(viewer);
        }}
        onDelete={(viewer) => {
          setOpenId(null);
          setToDelete(viewer);
        }}
      />

      {/* -------------------------------- edit -------------------------------- */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit user"
        description={editing?.email}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              loading={update.pending}
              onClick={async () => {
                if (!editing) return;
                const saved = await update.run(editing.id, {
                  name: editing.name,
                  email: editing.email,
                  phone: editing.phone,
                  country: editing.country,
                  plan: editing.plan,
                  status: editing.status,
                  subscription: { ...editing.subscription, plan: editing.plan },
                });
                if (saved) {
                  toast.success("User updated");
                  setEditing(null);
                  refreshAll();
                }
              }}
            >
              Save changes
            </Button>
          </>
        }
      >
        {editing ? (
          <div className="space-y-4">
            <TextInput
              label="Full name"
              required
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextInput
                label="Email"
                type="email"
                required
                value={editing.email}
                onChange={(e) => setEditing({ ...editing, email: e.target.value })}
              />
              <TextInput
                label="Phone"
                value={editing.phone}
                onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
              />
              <Select
                label="Country"
                options={countryOptions}
                value={editing.country}
                onChange={(e) => setEditing({ ...editing, country: e.target.value })}
              />
              <Select
                label="Subscription"
                options={PLAN_OPTIONS}
                value={editing.plan}
                onChange={(e) => setEditing({ ...editing, plan: e.target.value as SubscriptionPlan })}
              />
              <Select
                label="Account status"
                options={VIEWER_STATUS_OPTIONS}
                value={editing.status}
                onChange={(e) => setEditing({ ...editing, status: e.target.value as ViewerStatus })}
              />
            </div>
          </div>
        ) : null}
      </Modal>

      {/* --------------------------- status confirm --------------------------- */}
      <ConfirmDialog
        open={!!confirmStatus}
        onClose={() => setConfirmStatus(null)}
        pending={update.pending}
        title={confirmStatus?.status === "suspended" ? "Activate user" : "Suspend user"}
        confirmLabel={confirmStatus?.status === "suspended" ? "Activate" : "Suspend"}
        message={
          confirmStatus?.status === "suspended"
            ? `${confirmStatus?.name} will regain access to streaming immediately.`
            : `${confirmStatus?.name} will lose access to streaming until reactivated.`
        }
        onConfirm={async () => {
          if (!confirmStatus) return;
          await applyStatus(confirmStatus, confirmStatus.status === "suspended" ? "active" : "suspended");
          setConfirmStatus(null);
        }}
      />

      {/* --------------------------- delete confirm --------------------------- */}
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        pending={remove.pending}
        title="Delete user"
        message={`${toDelete?.name} and their watch history will be permanently removed.`}
        onConfirm={async () => {
          if (!toDelete) return;
          await remove.run(toDelete.id);
          setToDelete(null);
          toast.success("User deleted");
          refreshAll();
        }}
      />
    </>
  );
}
