"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { castingApi, taxonomyApi } from "@/lib/api/resources";
import { useMutation, useQuery } from "@/lib/hooks";
import { timeAgo } from "@/lib/format";
import type { Person } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { Card, CardTitle, ErrorBox, Skeleton } from "@/components/ui/Primitives";
import { DateInput, Select, TextInput } from "@/components/ui/Fields";
import RichText from "@/components/ui/RichText";
import { ImageDrop } from "@/components/ui/Uploader";
import { ConfirmDialog } from "@/components/ui/Overlays";
import { useToast } from "@/components/ui/Toast";

export default function PersonEditor({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const { data: draft, loading, error, refresh, setData } = useQuery(() => castingApi.get(id), [id]);
  const { data: taxonomies } = useQuery(() => taxonomyApi.all(), []);
  const [confirmDelete, setConfirmDelete] = useState(false);


  const save = useMutation((payload: Partial<Person>) => castingApi.update(id, payload));
  const remove = useMutation(() => castingApi.remove(id));

  /** Edits are written straight into the query cache — no mirrored state. */
  const set = <K extends keyof Person>(key: K, value: Person[K]) =>
    setData((prev) => ({ ...(prev as Person), [key]: value }));

  if (loading || !draft || !taxonomies) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        backHref="/casting"
        crumbs={[{ label: "Casting", href: "/casting" }, { label: "Edition" }]}
        title={draft.name}
        subtitle={`${draft.credits} credits · updated ${timeAgo(draft.updatedAt)}`}
        actions={
          <Button
            icon="check"
            loading={save.pending}
            onClick={async () => {
              const saved = await save.run(draft);
              if (saved) toast.success("Person saved");
            }}
          >
            Save
          </Button>
        }
      />

      {error ? <ErrorBox message={error} onRetry={refresh} /> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardTitle title="Photo" />
          <ImageDrop
            ratio="1:1"
            label="Portrait"
            value={draft.photo ?? undefined}
            onChange={(v) => set("photo", v ?? null)}
          />
        </Card>

        <Card className="lg:col-span-2">
          <CardTitle title="Identity" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextInput label="Full name" required value={draft.name} onChange={(e) => set("name", e.target.value)} />
            <Select
              label="Main role"
              options={taxonomies.roles}
              value={draft.role}
              onChange={(e) => set("role", e.target.value)}
            />
            <Select
              label="Country"
              options={taxonomies.countries}
              value={draft.country}
              onChange={(e) => set("country", e.target.value)}
            />
            <DateInput label="Date of birth" value={draft.birthDate} onChange={(v) => set("birthDate", v)} />
          </div>

          <div className="mt-4">
            <RichText
              label="Biography"
              rows={7}
              value={draft.biography}
              onChange={(v) => set("biography", v)}
            />
          </div>
        </Card>
      </div>

      <div className="mt-8 flex justify-end">
        <Button variant="danger" icon="trash" onClick={() => setConfirmDelete(true)}>
          Delete this person
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        pending={remove.pending}
        title="Delete person"
        message={`"${draft.name}" will be removed from the casting directory.`}
        onConfirm={async () => {
          await remove.run();
          toast.success("Person deleted");
          router.push("/casting");
        }}
      />
    </>
  );
}
