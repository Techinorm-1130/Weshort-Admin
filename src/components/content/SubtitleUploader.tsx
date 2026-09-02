"use client";

import { useRef, useState } from "react";
import { formatBytes, labelOf } from "@/lib/format";
import type { SubtitleTrack } from "@/types";
import { AUDIO_LANGUAGES } from "@/lib/api/seed-ott";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import { Select } from "@/components/ui/Fields";
import { useToast } from "@/components/ui/Toast";

/** Subtitle track list: pick a language, attach a .vtt/.srt, remove. */
export default function SubtitleUploader({
  value, onChange,
}: {
  value: SubtitleTrack[];
  onChange: (next: SubtitleTrack[]) => void;
}) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [language, setLanguage] = useState("en");

  const add = (file: File) => {
    if (value.some((t) => t.language === language)) {
      toast.error(`${labelOf(AUDIO_LANGUAGES, language)} subtitles are already attached`);
      return;
    }
    onChange([
      ...value,
      {
        id: `${language}-${file.name}`,
        language,
        label: labelOf(AUDIO_LANGUAGES, language),
        fileName: file.name,
        sizeBytes: file.size,
      },
    ]);
    toast.success(`${labelOf(AUDIO_LANGUAGES, language)} subtitles added`);
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".vtt,.srt"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) add(file);
          e.target.value = "";
        }}
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-56">
          <Select
            label="Subtitle language"
            options={AUDIO_LANGUAGES}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          />
        </div>
        <Button variant="secondary" icon="upload" onClick={() => inputRef.current?.click()}>
          Upload subtitle file
        </Button>
        <span className="text-xs text-muted">.vtt or .srt</span>
      </div>

      {value.length ? (
        <ul className="mt-4 space-y-2.5">
          {value.map((track) => (
            <li key={track.id} className="flex items-center gap-3 rounded-lg bg-surface-2 px-4 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-3 text-ink">
                <Icon name="file" size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{track.label}</p>
                <p className="truncate text-xs text-muted">
                  {track.fileName} · {formatBytes(track.sizeBytes)}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Remove ${track.label} subtitles`}
                onClick={() => onChange(value.filter((t) => t.id !== track.id))}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-3 text-muted transition hover:bg-danger/15 hover:text-danger"
              >
                <Icon name="trash" size={15} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-lg bg-surface-2 px-4 py-3 text-[13px] text-muted">
          No subtitle track yet. Viewers will only see the audio languages you selected.
        </p>
      )}
    </div>
  );
}
