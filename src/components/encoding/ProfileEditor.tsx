"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { encodingApi } from "@/lib/api/resources";
import { useMutation, useQuery } from "@/lib/hooks";
import { timeAgo } from "@/lib/format";
import type { EncodingProfile } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { Card, CardTitle, ErrorBox, Skeleton } from "@/components/ui/Primitives";
import { Select, TextInput, Toggle } from "@/components/ui/Fields";
import { ConfirmDialog } from "@/components/ui/Overlays";
import { useToast } from "@/components/ui/Toast";

const RESOLUTIONS = [
  { value: "3840x2160", label: "2160p — Ultra HD" },
  { value: "1920x1080", label: "1080p — Full HD" },
  { value: "1280x720", label: "720p — HD" },
  { value: "854x480", label: "480p — SD" },
  { value: "-", label: "Audio only" },
];

const CODECS = ["H.264", "H.265", "AV1", "VP9", "AAC"].map((v) => ({ value: v, label: v }));
const CONTAINERS = ["HLS", "DASH", "MP4", "CMAF"].map((v) => ({ value: v, label: v }));

export default function ProfileEditor({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const { data: draft, loading, error, refresh, setData } = useQuery(() => encodingApi.getProfile(id), [id]);
  const [confirmDelete, setConfirmDelete] = useState(false);


  const save = useMutation((payload: Partial<EncodingProfile>) => encodingApi.updateProfile(id, payload));
  const remove = useMutation(() => encodingApi.removeProfile(id));

  /** Edits are written straight into the query cache — no mirrored state. */
  const set = <K extends keyof EncodingProfile>(key: K, value: EncodingProfile[K]) =>
    setData((prev) => ({ ...(prev as EncodingProfile), [key]: value }));

  if (loading || !draft) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        backHref="/encoding-profiles"
        crumbs={[{ label: "Encoding profiles", href: "/encoding-profiles" }, { label: "Edition" }]}
        title={draft.name}
        subtitle={`Updated ${timeAgo(draft.updatedAt)}`}
        actions={
          <Button
            icon="check"
            loading={save.pending}
            onClick={async () => {
              const saved = await save.run(draft);
              if (saved) toast.success("Profile saved");
            }}
          >
            Save
          </Button>
        }
      />

      {error ? <ErrorBox message={error} onRetry={refresh} /> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle title="Rendition" subtitle="What the encoder produces for every source file" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextInput label="Profile name" required value={draft.name} onChange={(e) => set("name", e.target.value)} />
            <Select
              label="Resolution"
              options={RESOLUTIONS}
              value={draft.resolution}
              onChange={(e) => set("resolution", e.target.value)}
            />
            <Select label="Codec" options={CODECS} value={draft.codec} onChange={(e) => set("codec", e.target.value)} />
            <Select
              label="Container"
              options={CONTAINERS}
              value={draft.container}
              onChange={(e) => set("container", e.target.value)}
            />
            <TextInput
              label="Video bitrate (kbps)"
              type="number"
              value={draft.videoBitrateKbps}
              onChange={(e) => set("videoBitrateKbps", Number(e.target.value))}
            />
            <TextInput
              label="Audio bitrate (kbps)"
              type="number"
              value={draft.audioBitrateKbps}
              onChange={(e) => set("audioBitrateKbps", Number(e.target.value))}
            />
          </div>
        </Card>

        <Card>
          <CardTitle title="Quota" subtitle="How much of the encoding plan this profile consumes" />
          <div className="space-y-5">
            <TextInput
              label="Cost multiplier"
              type="number"
              step="0.1"
              value={draft.costMultiplier}
              onChange={(e) => set("costMultiplier", Number(e.target.value))}
              hint="1 minute of source video costs this many quota minutes."
            />
            <div className="rounded-lg border border-line bg-surface-2 px-4 py-3.5">
              <Toggle
                checked={draft.isDefault}
                onChange={(v) => set("isDefault", v)}
                label="Use as default profile"
                description="Pre-selected when a new media is created."
              />
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-8 flex justify-end">
        <Button variant="danger" icon="trash" onClick={() => setConfirmDelete(true)}>
          Delete this profile
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        pending={remove.pending}
        title="Delete encoding profile"
        message={`"${draft.name}" will no longer be available when encoding a media.`}
        onConfirm={async () => {
          await remove.run();
          toast.success("Profile deleted");
          router.push("/encoding-profiles");
        }}
      />
    </>
  );
}
