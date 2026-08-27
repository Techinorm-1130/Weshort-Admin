"use client";

import type { Media, Rights, Taxonomies } from "@/types";
import { daysUntil, formatDate } from "@/lib/format";
import { Badge, Card, CardTitle } from "@/components/ui/Primitives";
import { DateInput, MultiSelect, TextArea, TextInput } from "@/components/ui/Fields";
import Icon from "@/components/ui/Icon";

export default function RightsTab({
  media, onChange, taxonomies,
}: {
  media: Media;
  onChange: (patch: Partial<Media>) => void;
  taxonomies: Taxonomies;
}) {
  const rights = media.rights;
  const set = <K extends keyof Rights>(key: K, value: Rights[K]) =>
    onChange({ rights: { ...rights, [key]: value } });

  const end = rights.endAt || null;
  const daysLeft = daysUntil(rights.endAt);
  const expiring = daysLeft !== null && daysLeft <= 30;

  return (
    <div className="space-y-4">
      {end ? (
        <div
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
            daysLeft !== null && daysLeft < 0
              ? "border-danger/30 bg-danger/10 text-danger"
              : expiring
                ? "border-warn/30 bg-warn/10 text-warn"
                : "border-ok/25 bg-ok/[0.08] text-ok"
          }`}
        >
          <Icon name="shield" size={17} />
          {daysLeft !== null && daysLeft < 0
            ? `Rights expired on ${formatDate(rights.endAt)}`
            : `Rights valid until ${formatDate(rights.endAt)} (${daysLeft} days left)`}
        </div>
      ) : null}

      <Card>
        <CardTitle title="Distribution rights" subtitle="Who owns the content and where it can be shown" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput
            label="Rights holder"
            value={rights.ownership}
            onChange={(e) => set("ownership", e.target.value)}
            placeholder="WeShort Srl"
          />
          <TextInput
            label="Contract reference"
            value={rights.contractRef}
            onChange={(e) => set("contractRef", e.target.value)}
          />
          <DateInput label="Rights start" value={rights.startAt} onChange={(v) => set("startAt", v)} />
          <DateInput label="Rights end" value={rights.endAt} onChange={(v) => set("endAt", v)} />
          <MultiSelect
            label="Territories"
            options={taxonomies.countries}
            value={rights.territories}
            onChange={(v) => set("territories", v)}
          />
          <MultiSelect
            label="Monetisation models"
            options={taxonomies.monetisation}
            value={rights.monetisation}
            onChange={(v) => set("monetisation", v as Rights["monetisation"])}
          />
        </div>

        <div className="mt-4">
          <TextArea
            label="Notes"
            rows={4}
            value={rights.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Contractual specifics, holdbacks, exclusivity..."
          />
        </div>
      </Card>

      <Card>
        <CardTitle title="Summary" />
        <div className="flex flex-wrap gap-2">
          {rights.monetisation.length ? (
            rights.monetisation.map((m) => (
              <Badge key={m} tone="brand" icon="billing">
                {m.toUpperCase()}
              </Badge>
            ))
          ) : (
            <Badge>No monetisation model selected</Badge>
          )}
          {rights.territories.map((t) => (
            <Badge key={t} icon="globe">
              {taxonomies.countries.find((c) => c.value === t)?.label ?? t}
            </Badge>
          ))}
        </div>
      </Card>
    </div>
  );
}
