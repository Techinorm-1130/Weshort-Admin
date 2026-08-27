"use client";

import { useState } from "react";
import { encodingApi, orgApi } from "@/lib/api/resources";
import { useQuery } from "@/lib/hooks";
import { formatMinutes } from "@/lib/format";
import type { EncodingSource, Media } from "@/types";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { Card, CardTitle, ProgressBar } from "@/components/ui/Primitives";
import { Select, TextInput } from "@/components/ui/Fields";
import { SegmentedControl } from "@/components/ui/Tabs";
import { FileDrop, FileRow } from "@/components/ui/Uploader";
import { useToast } from "@/components/ui/Toast";

export default function EncodingsTab({
  media, onChange, onStartEncoding, encoding,
}: {
  media: Media;
  onChange: (patch: Partial<Media>) => void;
  onStartEncoding: () => void;
  encoding: boolean;
}) {
  const toast = useToast();
  const [view, setView] = useState("simple");
  const [urlMode, setUrlMode] = useState(false);
  const [url, setUrl] = useState("");

  const { data: profiles } = useQuery(() => encodingApi.profiles({ perPage: 50 }), []);
  const { data: org } = useQuery(() => orgApi.get(), []);

  const profile = profiles?.items.find((p) => p.id === media.encodingProfileId);
  const remainingMin = org ? org.encodingQuotaMin - org.encodingUsedMin : 0;
  const canEncode = media.sources.length > 0 && remainingMin > 0;

  const addSources = (files: { name: string; size: number; type: string; previewUrl: string }[]) => {
    const mapped: EncodingSource[] = files.map((f) => ({
      id: `${f.name}-${f.size}`,
      name: f.name,
      sizeBytes: f.size,
      kind: f.type.startsWith("audio") ? "audio" : /\.(vtt|srt)$/i.test(f.name) ? "subtitle" : "video",
      url: f.previewUrl,
      addedAt: new Date().toISOString(),
    }));
    onChange({ sources: [...media.sources, ...mapped] });
    toast.success(`${mapped.length} file(s) added`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-3">
        <span className="text-[13px] text-muted">Display:</span>
        <SegmentedControl
          size="sm"
          value={view}
          onChange={setView}
          options={[
            { value: "simple", label: "Simple" },
            { value: "expert", label: "Expert" },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* --------------------------- source files -------------------------- */}
        <Card>
          <CardTitle
            title="Source files"
            action={
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" icon="link" onClick={() => setUrlMode((v) => !v)}>
                  From a URL
                </Button>
                <Button size="sm" icon="plus" onClick={() => document.getElementById("media-file-drop")?.click()}>
                  From a file
                </Button>
              </div>
            }
          />

          {urlMode ? (
            <div className="mb-4 flex items-end gap-2">
              <TextInput
                label="Source URL"
                placeholder="https://cdn.example.com/master.mp4"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <Button
                onClick={() => {
                  if (!url) return;
                  onChange({
                    sources: [
                      ...media.sources,
                      {
                        id: url,
                        name: url.split("/").pop() ?? url,
                        sizeBytes: 0,
                        kind: "video",
                        url,
                        addedAt: new Date().toISOString(),
                      },
                    ],
                  });
                  setUrl("");
                  setUrlMode(false);
                  toast.success("Source URL added");
                }}
              >
                Add
              </Button>
            </div>
          ) : null}

          <div id="media-file-drop">
            <FileDrop onFiles={addSources} />
          </div>

          {media.sources.length ? (
            <ul className="mt-4 space-y-2">
              {media.sources.map((source) => (
                <li key={source.id}>
                  <FileRow
                    name={source.name}
                    size={source.sizeBytes}
                    kind={source.kind}
                    onRemove={() =>
                      onChange({ sources: media.sources.filter((s) => s.id !== source.id) })
                    }
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </Card>

        {/* ---------------------------- preview ------------------------------ */}
        <Card>
          <CardTitle title="Preview" />
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg bg-black text-center">
            {media.previewUrl ? (
              <video src={media.previewUrl} controls className="h-full w-full rounded-lg" />
            ) : (
              <>
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-line-strong text-muted">
                  <Icon name="play" size={26} />
                </span>
                <p className="text-sm text-muted">No preview available</p>
                <p className="text-xs text-muted">Encode your media to preview it here</p>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* ----------------------------- encoding ----------------------------- */}
      <Card>
        <CardTitle
          title="Encoding"
          action={
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[13px] text-muted">
                <Icon name="close" size={14} />
                {canEncode ? "Ready" : "Unavailable"}
              </span>
              <Button icon="bolt" disabled={!canEncode} loading={encoding} onClick={onStartEncoding}>
                Start encoding
              </Button>
            </div>
          }
        />

        <div className="space-y-4">
          <Select
            label="Encoding profile"
            options={(profiles?.items ?? []).map((p) => ({ value: p.id, label: `${p.name} — ${p.resolution}` }))}
            value={media.encodingProfileId}
            onChange={(e) => onChange({ encodingProfileId: e.target.value })}
          />

          <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2 text-sm text-muted">
              <Icon name="sliders" size={16} />
              Cost multiplier: <span className="font-semibold text-ink">x{profile?.costMultiplier ?? 1}</span>
            </span>
            <span className="rounded-md border border-line px-2.5 py-1 text-[13px] text-muted">
              AVAILABLE: <span className="font-semibold text-ink">{formatMinutes(remainingMin)}</span>
            </span>
          </div>

          {media.status === "processing" ? (
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[13px] text-muted">
                <span>Encoding in progress</span>
                <span className="font-semibold text-ink">{media.encodingProgress}%</span>
              </div>
              <ProgressBar value={media.encodingProgress} tone="info" />
            </div>
          ) : null}

          {view === "expert" ? (
            <div className="grid grid-cols-1 gap-4 border-t border-line pt-4 sm:grid-cols-3">
              <TextInput label="Video bitrate (kbps)" value={profile?.videoBitrateKbps ?? 0} readOnly />
              <TextInput label="Audio bitrate (kbps)" value={profile?.audioBitrateKbps ?? 0} readOnly />
              <TextInput label="Container" value={profile?.container ?? ""} readOnly />
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
