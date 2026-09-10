"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { contentApi, taxonomyApi, type ContentQuery } from "@/lib/api/resources";
import { useList, useMutation, useQuery } from "@/lib/hooks";
import { CURRENT_USER, IS_REVIEWER } from "@/lib/session";
import { formatDate, formatDuration, formatMinutes, labelsOf } from "@/lib/format";
import { downloadCsv, type SheetColumn } from "@/lib/export";
import { AGE_RATINGS, AUDIO_LANGUAGES } from "@/lib/api/seed-ott";
import type { ContentItem, UploaderStats } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import Button, { Chip, IconButton } from "@/components/ui/Button";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { Pagination, SearchInput } from "@/components/ui/Toolbar";
import { Avatar, Badge, Card, ErrorBox, Skeleton } from "@/components/ui/Primitives";
import { ConfirmDialog, Dropdown, Modal } from "@/components/ui/Overlays";
import { TextArea } from "@/components/ui/Fields";
import Icon from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import ContentDetailsDrawer from "@/components/content/ContentDetailsDrawer";
import {
  ACCESS_TONES, APPROVAL_TONES, STATUS_FILTERS, STATUS_TONES, TYPE_ICONS, accessLabel,
  approvalLabel, statusLabel, typeLabel,
} from "@/components/content/contentMeta";

/** The signed-in member; every screen reads it from lib/session. */
const ME = CURRENT_USER;

type View = "all" | "pending" | "approved" | "mine" | "member";

/** What the toolbar count refers to in each view. */
const VIEW_CAPTION: Record<View, string> = {
  all: "All team uploads",
  pending: "Waiting for approval",
  approved: "Approved uploads",
  mine: `Uploaded by ${ME.name}`,
  member: "All team uploads",
};

export default function ContentLibraryPage() {
  const router = useRouter();
  const toast = useToast();

  const [view, setView] = useState<View>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<ContentItem | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const list = useList<ContentItem>((q) => contentApi.list(q as ContentQuery), {
    perPage: 10,
    sort: "-createdAt",
  });
  const { data: members, loading: membersLoading, refresh: refreshMembers } =
    useQuery(() => contentApi.byMember(), []);
  const { data: taxonomies } = useQuery(() => taxonomyApi.all(), []);

  const query = list.query as ContentQuery;
  const setQuery = (patch: Partial<ContentQuery>) => list.setQuery(patch as never);
  const remove = useMutation((id: string) => contentApi.remove(id));
  const approve = useMutation((id: string) => contentApi.approve(id));
  const reject = useMutation((id: string, note: string) => contentApi.reject(id, note));

  const [toApprove, setToApprove] = useState<ContentItem | null>(null);
  const [toReject, setToReject] = useState<ContentItem | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  /** Switching view is just a filter change — the table stays the same. */
  const goTo = (next: View) => {
    setView(next);
    const base = { page: 1, uploadedBy: "all", approval: "all" } as Partial<ContentQuery>;
    if (next === "all") setQuery(base);
    if (next === "mine") setQuery({ ...base, uploadedBy: ME.id });
    if (next === "pending") setQuery({ ...base, approval: "pending" });
    if (next === "approved") setQuery({ ...base, approval: "approved" });
  };

  const refreshAll = () => {
    list.refresh();
    refreshMembers();
  };

  /* ------------------------------- exports ------------------------------- */

  const CONTENT_COLUMNS: SheetColumn<ContentItem>[] = [
    { header: "Title", value: (r) => r.title },
    { header: "Type", value: (r) => typeLabel(r.type) },
    { header: "Status", value: (r) => statusLabel(r.status) },
    { header: "Access", value: (r) => accessLabel(r.access) },
    { header: "Uploaded by", value: (r) => r.uploadedBy.name },
    { header: "Review state", value: (r) => approvalLabel(r.approval.state) },
    { header: "Submitted on", value: (r) => (r.approval.submittedAt ? formatDate(r.approval.submittedAt, true) : "") },
    { header: "Reviewed on", value: (r) => (r.approval.reviewedAt ? formatDate(r.approval.reviewedAt, true) : "") },
    { header: "Reviewed by", value: (r) => r.approval.reviewedBy?.name ?? "" },
    { header: "Review note", value: (r) => r.approval.note },
    { header: "Uploaded on", value: (r) => formatDate(r.createdAt, true) },
    { header: "Last updated", value: (r) => formatDate(r.updatedAt) },
    { header: "Release date", value: (r) => (r.releaseDate ? formatDate(r.releaseDate) : "") },
    { header: "Duration", value: (r) => (r.durationSec ? formatDuration(r.durationSec) : "") },
    { header: "Duration (min)", value: (r) => Math.round(r.durationSec / 60) },
    { header: "Language", value: (r) => r.language.toUpperCase() },
    { header: "Genres", value: (r) => labelsOf(taxonomies?.genres ?? [], r.genres) },
    { header: "Country", value: (r) => r.country.toUpperCase() },
    { header: "Age rating", value: (r) => labelsOf(AGE_RATINGS, [r.ageRating]) },
    { header: "Audio languages", value: (r) => labelsOf(AUDIO_LANGUAGES, r.audioLanguages) },
    { header: "Subtitles", value: (r) => r.subtitles.map((s) => s.label).join(", ") },
    { header: "Seasons", value: (r) => r.seasons.length },
    { header: "Episodes", value: (r) => r.seasons.reduce((n, s) => n + s.episodes.length, 0) },
    { header: "Featured", value: (r) => (r.featured ? "Yes" : "No") },
    { header: "Downloads allowed", value: (r) => (r.allowDownload ? "Yes" : "No") },
    { header: "Publish date", value: (r) => (r.publishAt ? formatDate(r.publishAt) : "") },
    { header: "Expiry date", value: (r) => (r.expiryAt ? formatDate(r.expiryAt) : "") },
  ];

  const MEMBER_COLUMNS: SheetColumn<UploaderStats>[] = [
    { header: "Member", value: (r) => r.member.name },
    { header: "Role", value: (r) => r.role },
    { header: "Total uploads", value: (r) => r.total },
    { header: "Published", value: (r) => r.published },
    { header: "Draft", value: (r) => r.draft },
    { header: "Scheduled", value: (r) => r.scheduled },
    { header: "Pending approval", value: (r) => r.pending },
    { header: "Approved", value: (r) => r.approved },
    { header: "Rejected", value: (r) => r.rejected },
    { header: "Movies", value: (r) => r.movies },
    { header: "Series", value: (r) => r.series },
    { header: "Episodes", value: (r) => r.episodes },
    { header: "Total runtime (min)", value: (r) => Math.round(r.totalDurationSec / 60) },
    { header: "Last upload", value: (r) => (r.lastUploadAt ? formatDate(r.lastUploadAt, true) : "") },
  ];

  /** Exports the whole filtered set, not just the page on screen. */
  const exportContent = async (scope: "all" | "mine" | string, base: string) => {
    const res = await contentApi.list({
      ...query,
      uploadedBy: scope === "all" || scope === "mine" ? (scope === "mine" ? ME.id : "all") : scope,
      page: 1,
      perPage: 1000,
    });
    const count = downloadCsv(base, res.items, CONTENT_COLUMNS);
    toast.success(`${count} title(s) exported to Excel`);
  };

  const exportMembers = () => {
    if (!members) return;
    const count = downloadCsv("weshort-uploads-by-member", members, MEMBER_COLUMNS);
    toast.success(`${count} member row(s) exported to Excel`);
  };

  /* -------------------------------- table -------------------------------- */

  const columns: Column<ContentItem>[] = [
    {
      key: "title",
      header: "Title",
      sortKey: "title",
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-2 text-muted">
            <Icon name={TYPE_ICONS[row.type]} size={15} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{row.title}</p>
            <p className="truncate text-[11px] text-muted">
              {typeLabel(row.type)}
              {row.seasons.length
                ? ` · ${row.seasons.reduce((n, s) => n + s.episodes.length, 0)} episodes`
                : ""}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "uploadedBy",
      header: "Uploaded by",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Avatar initials={row.uploadedBy.initials} color={row.uploadedBy.color} size={24} ring={false} />
          <span className="truncate text-[13px]">{row.uploadedBy.name}</span>
        </div>
      ),
      filter: {
        value: query.uploadedBy ?? "all",
        options: (members ?? []).map((m) => ({ value: m.member.id, label: m.member.name })),
        onChange: (v) => {
          setQuery({ uploadedBy: v });
          setView(v === "all" ? "all" : v === ME.id ? "mine" : "all");
        },
      },
    },
    {
      key: "approval",
      header: "Review",
      align: "center",
      cell: (row) => (
        <Badge tone={APPROVAL_TONES[row.approval.state]}>{approvalLabel(row.approval.state)}</Badge>
      ),
      filter: {
        value: query.approval ?? "all",
        options: [
          { value: "pending", label: "Waiting for approval" },
          { value: "approved", label: "Approved" },
          { value: "rejected", label: "Rejected" },
          { value: "draft", label: "Not submitted" },
        ],
        onChange: (v) => setQuery({ approval: v }),
      },
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      cell: (row) => <Badge tone={STATUS_TONES[row.status]}>{statusLabel(row.status)}</Badge>,
      filter: {
        value: query.status ?? "all",
        options: STATUS_FILTERS.filter((f) => f.value !== "all"),
        onChange: (v) => setQuery({ status: v as never }),
      },
    },
    {
      key: "access",
      header: "Access",
      align: "center",
      cell: (row) => <Badge tone={ACCESS_TONES[row.access]}>{accessLabel(row.access)}</Badge>,
    },
    {
      key: "duration",
      header: "Duration",
      align: "center",
      cell: (row) => (
        <span className="whitespace-nowrap tabular-nums text-[13px]">
          {row.durationSec ? formatDuration(row.durationSec) : "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Uploaded",
      align: "right",
      sortKey: "createdAt",
      cell: (row) => <span className="whitespace-nowrap text-[13px]">{formatDate(row.createdAt)}</span>,
    },
  ];

  const pendingCount = (members ?? []).reduce((n, m) => n + m.pending, 0);

  const onApprove = async (item: ContentItem) => {
    const done = await approve.run(item.id);
    if (done) {
      toast.success(`"${item.title}" approved and ${done.status === "scheduled" ? "scheduled" : "published"}`);
      setToApprove(null);
      refreshAll();
    }
  };

  const onReject = async () => {
    if (!toReject || !rejectNote.trim()) return;
    const done = await reject.run(toReject.id, rejectNote.trim());
    if (done) {
      toast.success(`"${toReject.title}" was rejected`);
      setToReject(null);
      setRejectNote("");
      refreshAll();
    }
  };

  const totalRuntime = (members ?? []).reduce((n, m) => n + m.totalDurationSec, 0);

  return (
    <>
      <PageHeader
        title="Content"
        count={list.total}
        icon="film"
        iconColor="#0369a1"
        crumbs={[{ label: "Catalogue" }, { label: "Library" }]}
        activeTab={view}
        tabs={[
          { id: "all", label: "All uploads", icon: "layers", color: "#0369a1", onSelect: () => goTo("all") },
          ...(IS_REVIEWER
            ? [
                {
                  id: "pending",
                  label: pendingCount ? `Pending (${pendingCount})` : "Pending",
                  icon: "clock" as const,
                  color: "#b45309",
                  onSelect: () => goTo("pending"),
                },
                {
                  id: "approved",
                  label: "Approved",
                  icon: "check" as const,
                  color: "#047857",
                  onSelect: () => goTo("approved"),
                },
              ]
            : []),
          { id: "mine", label: "My uploads", icon: "user", color: "#0d9488", onSelect: () => goTo("mine") },
          { id: "member", label: "By member", icon: "users", color: "#7c3aed", onSelect: () => goTo("member") },
        ]}
        actions={
          <>
            <Dropdown
              trigger={({ toggle }) => (
                <Button variant="secondary" icon="download" iconRight="chevron-down" onClick={toggle}>
                  Export
                </Button>
              )}
              items={[
                {
                  label: "All uploads (Excel)",
                  icon: "file",
                  onSelect: () => exportContent("all", "weshort-content-all"),
                },
                {
                  label: "My uploads (Excel)",
                  icon: "user",
                  onSelect: () => exportContent("mine", "weshort-content-mine"),
                },
                { label: "Summary by member (Excel)", icon: "users", onSelect: exportMembers },
              ]}
            />
            <Button icon="plus" onClick={() => router.push("/content/upload")}>
              Upload content
            </Button>
          </>
        }
      />

      {list.error ? <ErrorBox message={list.error} onRetry={list.refresh} /> : null}

      {/* ------------------------------ by member ----------------------------- */}
      {view === "member" ? (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[
              { label: "Team members", value: String(members?.length ?? 0), icon: "users", color: "#7c3aed" },
              { label: "Total uploads", value: String(list.total), icon: "film", color: "#0369a1" },
              { label: "Waiting for approval", value: String(pendingCount), icon: "clock", color: "#b45309" },
              { label: "Total runtime", value: formatMinutes(Math.round(totalRuntime / 60)), icon: "play", color: "#0d9488" },
            ].map((stat) => (
              <Card key={stat.label} className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${stat.color}1a`, color: stat.color }}
                >
                  <Icon name={stat.icon as never} size={17} />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-[19px] font-bold leading-none tabular-nums text-ink">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[12px] text-muted">{stat.label}</p>
                </div>
              </Card>
            ))}
          </div>

          {membersLoading || !members ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((row) => (
                <MemberRow
                  key={row.member.id}
                  row={row}
                  expanded={expanded === row.member.id}
                  onToggle={() => setExpanded(expanded === row.member.id ? null : row.member.id)}
                  onOpen={(id) => setOpenId(id)}
                  onExport={() =>
                    exportContent(row.member.id, `weshort-content-${row.member.name.toLowerCase().replace(/\s+/g, "-")}`)
                  }
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {view === "pending" ? (
            <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-warn/30 bg-warn/8 px-4 py-2.5 text-[13px] text-warn">
              <Icon name="clock" size={15} />
              <span>
                {list.total} upload{list.total === 1 ? "" : "s"} from the team waiting for your review.
                Approving publishes the title; rejecting sends it back with your note.
              </span>
            </div>
          ) : null}

          {/* ------------------------------ toolbar ---------------------------- */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <SearchInput
              value={query.search ?? ""}
              onChange={(v) => setQuery({ search: v })}
              placeholder="Search titles"
              className="w-full sm:w-72"
            />
            {/* pending titles are all drafts, so the status chips only muddle that view */}
            {view === "pending"
              ? null
              : STATUS_FILTERS.map((filter) => (
                  <Chip
                    key={filter.value}
                    active={(query.status ?? "all") === filter.value}
                    onClick={() => setQuery({ status: filter.value as never })}
                  >
                    {filter.label}
                  </Chip>
                ))}
            <span className="ml-auto text-[12px] text-muted">
              {VIEW_CAPTION[view]} · {list.total} title{list.total === 1 ? "" : "s"}
            </span>
          </div>

          <DataTable
            columns={columns}
            rows={list.items}
            loading={list.loading}
            sort={query.sort}
            onSortChange={(sort) => setQuery({ sort })}
            onRowClick={(row) => setOpenId(row.id)}
            emptyTitle={view === "mine" ? "You have not uploaded anything yet" : "No content matches this view"}
            emptyDescription="Upload a movie, series or episode to see it listed here."
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
                  { label: "View details", icon: "eye", onSelect: () => setOpenId(row.id) },
                  ...(IS_REVIEWER && row.approval.state === "pending"
                    ? [
                        { label: "Approve", icon: "check" as const, onSelect: () => setToApprove(row) },
                        { label: "Reject", icon: "close" as const, onSelect: () => setToReject(row) },
                      ]
                    : []),
                  { label: "Edit", icon: "pencil", onSelect: () => router.push("/content/upload") },
                  { label: "Delete", icon: "trash", tone: "danger", onSelect: () => setToDelete(row) },
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
        </>
      )}

      <ContentDetailsDrawer
        contentId={openId}
        open={!!openId}
        onClose={() => setOpenId(null)}
        onEdit={() => {
          setOpenId(null);
          router.push("/content/upload");
        }}
        onDelete={(item) => {
          setOpenId(null);
          setToDelete(item);
        }}
        onApprove={
          IS_REVIEWER
            ? (item) => {
                setOpenId(null);
                setToApprove(item);
              }
            : undefined
        }
        onReject={
          IS_REVIEWER
            ? (item) => {
                setOpenId(null);
                setToReject(item);
              }
            : undefined
        }
      />

      <ConfirmDialog
        open={!!toApprove}
        onClose={() => setToApprove(null)}
        pending={approve.pending}
        title="Approve this upload"
        confirmLabel="Approve"
        message={`"${toApprove?.title}" goes live once approved${
          toApprove?.publishAt ? ` (publish date ${formatDate(toApprove.publishAt)})` : ""
        }.`}
        onConfirm={() => toApprove && onApprove(toApprove)}
      />

      <Modal
        open={!!toReject}
        onClose={() => {
          setToReject(null);
          setRejectNote("");
        }}
        title="Reject this upload"
        description="The note is kept on the record so the team knows why."
        width="max-w-md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setToReject(null);
                setRejectNote("");
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" loading={reject.pending} disabled={!rejectNote.trim()} onClick={onReject}>
              Reject upload
            </Button>
          </>
        }
      >
        <TextArea
          label="Reason"
          required
          rows={4}
          placeholder="Master file is 720p — please resupply in 1080p or better."
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          error={rejectNote.trim() ? undefined : "A reason is required"}
        />
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        pending={remove.pending}
        title="Delete content"
        message={`"${toDelete?.title}" will be removed from the catalogue.`}
        onConfirm={async () => {
          if (!toDelete) return;
          await remove.run(toDelete.id);
          setToDelete(null);
          toast.success("Content deleted");
          refreshAll();
        }}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */

/** One team member, with their totals and an expandable list of their titles. */
function MemberRow({
  row, expanded, onToggle, onOpen, onExport,
}: {
  row: UploaderStats;
  expanded: boolean;
  onToggle: () => void;
  onOpen: (id: string) => void;
  onExport: () => void;
}) {
  const { data, loading } = useQuery(
    () =>
      expanded
        ? contentApi.list({ uploadedBy: row.member.id, perPage: 50, sort: "-createdAt" })
        : Promise.resolve(null),
    [expanded, row.member.id],
  );

  return (
    <Card padded={false}>
      <div className="flex flex-wrap items-center gap-3 p-3">
        <button
          onClick={onToggle}
          aria-label={expanded ? "Collapse" : "Expand"}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-ink"
        >
          <Icon name="chevron-down" size={15} className={expanded ? "" : "-rotate-90"} />
        </button>

        <Avatar initials={row.member.initials} color={row.member.color} size={34} ring={false} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-ink">{row.member.name}</p>
          <p className="text-[11px] capitalize text-muted">
            {row.role} · last upload {row.lastUploadAt ? formatDate(row.lastUploadAt) : "—"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          {[
            { label: "uploads", value: row.total },
            { label: "approved", value: row.approved },
            { label: "pending", value: row.pending },
            { label: "drafts", value: row.draft },
          ].map((stat) => (
            <span key={stat.label} className="flex items-baseline gap-1.5">
              <span className="font-display text-[15px] font-bold tabular-nums text-ink">{stat.value}</span>
              <span className="text-[11px] text-muted">{stat.label}</span>
            </span>
          ))}
          <span className="text-[11px] text-muted">
            {formatMinutes(Math.round(row.totalDurationSec / 60))} runtime
          </span>
        </div>

        <Button size="sm" variant="secondary" icon="download" onClick={onExport}>
          Excel
        </Button>
      </div>

      {expanded ? (
        <div className="border-t border-line">
          {loading || !data ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : data.items.length === 0 ? (
            <p className="p-4 text-[13px] text-muted">No uploads from this member yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {data.items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => onOpen(item.id)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-surface-2"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-2 text-muted">
                      <Icon name={TYPE_ICONS[item.type]} size={14} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{item.title}</span>
                    <Badge tone={STATUS_TONES[item.status]}>{statusLabel(item.status)}</Badge>
                    <span className="hidden w-20 shrink-0 text-right text-[11px] tabular-nums text-muted sm:block">
                      {item.durationSec ? formatDuration(item.durationSec) : "—"}
                    </span>
                    <span className="hidden w-24 shrink-0 text-right text-[11px] text-muted md:block">
                      {formatDate(item.createdAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </Card>
  );
}
