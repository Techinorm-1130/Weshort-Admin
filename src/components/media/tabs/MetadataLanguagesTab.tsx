"use client";

import type { Media, Taxonomies } from "@/types";
import { labelOf } from "@/lib/format";
import { Badge, Card, CardTitle } from "@/components/ui/Primitives";
import { MultiSelect, Select } from "@/components/ui/Fields";
import Icon from "@/components/ui/Icon";

/** Which audio / subtitle tracks the media ships with, per language. */
export default function MetadataLanguagesTab({
  media, onChange, taxonomies,
}: {
  media: Media;
  onChange: (patch: Partial<Media>) => void;
  taxonomies: Taxonomies;
}) {
  const coverage = taxonomies.languages.map((lang) => ({
    ...lang,
    audio: media.languages.includes(lang.value),
    subtitle: media.subtitles.includes(lang.value),
    translated: media.translations.some((t) => t.language === lang.value && t.title),
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle title="Tracks" subtitle="Audio and subtitle languages delivered with this media" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Select
            label="Default language"
            options={taxonomies.languages}
            value={media.defaultLanguage}
            onChange={(e) => onChange({ defaultLanguage: e.target.value })}
          />
          <MultiSelect
            label="Audio languages"
            options={taxonomies.languages}
            value={media.languages}
            onChange={(v) => onChange({ languages: v })}
          />
          <MultiSelect
            label="Subtitle languages"
            options={taxonomies.languages}
            value={media.subtitles}
            onChange={(v) => onChange({ subtitles: v })}
          />
        </div>
      </Card>

      <Card padded={false}>
        <div className="px-5 pt-5">
          <CardTitle title="Coverage" subtitle="What exists per language across audio, subtitles and metadata" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr className="border-y border-line bg-surface-2 text-[13px] text-muted-strong">
                <th className="px-5 py-3 text-left font-semibold">Language</th>
                <th className="px-5 py-3 text-center font-semibold">Audio</th>
                <th className="px-5 py-3 text-center font-semibold">Subtitles</th>
                <th className="px-5 py-3 text-center font-semibold">Metadata</th>
                <th className="px-5 py-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {coverage.map((row) => {
                const complete = row.audio && row.subtitle && row.translated;
                return (
                  <tr key={row.value} className="text-sm">
                    <td className="px-5 py-3 font-medium text-ink">
                      {labelOf(taxonomies.languages, row.value)}
                      <span className="ml-2 text-xs uppercase text-muted">{row.value}</span>
                    </td>
                    {[row.audio, row.subtitle, row.translated].map((ok, i) => (
                      <td key={i} className="px-5 py-3 text-center">
                        <span className={ok ? "text-ok" : "text-ink/20"}>
                          <Icon name={ok ? "check" : "close"} size={16} />
                        </span>
                      </td>
                    ))}
                    <td className="px-5 py-3 text-right">
                      {complete ? (
                        <Badge tone="ok">Complete</Badge>
                      ) : row.audio || row.subtitle || row.translated ? (
                        <Badge tone="warn">Partial</Badge>
                      ) : (
                        <Badge>Missing</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
