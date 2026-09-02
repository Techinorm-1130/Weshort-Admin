"use client";

import type { ContentItem } from "@/types";
import type { ContentErrors } from "@/lib/content-validation";
import { AUDIO_LANGUAGES } from "@/lib/api/seed-ott";
import { Card, CardTitle } from "@/components/ui/Primitives";
import Icon from "@/components/ui/Icon";
import SubtitleUploader from "../SubtitleUploader";

export default function AudioSubtitlesStep({
  draft, patch, errors,
}: {
  draft: ContentItem;
  patch: (values: Partial<ContentItem>) => void;
  errors: ContentErrors;
}) {
  const toggleAudio = (value: string) =>
    patch({
      audioLanguages: draft.audioLanguages.includes(value)
        ? draft.audioLanguages.filter((v) => v !== value)
        : [...draft.audioLanguages, value],
    });

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle
          title="Audio languages"
          subtitle="Every dub delivered with this title"
          action={<span className="text-[13px] text-muted">{draft.audioLanguages.length} selected</span>}
        />
        <div className="flex flex-wrap gap-2.5">
          {AUDIO_LANGUAGES.map((lang) => {
            const active = draft.audioLanguages.includes(lang.value);
            return (
              <button
                key={lang.value}
                type="button"
                onClick={() => toggleAudio(lang.value)}
                className={`inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
                  active ? "bg-ink text-on-ink" : "bg-surface-2 text-muted-strong hover:bg-surface-3 hover:text-ink"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full ${
                    active ? "bg-on-ink/20" : "bg-surface-3"
                  }`}
                >
                  {active ? <Icon name="check" size={12} /> : null}
                </span>
                {lang.label}
              </button>
            );
          })}
        </div>
        {errors.audioLanguages ? <p className="mt-3 text-xs text-danger">{errors.audioLanguages}</p> : null}
      </Card>

      <Card>
        <CardTitle
          title="Subtitles"
          subtitle="Upload one file per language"
          action={<span className="text-[13px] text-muted">{draft.subtitles.length} track(s)</span>}
        />
        <SubtitleUploader value={draft.subtitles} onChange={(subtitles) => patch({ subtitles })} />
      </Card>
    </div>
  );
}
