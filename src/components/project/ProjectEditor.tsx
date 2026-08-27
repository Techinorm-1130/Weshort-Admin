"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { projectApi } from "@/lib/api/resources";
import { useMutation, useQuery } from "@/lib/hooks";
import { formatNumber, slugify, timeAgo } from "@/lib/format";
import type { Project } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { Card, CardTitle, ErrorBox, Skeleton, StatusDot } from "@/components/ui/Primitives";
import { Select, TextInput, Toggle } from "@/components/ui/Fields";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { ConfirmDialog } from "@/components/ui/Overlays";
import { useToast } from "@/components/ui/Toast";

const TABS = [
  { id: "general", label: "General" },
  { id: "audience", label: "Audience" },
  { id: "danger", label: "Advanced" },
];

const KIND_OPTIONS = [
  { value: "svod", label: "Subscription (SVOD)" },
  { value: "avod", label: "Advertising (AVOD)" },
  { value: "tvod", label: "Transactional (TVOD)" },
  { value: "fast", label: "FAST channel" },
];

export default function ProjectEditor({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const { data: draft, loading, error, refresh, setData } = useQuery(() => projectApi.get(id), [id]);
  const [tab, setTab] = useState("general");
  const [confirmDelete, setConfirmDelete] = useState(false);


  const save = useMutation((payload: Partial<Project>) => projectApi.update(id, payload));
  const remove = useMutation(() => projectApi.remove(id));

  /** Edits are written straight into the query cache — no mirrored state. */
  const set = <K extends keyof Project>(key: K, value: Project[K]) =>
    setData((prev) => ({ ...(prev as Project), [key]: value }));

  if (loading || !draft) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  const stats = [
    { label: "Registered users", value: formatNumber(draft.registeredUsers) },
    { label: "Active users", value: formatNumber(draft.activeUsers) },
    { label: "Trial period", value: formatNumber(draft.trialUsers) },
    { label: "Churned users", value: formatNumber(draft.churnedUsers) },
  ];

  return (
    <>
      <PageHeader
        backHref="/projects"
        crumbs={[{ label: "Projects", href: "/projects" }, { label: "Edition" }]}
        title={
          <span className="flex items-center gap-3">
            {draft.name}
            <StatusDot status={draft.status} />
          </span>
        }
        subtitle={`Last update ${timeAgo(draft.updatedAt)}`}
        actions={
          <>
            <Toggle
              checked={draft.status === "online"}
              onChange={(v) => set("status", v ? "online" : "draft")}
              label={draft.status === "online" ? "Online" : "Offline"}
            />
            <Button
              icon="check"
              loading={save.pending}
              onClick={async () => {
                const saved = await save.run(draft);
                if (saved) toast.success("Project saved");
              }}
            >
              Save
            </Button>
          </>
        }
      />

      {error ? <ErrorBox message={error} onRetry={refresh} /> : null}

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "general" ? (
        <TabPanel>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardTitle title="Project settings" subtitle="Identity and distribution model" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextInput
                  label="Project name"
                  required
                  value={draft.name}
                  onChange={(e) => {
                    set("name", e.target.value);
                    set("slug", slugify(e.target.value));
                  }}
                />
                <TextInput
                  label="Slug"
                  prefix="weshort.com/"
                  value={draft.slug}
                  onChange={(e) => set("slug", slugify(e.target.value))}
                />
                <Select
                  label="Monetisation model"
                  options={KIND_OPTIONS}
                  value={draft.kind}
                  onChange={(e) => set("kind", e.target.value as Project["kind"])}
                />
                <TextInput
                  label="Custom domain"
                  placeholder="play.mybrand.com"
                  value={draft.domain}
                  onChange={(e) => set("domain", e.target.value)}
                />
                <TextInput
                  label="Active offers"
                  type="number"
                  value={draft.activeOffers}
                  onChange={(e) => set("activeOffers", Number(e.target.value))}
                  hint="Number of published subscription or rental offers."
                />
              </div>
            </Card>

            <Card>
              <CardTitle title="Audience snapshot" />
              <ul className="space-y-3">
                {stats.map((s) => (
                  <li key={s.label} className="flex items-center justify-between rounded-lg bg-surface-2 px-3.5 py-3">
                    <span className="text-sm text-muted">{s.label}</span>
                    <span className="font-display font-bold text-ink">{s.value}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </TabPanel>
      ) : null}

      {tab === "audience" ? (
        <TabPanel>
          <Card>
            <CardTitle title="Audience" subtitle="Counters served by the backend once connected" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="card-premium-2 p-5">
                  <p className="text-sm text-muted">{s.label}</p>
                  <p className="mt-2 font-display text-2xl font-bold text-ink">{s.value}</p>
                </div>
              ))}
            </div>
          </Card>
        </TabPanel>
      ) : null}

      {tab === "danger" ? (
        <TabPanel>
          <Card className="border-danger/30">
            <CardTitle title="Advanced" subtitle="Irreversible operations" />
            <div className="flex flex-col gap-3 rounded-lg border border-danger/25 bg-danger/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">Delete this project</p>
                <p className="text-[13px] text-muted">Offers, users and analytics attached to it are removed.</p>
              </div>
              <Button variant="danger" icon="trash" onClick={() => setConfirmDelete(true)}>
                Delete project
              </Button>
            </div>
          </Card>
        </TabPanel>
      ) : null}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        pending={remove.pending}
        title="Delete project"
        message={`"${draft.name}" will be permanently deleted.`}
        onConfirm={async () => {
          await remove.run();
          toast.success("Project deleted");
          router.push("/projects");
        }}
      />
    </>
  );
}
