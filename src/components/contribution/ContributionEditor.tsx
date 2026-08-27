"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { contributionApi, taxonomyApi } from "@/lib/api/resources";
import { useMutation, useQuery } from "@/lib/hooks";
import { timeAgo } from "@/lib/format";
import type { Contribution } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { Avatar, Card, CardTitle, ErrorBox, Skeleton, StatusDot } from "@/components/ui/Primitives";
import { DurationInput, MultiSelect, Select, TextInput, Toggle } from "@/components/ui/Fields";
import { SegmentedControl, TabPanel, Tabs } from "@/components/ui/Tabs";
import { ConfirmDialog } from "@/components/ui/Overlays";
import { useToast } from "@/components/ui/Toast";

const TABS = [
  { id: "encodings", label: "Encodings" },
  { id: "languages", label: "Languages" },
  { id: "review", label: "Review" },
];

export default function ContributionEditor({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const { data: draft, loading, error, refresh, setData } = useQuery(() => contributionApi.get(id), [id]);
  const { data: taxonomies } = useQuery(() => taxonomyApi.all(), []);
  const [tab, setTab] = useState("encodings");
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);


  const save = useMutation((payload: Partial<Contribution>) => contributionApi.update(id, payload));
  const remove = useMutation(() => contributionApi.remove(id));

  /** Edits are written straight into the query cache — no mirrored state. */
  const patch = (values: Partial<Contribution>) => setData((prev) => ({ ...(prev as Contribution), ...values }));

  if (loading || !draft || !taxonomies) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        backHref="/contributions"
        crumbs={[{ label: "External contributions", href: "/contributions" }, { label: "Edition" }]}
        title={
          <span className="flex items-center gap-3">
            {renaming ? (
              <input
                autoFocus
                value={draft.title}
                onChange={(e) => patch({ title: e.target.value })}
                onBlur={() => setRenaming(false)}
                onKeyDown={(e) => e.key === "Enter" && setRenaming(false)}
                className="rounded-lg border border-line bg-input-bg px-3 py-1 text-2xl font-bold text-ink outline-none focus:border-brand/70"
              />
            ) : (
              <>
                {draft.title}
                <button
                  onClick={() => setRenaming(true)}
                  aria-label="Rename"
                  className="rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-ink"
                >
                  <Icon name="pencil" size={17} />
                </button>
              </>
            )}
            <Avatar initials={draft.creator.initials} name={draft.creator.name} color={draft.creator.color} size={30} />
            <StatusDot status={draft.status} />
          </span>
        }
        subtitle={`Submitted by ${draft.creator.name} · updated ${timeAgo(draft.updatedAt)}`}
        actions={
          <>
            <Toggle checked={draft.enabled} onChange={(v) => patch({ enabled: v })} />
            <Button
              icon="check"
              loading={save.pending}
              onClick={async () => {
                const saved = await save.run(draft);
                if (saved) toast.success("Contribution saved");
              }}
            >
              Save
            </Button>
          </>
        }
      />

      {error ? <ErrorBox message={error} onRetry={refresh} /> : null}

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "encodings" ? (
        <TabPanel>
          <Card>
            <CardTitle title="Source" subtitle="Stream pulled from the partner or an external player" />
            <div className="space-y-5">
              <SegmentedControl
                value={draft.sourceType}
                onChange={(v) => patch({ sourceType: v as Contribution["sourceType"] })}
                options={[
                  { value: "flux", label: "Stream" },
                  { value: "external", label: "External" },
                ]}
              />

              <TextInput
                label="Source URL"
                placeholder="https://partner.example.com/stream.m3u8"
                value={draft.sourceUrl}
                onChange={(e) => patch({ sourceUrl: e.target.value })}
              />

              <Button
                variant="secondary"
                icon="play"
                disabled={!draft.sourceUrl}
                onClick={() => setShowPlayer((v) => !v)}
              >
                Show the video
              </Button>

              {showPlayer && draft.sourceUrl ? (
                <video src={draft.sourceUrl} controls className="aspect-video w-full rounded-lg bg-black" />
              ) : null}

              <TextInput
                label="EPG URL"
                placeholder="https://partner.example.com/epg.xml"
                value={draft.epgUrl}
                onChange={(e) => patch({ epgUrl: e.target.value })}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DurationInput
                  label="Duration"
                  value={draft.durationSec}
                  onChange={(v) => patch({ durationSec: v })}
                />
                <Select
                  label="Duration type"
                  options={taxonomies.durationTypes}
                  value={draft.durationType}
                  onChange={(e) => patch({ durationType: e.target.value })}
                />
              </div>
            </div>
          </Card>
        </TabPanel>
      ) : null}

      {tab === "languages" ? (
        <TabPanel>
          <Card>
            <CardTitle title="Languages" subtitle="Audio tracks delivered with this contribution" />
            <MultiSelect
              label="Languages"
              options={taxonomies.languages}
              value={draft.languages}
              onChange={(v) => patch({ languages: v })}
            />
          </Card>
        </TabPanel>
      ) : null}

      {tab === "review" ? (
        <TabPanel>
          <Card>
            <CardTitle title="Review" subtitle="Approve the contribution to publish it in the catalogue" />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                icon="check"
                onClick={() => {
                  patch({ status: "online", enabled: true });
                  toast.success("Contribution approved");
                }}
              >
                Approve and publish
              </Button>
              <Button
                variant="secondary"
                icon="close"
                onClick={() => {
                  patch({ status: "draft", enabled: false });
                  toast.info("Contribution sent back to draft");
                }}
              >
                Send back to draft
              </Button>
            </div>
          </Card>
        </TabPanel>
      ) : null}

      <div className="mt-8 flex justify-end">
        <Button variant="danger" icon="trash" onClick={() => setConfirmDelete(true)}>
          Delete this contribution
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        pending={remove.pending}
        title="Delete contribution"
        message={`"${draft.title}" will be permanently removed.`}
        onConfirm={async () => {
          await remove.run();
          toast.success("Contribution deleted");
          router.push("/contributions");
        }}
      />
    </>
  );
}
