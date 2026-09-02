"use client";

import type { ContentItem, ContentType, Taxonomies } from "@/types";
import { formatDuration, parseDuration } from "@/lib/format";
import type { ContentErrors } from "@/lib/content-validation";
import { AGE_RATINGS, CONTENT_CATEGORIES } from "@/lib/api/seed-ott";
import { Card, CardTitle } from "@/components/ui/Primitives";
import { DateInput, MultiSelect, Select, TextArea, TextInput } from "@/components/ui/Fields";
import Icon, { type IconName } from "@/components/ui/Icon";

const TYPES: { value: ContentType; label: string; hint: string; icon: IconName }[] = [
  { value: "movie", label: "Movie", hint: "A single title with one video", icon: "film" },
  { value: "series", label: "Series", hint: "Seasons and episodes", icon: "layers" },
  { value: "episode", label: "Episode", hint: "A single episode of an existing series", icon: "tv" },
];

export default function BasicInfoStep({
  draft, patch, errors, taxonomies,
}: {
  draft: ContentItem;
  patch: (values: Partial<ContentItem>) => void;
  errors: ContentErrors;
  taxonomies: Taxonomies | null;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardTitle title="Content type" subtitle="This drives the rest of the form" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {TYPES.map((type) => {
            const active = draft.type === type.value;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => patch({ type: type.value })}
                className={`flex items-center gap-3 rounded-lg p-4 text-left transition ${
                  active ? "bg-ink text-on-ink" : "bg-surface-2 text-muted-strong hover:bg-surface-3"
                }`}
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${
                    active ? "bg-on-ink/15" : "bg-surface-3 text-ink"
                  }`}
                >
                  <Icon name={type.icon} size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold">{type.label}</span>
                  <span className={`block text-xs ${active ? "opacity-70" : "text-muted"}`}>{type.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
        {errors.type ? <p className="mt-2 text-xs text-danger">{errors.type}</p> : null}
      </Card>

      <Card>
        <CardTitle title="Title and description" subtitle="What viewers read on the content page" />
        <div className="space-y-4">
          <TextInput
            label="Title"
            required
            placeholder="Il silenzio del sudore"
            value={draft.title}
            error={errors.title}
            onChange={(e) => patch({ title: e.target.value })}
          />
          <TextInput
            label="Short description"
            placeholder="One line shown in carousels and search results"
            value={draft.shortDescription}
            onChange={(e) => patch({ shortDescription: e.target.value })}
            hint={`${draft.shortDescription.length}/140 characters`}
            maxLength={140}
          />
          <TextArea
            label="Full description"
            required
            rows={5}
            placeholder="The synopsis shown on the content page"
            value={draft.description}
            error={errors.description}
            onChange={(e) => patch({ description: e.target.value })}
          />
        </div>
      </Card>

      <Card>
        <CardTitle title="Classification" subtitle="How the title is filed and recommended" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <DateInput
            label="Release date"
            value={draft.releaseDate}
            onChange={(v) => patch({ releaseDate: v })}
          />
          <TextInput
            label="Duration"
            placeholder="00:24:00"
            defaultValue={formatDuration(draft.durationSec)}
            onBlur={(e) => patch({ durationSec: parseDuration(e.target.value) })}
            hint={draft.type === "series" ? "Average episode length" : undefined}
          />
          <Select
            label="Original language"
            required
            options={taxonomies?.languages ?? []}
            value={draft.language}
            error={errors.language}
            onChange={(e) => patch({ language: e.target.value })}
          />
          <MultiSelect
            label="Genre"
            options={taxonomies?.genres ?? []}
            value={draft.genres}
            error={errors.genres}
            onChange={(v) => patch({ genres: v })}
          />
          <Select
            label="Category"
            options={CONTENT_CATEGORIES}
            value={draft.category}
            onChange={(e) => patch({ category: e.target.value })}
          />
          <Select
            label="Country"
            options={taxonomies?.countries ?? []}
            value={draft.country}
            onChange={(e) => patch({ country: e.target.value })}
          />
          <Select
            label="Age rating"
            required
            options={AGE_RATINGS}
            value={draft.ageRating}
            error={errors.ageRating}
            onChange={(e) => patch({ ageRating: e.target.value })}
          />
        </div>

        {errors.releaseDate ? <p className="mt-2 text-xs text-danger">{errors.releaseDate}</p> : null}
      </Card>
    </div>
  );
}
