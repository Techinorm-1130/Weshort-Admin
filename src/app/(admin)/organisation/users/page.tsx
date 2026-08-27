"use client";

import { useState } from "react";
import { orgApi } from "@/lib/api/resources";
import { useList, useMutation } from "@/lib/hooks";
import { formatDate, initialsOf } from "@/lib/format";
import type { OrgUser } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import Button, { IconButton } from "@/components/ui/Button";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { Pagination, SearchInput, Toolbar } from "@/components/ui/Toolbar";
import { Avatar, Badge, ErrorBox, StatusDot } from "@/components/ui/Primitives";
import { ConfirmDialog, Modal } from "@/components/ui/Overlays";
import { Select, TextInput } from "@/components/ui/Fields";
import { useToast } from "@/components/ui/Toast";

const ROLES = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Administrator" },
  { value: "editor", label: "Editor" },
  { value: "contributor", label: "Contributor" },
  { value: "viewer", label: "Viewer" },
];

const ROLE_TONES: Record<OrgUser["role"], "brand" | "info" | "ok" | "warn" | "neutral"> = {
  owner: "brand",
  admin: "info",
  editor: "ok",
  contributor: "warn",
  viewer: "neutral",
};

const EMPTY: Partial<OrgUser> = { name: "", email: "", role: "viewer" };

export default function OrganisationUsersPage() {
  const toast = useToast();
  const list = useList<OrgUser>((q) => orgApi.users(q));
  const [editing, setEditing] = useState<Partial<OrgUser> | null>(null);
  const [toDelete, setToDelete] = useState<OrgUser | null>(null);

  const save = useMutation((user: Partial<OrgUser>) =>
    user.id ? orgApi.updateUser(user.id, user) : orgApi.createUser(user),
  );
  const remove = useMutation((id: string) => orgApi.removeUser(id));

  const columns: Column<OrgUser>[] = [
    {
      key: "status",
      header: "Status",
      width: "90px",
      cell: (row) => <StatusDot status={row.status} />,
      filter: {
        value: list.query.status ?? "all",
        options: [
          { value: "online", label: "Active" },
          { value: "offline", label: "Inactive" },
        ],
        onChange: (v) => list.setQuery({ status: v as OrgUser["status"] }),
      },
    },
    {
      key: "name",
      header: "Name",
      sortKey: "name",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar initials={initialsOf(row.name)} color={row.avatarColor} size={34} />
          <div>
            <p className="font-semibold text-ink">{row.name}</p>
            <p className="text-xs text-muted">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      align: "center",
      cell: (row) => <Badge tone={ROLE_TONES[row.role]}>{ROLES.find((r) => r.value === row.role)?.label}</Badge>,
      filter: {
        value: list.query.type ?? "all",
        options: ROLES,
        onChange: (v) => list.setQuery({ type: v }),
      },
    },
    {
      key: "lastLogin",
      header: "Last sign-in",
      align: "right",
      sortKey: "lastLogin",
      cell: (row) => <span className="text-[13px]">{row.lastLogin ? formatDate(row.lastLogin, true) : "never"}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Users"
        count={list.total}
        crumbs={[{ label: "My organisation" }, { label: "Users" }]}
        subtitle="Who can sign in to the CMS and what they are allowed to do."
        actions={
          <Button icon="plus" onClick={() => setEditing({ ...EMPTY })}>
            Invite a user
          </Button>
        }
      />

      <Toolbar
        left={
          <SearchInput
            value={list.query.search ?? ""}
            onChange={(v) => list.setQuery({ search: v })}
            placeholder="Search users"
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
        onRowClick={(row) => setEditing(row)}
        emptyTitle="No user yet"
        emptyDescription="Invite your team so they can publish and encode with you."
        emptyIcon="users"
        rowActions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <IconButton icon="pencil" label="Edit" size="sm" onClick={() => setEditing(row)} />
            <IconButton
              icon="trash"
              label="Delete"
              size="sm"
              disabled={row.role === "owner"}
              onClick={() => setToDelete(row)}
            />
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

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit user" : "Invite a user"}
        description={editing?.id ? undefined : "They receive an email to set their password."}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              loading={save.pending}
              disabled={!editing?.name || !editing?.email}
              onClick={async () => {
                if (!editing) return;
                const saved = await save.run(editing);
                if (saved) {
                  toast.success(editing.id ? "User updated" : "Invitation sent");
                  setEditing(null);
                  list.refresh();
                }
              }}
            >
              {editing?.id ? "Save" : "Send invitation"}
            </Button>
          </>
        }
      >
        {editing ? (
          <div className="space-y-4">
            <TextInput
              label="Full name"
              required
              value={editing.name ?? ""}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
            <TextInput
              label="Email"
              type="email"
              required
              value={editing.email ?? ""}
              onChange={(e) => setEditing({ ...editing, email: e.target.value })}
            />
            <Select
              label="Role"
              options={ROLES}
              value={editing.role ?? "viewer"}
              onChange={(e) => setEditing({ ...editing, role: e.target.value as OrgUser["role"] })}
              hint="Owners can manage billing; editors can publish; contributors can only submit."
            />
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        pending={remove.pending}
        title="Remove user"
        message={`${toDelete?.name} will lose access to the CMS immediately.`}
        confirmLabel="Remove"
        onConfirm={async () => {
          if (!toDelete) return;
          await remove.run(toDelete.id);
          setToDelete(null);
          toast.success("User removed");
          list.refresh();
        }}
      />
    </>
  );
}
