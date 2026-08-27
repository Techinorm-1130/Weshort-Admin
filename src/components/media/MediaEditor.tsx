"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { mediaApi, taxonomyApi } from "@/lib/api/resources";
import { useMutation, useQuery } from "@/lib/hooks";
import { timeAgo } from "@/lib/format";
import type { Media } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { Avatar, ErrorBox, Skeleton, StatusDot } from "@/components/ui/Primitives";
import { Toggle } from "@/components/ui/Fields";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { ConfirmDialog } from "@/components/ui/Overlays";
import { useToast } from "@/components/ui/Toast";
import EncodingsTab from "./tabs/EncodingsTab";
import LanguagesTab from "./tabs/LanguagesTab";
import MetadataTab from "./tabs/MetadataTab";
import CastingTab from "./tabs/CastingTab";
import MetadataLanguagesTab from "./tabs/MetadataLanguagesTab";
import RightsTab from "./tabs/RightsTab";
import AvailabilityTab from "./tabs/AvailabilityTab";

const TABS = [
  { id: "encodings", label: "Encodings" },
  { id: "languages", label: "Languages" },
  { id: "metadata", label: "Metadata" },
  { id: "casting", label: "Casting" },
  { id: "metadata-languages", label: "Metadata languages" },
  { id: "rights", label: "Rights management" },
  { id: "availability", label: "Availability" },
];

export default function MediaEditor({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const { data: draft, loading, error, refresh, setData } = useQuery(() => mediaApi.get(id), [id]);
  const { data: taxonomies } = useQuery(() => taxonomyApi.all(), []);
  const { data: siblings } = useQuery(() => mediaApi.list({ perPage: 50 }), []);

  const [tab, setTab] = useState("encodings");
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);


  const save = useMutation((payload: Partial<Media>) => mediaApi.update(id, payload));
  const remove = useMutation(() => mediaApi.remove(id));
  const encode = useMutation(() => mediaApi.startEncoding(id));

  /** Edits are written straight into the query cache — no mirrored state. */
  const patch = (values: Partial<Media>) => setData((prev) => ({ ...(prev as Media), ...values }));

  if (loading || !draft || !taxonomies) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const copySources = (siblings?.items ?? []).filter((m) => m.id !== id);

  return (
    <>
      <PageHeader
        backHref="/medias"
        crumbs={[{ label: "Medias", href: "/medias" }, { label: "Edition" }]}
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
        subtitle={`Last update ${timeAgo(draft.updatedAt)}`}
        actions={
          <>
            <Toggle checked={draft.enabled} onChange={(v) => patch({ enabled: v })} />

            <label className="hidden items-center gap-2 xl:flex">
              <select
                value=""
                onChange={(e) => {
                  const source = copySources.find((m) => m.id === e.target.value);
                  if (!source) return;
                  patch({
                    metadata: { ...source.metadata },
                    rights: { ...source.rights },
                    casting: [...source.casting],
                  });
                  toast.success(`Metadata copied from ${source.title}`);
                }}
                className="h-10 w-56 rounded-lg border border-line bg-input-bg px-3 text-sm text-ink outline-none"
              >
                <option value="">Copy metadata from...</option>
                {copySources.map((m) => (
                  <option key={m.id} value={m.id} className="bg-surface">
                    {m.title}
                  </option>
                ))}
              </select>
            </label>

            <Button
              icon="check"
              loading={save.pending}
              onClick={async () => {
                const saved = await save.run(draft);
                if (saved) toast.success("Media saved");
              }}
            >
              Save
            </Button>
          </>
        }
      />

      {error ? <ErrorBox message={error} onRetry={refresh} /> : null}

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <TabPanel>
        {tab === "encodings" ? (
          <EncodingsTab
            media={draft}
            onChange={patch}
            onStartEncoding={async () => {
              const job = await encode.run();
              if (job) {
                toast.success("Encoding started");
                patch({ status: "processing", encodingProgress: 5 });
              }
            }}
            encoding={encode.pending}
          />
        ) : null}
        {tab === "languages" ? <LanguagesTab media={draft} onChange={patch} taxonomies={taxonomies} /> : null}
        {tab === "metadata" ? <MetadataTab media={draft} onChange={patch} taxonomies={taxonomies} /> : null}
        {tab === "casting" ? <CastingTab media={draft} onChange={patch} taxonomies={taxonomies} /> : null}
        {tab === "metadata-languages" ? (
          <MetadataLanguagesTab media={draft} onChange={patch} taxonomies={taxonomies} />
        ) : null}
        {tab === "rights" ? <RightsTab media={draft} onChange={patch} taxonomies={taxonomies} /> : null}
        {tab === "availability" ? <AvailabilityTab media={draft} onChange={patch} /> : null}
      </TabPanel>

      <div className="mt-8 flex justify-end">
        <Button variant="danger" icon="trash" onClick={() => setConfirmDelete(true)}>
          Delete this media
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        pending={remove.pending}
        title="Delete media"
        message={`"${draft.title}" will be permanently removed from the catalogue.`}
        onConfirm={async () => {
          await remove.run();
          toast.success("Media deleted");
          router.push("/medias");
        }}
      />
    </>
  );
}
