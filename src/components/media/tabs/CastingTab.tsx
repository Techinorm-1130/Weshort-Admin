"use client";

import { useState } from "react";
import { castingApi } from "@/lib/api/resources";
import { useQuery } from "@/lib/hooks";
import { initialsOf, labelOf } from "@/lib/format";
import type { Media, Taxonomies } from "@/types";
import { Avatar, Card, CardTitle, EmptyState } from "@/components/ui/Primitives";
import Button, { IconButton } from "@/components/ui/Button";
import { Select, TextInput } from "@/components/ui/Fields";
import { Modal } from "@/components/ui/Overlays";
import { useToast } from "@/components/ui/Toast";

export default function CastingTab({
  media, onChange, taxonomies,
}: {
  media: Media;
  onChange: (patch: Partial<Media>) => void;
  taxonomies: Taxonomies;
}) {
  const toast = useToast();
  const { data: people } = useQuery(() => castingApi.list({ perPage: 100 }), []);
  const [adding, setAdding] = useState(false);
  const [personId, setPersonId] = useState("");
  const [role, setRole] = useState("actor");
  const [character, setCharacter] = useState("");

  const directory = people?.items ?? [];
  const nameOf = (id: string) => directory.find((p) => p.id === id)?.name ?? id;

  const add = () => {
    if (!personId) return;
    onChange({ casting: [...media.casting, { personId, role, character: character || undefined }] });
    setAdding(false);
    setPersonId("");
    setCharacter("");
    toast.success("Cast member added");
  };

  return (
    <>
      <Card padded={false}>
        <div className="px-5 pt-5">
          <CardTitle
            title="Casting"
            subtitle="People credited on this media"
            action={
              <Button icon="plus" size="sm" onClick={() => setAdding(true)}>
                Add a person
              </Button>
            }
          />
        </div>

        {media.casting.length === 0 ? (
          <EmptyState
            icon="user-circle"
            title="No one credited yet"
            description="Add directors, actors and crew so they appear on the content page."
            action={
              <Button icon="plus" onClick={() => setAdding(true)}>
                Add a person
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {media.casting.map((credit, i) => (
              <li key={`${credit.personId}-${i}`} className="flex items-center gap-4 px-5 py-3.5">
                <Avatar initials={initialsOf(nameOf(credit.personId))} size={38} color="#4c8dff" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{nameOf(credit.personId)}</p>
                  <p className="text-[13px] text-muted">
                    {labelOf(taxonomies.roles, credit.role)}
                    {credit.character ? ` — ${credit.character}` : ""}
                  </p>
                </div>
                <div className="w-44">
                  <Select
                    options={taxonomies.roles}
                    value={credit.role}
                    onChange={(e) =>
                      onChange({
                        casting: media.casting.map((c, idx) =>
                          idx === i ? { ...c, role: e.target.value } : c,
                        ),
                      })
                    }
                  />
                </div>
                <IconButton
                  icon="trash"
                  label="Remove"
                  size="sm"
                  onClick={() => onChange({ casting: media.casting.filter((_, idx) => idx !== i) })}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add a person"
        description="Pick someone from the casting directory."
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button onClick={add} disabled={!personId}>
              Add
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Person"
            options={directory.map((p) => ({ value: p.id, label: p.name }))}
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
          />
          <Select label="Role" options={taxonomies.roles} value={role} onChange={(e) => setRole(e.target.value)} />
          <TextInput
            label="Character"
            placeholder="Optional"
            value={character}
            onChange={(e) => setCharacter(e.target.value)}
          />
        </div>
      </Modal>
    </>
  );
}
