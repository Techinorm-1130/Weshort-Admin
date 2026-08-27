"use client";

import type { Media, MediaMetadata, Taxonomies } from "@/types";
import { Card, CardTitle } from "@/components/ui/Primitives";
import {
  DateInput, DurationInput, KeyValueList, MultiSelect, Select, TextArea, TextInput,
} from "@/components/ui/Fields";

export default function MetadataTab({
  media, onChange, taxonomies,
}: {
  media: Media;
  onChange: (patch: Partial<Media>) => void;
  taxonomies: Taxonomies;
}) {
  const meta = media.metadata;
  const set = <K extends keyof MediaMetadata>(key: K, value: MediaMetadata[K]) =>
    onChange({ metadata: { ...meta, [key]: value } });

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle title="Identification" subtitle="Duration and industry identifiers" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DurationInput label="Duration" value={meta.durationSec} onChange={(v) => set("durationSec", v)} />
          <Select
            label="Duration type"
            options={taxonomies.durationTypes}
            value={meta.durationType}
            onChange={(e) => set("durationType", e.target.value)}
          />
          <span className="hidden lg:block" />

          <TextInput
            label="ISAN"
            placeholder="ISAN 0000-0000-D07A-0090-Q-0000-0000-X"
            value={meta.isan}
            onChange={(e) => set("isan", e.target.value)}
          />
          <TextInput
            label="EIDR"
            placeholder="10.5240/XXXX-XXXX-XXXX-XXXX-XXXX-C"
            value={meta.eidr}
            onChange={(e) => set("eidr", e.target.value)}
          />
          <TextInput label="Custom ID" value={meta.customId} onChange={(e) => set("customId", e.target.value)} />

          <Select
            label="Production year"
            options={Array.from({ length: 40 }, (_, i) => {
              const year = String(2026 - i);
              return { value: year, label: year };
            })}
            value={meta.productionYear}
            onChange={(e) => set("productionYear", e.target.value)}
          />
          <DateInput label="Release date" value={meta.releaseDate} onChange={(v) => set("releaseDate", v)} />
          <TextInput
            label="Trailer"
            placeholder="Media ID of the trailer"
            value={meta.trailerId}
            onChange={(e) => set("trailerId", e.target.value)}
          />
        </div>
      </Card>

      <Card>
        <CardTitle title="Classification" subtitle="How the media is grouped and recommended" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            label="Category"
            options={taxonomies.categories}
            value={meta.category}
            onChange={(e) => set("category", e.target.value)}
          />
          <Select
            label="Classification"
            options={taxonomies.classifications}
            value={meta.classification}
            onChange={(e) => set("classification", e.target.value)}
          />
          <MultiSelect
            label="Genre"
            options={taxonomies.genres}
            value={meta.genre}
            onChange={(v) => set("genre", v)}
          />

          <Select
            label="Format"
            options={taxonomies.formats}
            value={meta.format}
            onChange={(e) => set("format", e.target.value)}
          />
          <MultiSelect label="Theme" options={taxonomies.themes} value={meta.theme} onChange={(v) => set("theme", v)} />
          <Select
            label="Target audience"
            options={taxonomies.audiences}
            value={meta.audience}
            onChange={(e) => set("audience", e.target.value)}
          />

          <MultiSelect
            label="Accessibility"
            options={taxonomies.accessibility}
            value={meta.accessibility}
            onChange={(v) => set("accessibility", v)}
          />
          <MultiSelect
            label="Keywords"
            options={taxonomies.keywords}
            value={meta.keywords}
            onChange={(v) => set("keywords", v)}
          />
        </div>
      </Card>

      <Card>
        <CardTitle title="Custom data" subtitle="Free variables forwarded to your players and exports" />
        <div className="space-y-4">
          <KeyValueList label="Variables" items={meta.variables} onChange={(v) => set("variables", v)} />
          <TextArea
            label="Internal comment"
            rows={4}
            value={meta.internalComment}
            onChange={(e) => set("internalComment", e.target.value)}
            placeholder="Only visible to your team"
          />
        </div>
      </Card>
    </div>
  );
}
