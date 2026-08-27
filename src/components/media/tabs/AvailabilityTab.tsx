"use client";

import { projectApi, taxonomyApi } from "@/lib/api/resources";
import { useQuery } from "@/lib/hooks";
import type { Availability, Media } from "@/types";
import { Card, CardTitle } from "@/components/ui/Primitives";
import { Checkbox, DateInput, MultiSelect, Toggle } from "@/components/ui/Fields";
import Icon from "@/components/ui/Icon";

const OFFERS = [
  { value: "free", label: "Free" },
  { value: "premium", label: "Premium" },
  { value: "rental", label: "Rental" },
  { value: "annual", label: "Annual pass" },
];

export default function AvailabilityTab({
  media, onChange,
}: {
  media: Media;
  onChange: (patch: Partial<Media>) => void;
}) {
  const { data: projects } = useQuery(() => projectApi.list({ perPage: 50 }), []);
  const { data: taxonomies } = useQuery(() => taxonomyApi.all(), []);

  const availability = media.availability;
  const set = <K extends keyof Availability>(key: K, value: Availability[K]) =>
    onChange({ availability: { ...availability, [key]: value } });

  const projectOptions = (projects?.items ?? []).map((p) => ({ value: p.id, label: p.name }));

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle title="Where is it published?" subtitle="Projects and offers that expose this media" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MultiSelect
            label="Projects"
            options={projectOptions}
            value={availability.projects}
            onChange={(v) => set("projects", v)}
          />
          <MultiSelect
            label="Offers"
            options={OFFERS}
            value={availability.offers}
            onChange={(v) => set("offers", v)}
          />
        </div>
      </Card>

      <Card>
        <CardTitle title="Publication window" subtitle="Leave the end date empty to keep it online indefinitely" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DateInput
            label="Publish at"
            type="datetime-local"
            value={availability.publishAt}
            onChange={(v) => set("publishAt", v)}
          />
          <DateInput
            label="Unpublish at"
            type="datetime-local"
            value={availability.unpublishAt}
            onChange={(v) => set("unpublishAt", v)}
          />
        </div>
      </Card>

      <Card>
        <CardTitle title="Restrictions and options" />
        <div className="space-y-5">
          <MultiSelect
            label="Geo-blocking (countries where the media is hidden)"
            options={taxonomies?.countries ?? []}
            value={availability.geoBlocking}
            onChange={(v) => set("geoBlocking", v)}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-line bg-surface-2 px-4 py-3.5">
              <Toggle
                checked={availability.downloadable}
                onChange={(v) => set("downloadable", v)}
                label="Allow offline download"
                description="Viewers can keep the media on their device."
              />
            </div>
            <div className="rounded-lg border border-line bg-surface-2 px-4 py-3.5">
              <Toggle
                checked={availability.featured}
                onChange={(v) => set("featured", v)}
                label="Feature on the home page"
                description="Pins the media in the hero carousel."
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-5 border-t border-line pt-4">
            <Checkbox
              checked={media.enabled}
              onChange={(v) => onChange({ enabled: v })}
              label="Media is enabled"
            />
            <Checkbox
              checked={media.status === "online"}
              onChange={(v) => onChange({ status: v ? "online" : "draft" })}
              label="Published in the catalogue"
            />
          </div>

          <p className="flex items-start gap-2 rounded-lg border border-info/25 bg-info/[0.07] px-3.5 py-3 text-[13px] text-info">
            <Icon name="help" size={15} className="mt-0.5 shrink-0" />
            A media goes live only when it is enabled, published, inside its publication window and attached to at
            least one project.
          </p>
        </div>
      </Card>
    </div>
  );
}
