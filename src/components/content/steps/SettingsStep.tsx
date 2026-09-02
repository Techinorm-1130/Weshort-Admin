"use client";

import type { ContentAccess, ContentItem } from "@/types";
import type { ContentErrors } from "@/lib/content-validation";
import { Card, CardTitle } from "@/components/ui/Primitives";
import { DateInput, Toggle } from "@/components/ui/Fields";
import Icon, { type IconName } from "@/components/ui/Icon";

const ACCESS: { value: ContentAccess; label: string; hint: string; icon: IconName }[] = [
  { value: "free", label: "Free", hint: "Anyone can watch, ads may apply", icon: "globe" },
  { value: "premium", label: "Premium", hint: "Subscribers only", icon: "billing" },
];

export default function SettingsStep({
  draft, patch, errors,
}: {
  draft: ContentItem;
  patch: (values: Partial<ContentItem>) => void;
  errors: ContentErrors;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardTitle title="Access" subtitle="Who can watch this title" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ACCESS.map((option) => {
            const active = draft.access === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => patch({ access: option.value })}
                className={`flex items-center gap-3 rounded-lg p-4 text-left transition ${
                  active ? "bg-ink text-on-ink" : "bg-surface-2 text-muted-strong hover:bg-surface-3"
                }`}
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${
                    active ? "bg-on-ink/15" : "bg-surface-3 text-ink"
                  }`}
                >
                  <Icon name={option.icon} size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold">{option.label}</span>
                  <span className={`block text-xs ${active ? "opacity-70" : "text-muted"}`}>{option.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardTitle title="Publication window" subtitle="Leave the expiry empty to keep it online indefinitely" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DateInput label="Publish date" value={draft.publishAt} onChange={(v) => patch({ publishAt: v })} />
          <DateInput label="Expiry date" value={draft.expiryAt} onChange={(v) => patch({ expiryAt: v })} />
        </div>
        {errors.publishAt ? <p className="mt-2 text-xs text-danger">{errors.publishAt}</p> : null}

        <p className="mt-4 flex items-start gap-2 rounded-2xl bg-surface-2 px-4 py-3 text-[13px] text-muted">
          <Icon name="clock" size={15} className="mt-0.5 shrink-0" />
          A publish date in the future puts the title in <strong className="text-ink">Scheduled</strong> instead of
          going live straight away.
        </p>
      </Card>

      <Card>
        <CardTitle title="Options" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-surface-2 px-4 py-3.5">
            <Toggle
              checked={draft.featured}
              onChange={(v) => patch({ featured: v })}
              label="Featured content"
              description="Pins the title in the home hero carousel."
            />
          </div>
          <div className="rounded-lg bg-surface-2 px-4 py-3.5">
            <Toggle
              checked={draft.allowDownload}
              onChange={(v) => patch({ allowDownload: v })}
              label="Allow download"
              description="Viewers can keep it offline on their device."
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
