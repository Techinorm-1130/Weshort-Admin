"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { castingApi, taxonomyApi } from "@/lib/api/resources";
import { useList, useMutation, useQuery } from "@/lib/hooks";
import { formatDate, initialsOf, labelOf } from "@/lib/format";
import type { Person } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import Button, { Chip } from "@/components/ui/Button";
import { Pagination, SearchInput } from "@/components/ui/Toolbar";
import { Avatar, EmptyState, ErrorBox, Skeleton } from "@/components/ui/Primitives";
import {
  CardDivider, CardFooter, CardHead, CardHeading, DotRating, EntityCard, IconTile,
  MicroLabel, OpenAction, RoundAction, SelectPill, TagChip,
} from "@/components/ui/EntityCard";
import { ConfirmDialog } from "@/components/ui/Overlays";
import Icon from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";

const ROLE_FILTERS = [
  { value: "all", label: "All" },
  { value: "director", label: "Directors" },
  { value: "actor", label: "Actors" },
  { value: "producer", label: "Producers" },
  { value: "writer", label: "Writers" },
];

export default function CastingPage() {
  const router = useRouter();
  const toast = useToast();
  const list = useList<Person>((q) => castingApi.list(q), { perPage: 12 });
  const { data: taxonomies } = useQuery(() => taxonomyApi.all(), []);
  const [toDelete, setToDelete] = useState<Person | null>(null);

  const create = useMutation(() => castingApi.create({}));
  const remove = useMutation((id: string) => castingApi.remove(id));

  const onCreate = async () => {
    const person = await create.run();
    if (person) {
      toast.success("Person created");
      router.push(`/casting/${person.id}`);
    }
  };

  return (
    <>
      <PageHeader
        title="Casting"
        crumbs={[{ label: "Catalogue", icon: "film" }, { label: "Casting" }]}
        subtitle="Directors, actors and crew credited across the catalogue."
        actions={
          <Button icon="plus" loading={create.pending} onClick={onCreate}>
            Add a person
          </Button>
        }
      />

      {/* section head + filter chips, laid out like the reference */}
      <div className="mb-5 flex flex-wrap items-center gap-4">
        <h2 className="font-display text-xl font-bold tracking-tight text-ink">Directory</h2>
        <span className="text-[13px] text-muted underline underline-offset-4">{list.total} people</span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <SearchInput
            value={list.query.search ?? ""}
            onChange={(v) => list.setQuery({ search: v })}
            placeholder="Search people"
            className="w-full sm:w-64"
          />
          {ROLE_FILTERS.map((filter) => (
            <Chip
              key={filter.value}
              active={(list.query.type ?? "all") === filter.value}
              onClick={() => list.setQuery({ type: filter.value })}
            >
              {filter.label}
            </Chip>
          ))}
        </div>
      </div>

      {list.error ? <ErrorBox message={list.error} onRetry={list.refresh} /> : null}

      {list.loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-[26px]" />
          ))}
        </div>
      ) : list.items.length === 0 ? (
        <div className="card-premium">
          <EmptyState
            icon="user-circle"
            title="No one in the directory yet"
            description="Add the people who work on your contents so they can be credited."
            action={
              <Button icon="plus" onClick={onCreate}>
                Add a person
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.items.map((person) => {
            const role = labelOf(taxonomies?.roles ?? [], person.role);
            const strength = Math.max(1, Math.min(5, Math.ceil(person.credits / 2)));
            const country = taxonomies?.countries.find((c) => c.value === person.country)?.label ?? person.country;

            return (
              <EntityCard
                key={person.id}
                onClick={() => router.push(`/casting/${person.id}`)}
                highlight={person.credits >= 9 ? "brand" : "none"}
                head={
                  <CardHead
                    avatar={
                      person.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={person.photo} alt="" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <Avatar initials={initialsOf(person.name)} size={40} color="#2f6bff" ring={false} />
                      )
                    }
                    title={role}
                    subtitle={`${country} · ${person.credits} credits`}
                  />
                }
                actions={<OpenAction onClick={() => router.push(`/casting/${person.id}`)} />}
              >
                <CardHeading
                  tile={<IconTile icon="user-circle" color={person.credits >= 9 ? "#0c0c0e" : "#2f6bff"} />}
                  title={person.name}
                  meta={
                    <>
                      <Icon name="clock" size={12} />
                      updated {formatDate(person.updatedAt)}
                    </>
                  }
                />

                <CardDivider />

                <MicroLabel
                  note={
                    person.credits >= 9 ? (
                      <span className="flex items-center gap-1">
                        <Icon name="bolt" size={11} /> Most credited
                      </span>
                    ) : (
                      <span className="text-muted">{person.credits} credits</span>
                    )
                  }
                >
                  Source
                </MicroLabel>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <TagChip>{role}</TagChip>
                    <TagChip icon="globe">{person.country.toUpperCase()}</TagChip>
                  </div>
                  <DotRating value={strength} color={person.credits >= 9 ? "#e50914" : "#2f6bff"} />
                </div>

                <p className="mb-2 mt-5 text-[12px] font-medium text-muted">Status</p>
                <CardFooter>
                  <SelectPill
                    leading={<Avatar initials={initialsOf(person.name)} size={30} color="#2f6bff" ring={false} />}
                    onClick={() => router.push(`/casting/${person.id}`)}
                  >
                    In directory
                  </SelectPill>
                  <RoundAction icon="trash" label="Delete" onClick={() => setToDelete(person)} />
                  <RoundAction
                    icon="pencil"
                    label="Edit"
                    solid
                    onClick={() => router.push(`/casting/${person.id}`)}
                  />
                </CardFooter>
              </EntityCard>
            );
          })}
        </div>
      )}

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
        title="Delete person"
        message={`"${toDelete?.name}" will be removed from the casting directory.`}
        onConfirm={async () => {
          if (!toDelete) return;
          await remove.run(toDelete.id);
          setToDelete(null);
          toast.success("Person deleted");
          list.refresh();
        }}
      />
    </>
  );
}
