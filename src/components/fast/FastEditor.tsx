"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fastApi, taxonomyApi } from "@/lib/api/resources";
import { useMutation, useQuery } from "@/lib/hooks";
import { timeAgo } from "@/lib/format";
import type { FastChannel } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { Card, CardTitle, ErrorBox, Skeleton, StatusDot } from "@/components/ui/Primitives";
import { MultiSelect, TextInput, Toggle } from "@/components/ui/Fields";
import { SegmentedControl, TabPanel, Tabs } from "@/components/ui/Tabs";
import { ImageDrop } from "@/components/ui/Uploader";
import { ConfirmDialog } from "@/components/ui/Overlays";
import { useToast } from "@/components/ui/Toast";

const TABS = [
  { id: "encodings", label: "Encodings" },
  { id: "branding", label: "Branding" },
  { id: "advertising", label: "Advertising" },
];

export default function FastEditor({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const { data: draft, loading, error, refresh, setData } = useQuery(() => fastApi.get(id), [id]);
  const { data: taxonomies } = useQuery(() => taxonomyApi.all(), []);
  const [tab, setTab] = useState("encodings");
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);


  const save = useMutation((payload: Partial<FastChannel>) => fastApi.update(id, payload));
  const remove = useMutation(() => fastApi.remove(id));

  /** Edits are written straight into the query cache — no mirrored state. */
  const patch = (values: Partial<FastChannel>) => setData((prev) => ({ ...(prev as FastChannel), ...values }));

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
        backHref="/fast-channels"
        crumbs={[{ label: "FAST broadcasts", href: "/fast-channels" }, { label: "Edition" }]}
        title={
          <span className="flex items-center gap-3">
            {renaming ? (
              <input
                autoFocus
                value={draft.name}
                onChange={(e) => patch({ name: e.target.value })}
                onBlur={() => setRenaming(false)}
                onKeyDown={(e) => e.key === "Enter" && setRenaming(false)}
                className="rounded-lg border border-line bg-input-bg px-3 py-1 text-2xl font-bold text-ink outline-none focus:border-brand/70"
              />
            ) : (
              <>
                {draft.name}
                <button
                  onClick={() => setRenaming(true)}
                  aria-label="Rename"
                  className="rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-ink"
                >
                  <Icon name="pencil" size={17} />
                </button>
              </>
            )}
            <StatusDot status={draft.status} />
          </span>
        }
        subtitle={`Last update ${timeAgo(draft.updatedAt)}`}
        actions={
          <>
            <Toggle checked={draft.enabled} onChange={(v) => patch({ enabled: v, status: v ? "online" : "draft" })} />
            <Button
              icon="check"
              loading={save.pending}
              onClick={async () => {
                const saved = await save.run(draft);
                if (saved) toast.success("Channel saved");
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
            <CardTitle title="Source" subtitle="Where the linear signal comes from" />

            <div className="space-y-5">
              <SegmentedControl
                value={draft.sourceType}
                onChange={(v) => patch({ sourceType: v as FastChannel["sourceType"] })}
                options={[
                  { value: "internal", label: "Internal" },
                  { value: "external", label: "External" },
                ]}
              />

              <TextInput
                label="Source URL"
                placeholder="https://stream.example.com/live.m3u8"
                value={draft.sourceUrl}
                onChange={(e) => patch({ sourceUrl: e.target.value })}
              />

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  icon="play"
                  disabled={!draft.sourceUrl}
                  onClick={() => setShowPlayer((v) => !v)}
                >
                  Show the video
                </Button>
                <Button
                  variant="secondary"
                  icon="sliders"
                  disabled={!draft.adsEnabled}
                  onClick={() => setTab("advertising")}
                >
                  Show advertising settings
                </Button>
              </div>

              {showPlayer && draft.sourceUrl ? (
                <video src={draft.sourceUrl} controls className="aspect-video w-full rounded-lg bg-black" />
              ) : null}

              <TextInput
                label="EPG URL"
                placeholder="https://epg.example.com/guide.xml"
                value={draft.epgUrl}
                onChange={(e) => patch({ epgUrl: e.target.value })}
                hint="XMLTV programme guide used by the player and connected TVs."
              />

              <MultiSelect
                label="Languages"
                options={taxonomies.languages}
                value={draft.languages}
                onChange={(v) => patch({ languages: v })}
              />
            </div>
          </Card>
        </TabPanel>
      ) : null}

      {tab === "branding" ? (
        <TabPanel>
          <Card>
            <CardTitle title="Branding" subtitle="Logo shown in the channel guide" />
            <div className="w-48">
              <ImageDrop
                ratio="1:1"
                label="Channel logo"
                value={draft.logo ?? undefined}
                onChange={(v) => patch({ logo: v ?? null })}
              />
            </div>
          </Card>
        </TabPanel>
      ) : null}

      {tab === "advertising" ? (
        <TabPanel>
          <Card>
            <CardTitle title="Advertising" subtitle="Server-side ad insertion for this channel" />
            <div className="space-y-5">
              <div className="rounded-lg border border-line bg-surface-2 px-4 py-3.5">
                <Toggle
                  checked={draft.adsEnabled}
                  onChange={(v) => patch({ adsEnabled: v })}
                  label="Enable ad breaks"
                  description="Requires a VAST/VMAP compatible ad tag."
                />
              </div>
              <TextInput
                label="Ad tag URL"
                placeholder="https://ads.example.com/vast?channel=..."
                value={draft.adTagUrl}
                disabled={!draft.adsEnabled}
                onChange={(e) => patch({ adTagUrl: e.target.value })}
              />
            </div>
          </Card>
        </TabPanel>
      ) : null}

      <div className="mt-8 flex justify-end">
        <Button variant="danger" icon="trash" onClick={() => setConfirmDelete(true)}>
          Delete this channel
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        pending={remove.pending}
        title="Delete FAST broadcast"
        message={`"${draft.name}" will stop streaming immediately.`}
        onConfirm={async () => {
          await remove.run();
          toast.success("Channel deleted");
          router.push("/fast-channels");
        }}
      />
    </>
  );
}
