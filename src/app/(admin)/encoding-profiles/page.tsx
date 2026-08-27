"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { encodingApi } from "@/lib/api/resources";
import { useList, useMutation } from "@/lib/hooks";
import { formatDate } from "@/lib/format";
import type { EncodingProfile } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import Button, { IconButton } from "@/components/ui/Button";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { Pagination, SearchInput, Toolbar } from "@/components/ui/Toolbar";
import { Badge, ErrorBox } from "@/components/ui/Primitives";
import { ConfirmDialog } from "@/components/ui/Overlays";
import { useToast } from "@/components/ui/Toast";

export default function EncodingProfilesPage() {
  const router = useRouter();
  const toast = useToast();
  const list = useList<EncodingProfile>((q) => encodingApi.profiles(q));
  const [toDelete, setToDelete] = useState<EncodingProfile | null>(null);

  const create = useMutation(() => encodingApi.createProfile({}));
  const remove = useMutation((id: string) => encodingApi.removeProfile(id));

  const onCreate = async () => {
    const profile = await create.run();
    if (profile) {
      toast.success("Profile created");
      router.push(`/encoding-profiles/${profile.id}`);
    }
  };

  const columns: Column<EncodingProfile>[] = [
    {
      key: "name",
      header: "Profile",
      sortKey: "name",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink">{row.name}</span>
          {row.isDefault ? <Badge tone="brand">Default</Badge> : null}
        </div>
      ),
    },
    { key: "resolution", header: "Resolution", align: "center", cell: (row) => row.resolution },
    { key: "codec", header: "Codec", align: "center", cell: (row) => row.codec },
    { key: "container", header: "Container", align: "center", cell: (row) => row.container },
    {
      key: "video",
      header: "Video bitrate",
      align: "center",
      sortKey: "videoBitrateKbps",
      cell: (row) => (row.videoBitrateKbps ? `${row.videoBitrateKbps} kbps` : "-"),
    },
    {
      key: "audio",
      header: "Audio bitrate",
      align: "center",
      cell: (row) => `${row.audioBitrateKbps} kbps`,
    },
    {
      key: "cost",
      header: "Cost",
      align: "center",
      sortKey: "costMultiplier",
      cell: (row) => <Badge tone={row.costMultiplier > 1 ? "warn" : "neutral"}>x{row.costMultiplier}</Badge>,
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
        title="Encoding profiles"
        count={list.total}
        crumbs={[{ label: "Catalogue" }, { label: "Encoding profiles" }]}
        subtitle="Ladders applied when a media is encoded. The cost multiplier drives your quota consumption."
        actions={
          <Button icon="plus" loading={create.pending} onClick={onCreate}>
            Create a profile
          </Button>
        }
      />

      <Toolbar
        left={
          <SearchInput
            value={list.query.search ?? ""}
            onChange={(v) => list.setQuery({ search: v })}
            placeholder="Search profiles"
            className="w-full sm:w-72"
          />
        }
      />

      {list.error ? <ErrorBox message={list.error} onRetry={list.refresh} /> : null}

      <DataTable
        columns={columns}
        rows={list.items}
        loading={list.loading}
        sort={list.query.sort}
        onSortChange={(sort) => list.setQuery({ sort })}
        onRowClick={(row) => router.push(`/encoding-profiles/${row.id}`)}
        emptyTitle="No encoding profile"
        emptyDescription="Create a profile to describe the resolution, codec and bitrate of your renditions."
        emptyIcon="sliders"
        emptyAction={
          <Button icon="plus" onClick={onCreate}>
            Create a profile
          </Button>
        }
        rowActions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <IconButton
              icon="pencil"
              label="Edit"
              size="sm"
              onClick={() => router.push(`/encoding-profiles/${row.id}`)}
            />
            <IconButton icon="trash" label="Delete" size="sm" onClick={() => setToDelete(row)} />
          </div>
        )}
      />

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
        title="Delete encoding profile"
        message={`"${toDelete?.name}" will no longer be available when encoding a media.`}
        onConfirm={async () => {
          if (!toDelete) return;
          await remove.run(toDelete.id);
          setToDelete(null);
          toast.success("Profile deleted");
          list.refresh();
        }}
      />
    </>
  );
}
