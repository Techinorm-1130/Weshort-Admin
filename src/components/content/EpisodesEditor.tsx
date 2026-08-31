"use client";

import { useState } from "react";
import type { EpisodeItem, SeasonItem, VideoAsset } from "@/types";
import { formatDuration, parseDuration } from "@/lib/format";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import { Badge, Card } from "@/components/ui/Primitives";
import { DateInput, TextArea, TextInput } from "@/components/ui/Fields";
import VideoUploader from "./VideoUploader";
import { useToast } from "@/components/ui/Toast";

let seq = 0;
const nextId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${seq++}`;

/** Seasons → episodes tree with inline editing and per-episode video upload. */
export default function EpisodesEditor({
  seasons, onChange,
}: {
  seasons: SeasonItem[];
  onChange: (next: SeasonItem[]) => void;
}) {
  const toast = useToast();
  const [openSeason, setOpenSeason] = useState<string | null>(seasons[0]?.id ?? null);
  const [openEpisode, setOpenEpisode] = useState<string | null>(null);

  const addSeason = () => {
    const number = seasons.length + 1;
    const season: SeasonItem = {
      id: nextId("sea"),
      number,
      title: `Season ${number}`,
      episodes: [],
    };
    onChange([...seasons, season]);
    setOpenSeason(season.id);
  };

  const patchSeason = (id: string, patch: Partial<SeasonItem>) =>
    onChange(seasons.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const removeSeason = (id: string) => {
    onChange(seasons.filter((s) => s.id !== id));
    toast.info("Season removed");
  };

  const addEpisode = (season: SeasonItem) => {
    const number = season.episodes.length + 1;
    const episode: EpisodeItem = {
      id: nextId("ep"),
      seasonNumber: season.number,
      episodeNumber: number,
      title: `Episode ${number}`,
      description: "",
      durationSec: 0,
      releaseDate: "",
      thumbnail: null,
      video: null,
    };
    patchSeason(season.id, { episodes: [...season.episodes, episode] });
    setOpenEpisode(episode.id);
  };

  const patchEpisode = (seasonId: string, episodeId: string, patch: Partial<EpisodeItem>) =>
    onChange(
      seasons.map((s) =>
        s.id === seasonId
          ? { ...s, episodes: s.episodes.map((e) => (e.id === episodeId ? { ...e, ...patch } : e)) }
          : s,
      ),
    );

  const removeEpisode = (seasonId: string, episodeId: string) =>
    onChange(
      seasons.map((s) =>
        s.id === seasonId ? { ...s, episodes: s.episodes.filter((e) => e.id !== episodeId) } : s,
      ),
    );

  return (
    <div className="space-y-4">
      {seasons.length === 0 ? (
        <div className="rounded-[22px] bg-surface-2 p-6 text-center">
          <p className="text-sm font-semibold text-ink">No season yet</p>
          <p className="mx-auto mt-1.5 max-w-sm text-[13px] text-muted">
            A series needs at least one season with one episode before it can be published.
          </p>
          <div className="mt-4 flex justify-center">
            <Button icon="plus" onClick={addSeason}>
              Add season 1
            </Button>
          </div>
        </div>
      ) : null}

      {seasons.map((season) => {
        const expanded = openSeason === season.id;
        return (
          <Card key={season.id} padded={false} className="overflow-hidden">
            {/* season header */}
            <div className="flex flex-wrap items-center gap-3 px-5 py-4">
              <button
                type="button"
                onClick={() => setOpenSeason(expanded ? null : season.id)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted transition hover:text-ink"
                aria-label={expanded ? "Collapse season" : "Expand season"}
              >
                <Icon name="chevron-down" size={16} className={expanded ? "" : "-rotate-90"} />
              </button>

              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base font-bold text-ink">{season.title}</p>
                <p className="text-xs text-muted">
                  Season {season.number} · {season.episodes.length} episode
                  {season.episodes.length === 1 ? "" : "s"}
                </p>
              </div>

              <Button size="sm" variant="secondary" icon="plus" onClick={() => addEpisode(season)}>
                Add episode
              </Button>
              <button
                type="button"
                aria-label="Remove season"
                onClick={() => removeSeason(season.id)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted transition hover:bg-danger/15 hover:text-danger"
              >
                <Icon name="trash" size={15} />
              </button>
            </div>

            {expanded ? (
              <div className="border-t border-line px-5 py-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextInput
                    label="Season title"
                    value={season.title}
                    onChange={(e) => patchSeason(season.id, { title: e.target.value })}
                  />
                  <TextInput
                    label="Season number"
                    type="number"
                    min={1}
                    value={season.number}
                    onChange={(e) => patchSeason(season.id, { number: Number(e.target.value) || 1 })}
                  />
                </div>

                {/* episodes */}
                <ul className="mt-5 space-y-2.5">
                  {season.episodes.map((episode) => {
                    const open = openEpisode === episode.id;
                    return (
                      <li key={episode.id} className="rounded-[20px] bg-surface-2">
                        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[12px] font-bold text-ink">
                            {episode.episodeNumber}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-ink">
                              {episode.title || `Episode ${episode.episodeNumber}`}
                            </p>
                            <p className="text-xs text-muted">
                              {episode.durationSec ? formatDuration(episode.durationSec) : "no duration"}
                              {episode.video ? " · video attached" : " · no video"}
                            </p>
                          </div>

                          {episode.video?.state === "ready" ? <Badge tone="ok">Ready</Badge> : null}

                          <button
                            type="button"
                            onClick={() => setOpenEpisode(open ? null : episode.id)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-3 text-muted transition hover:text-ink"
                            aria-label={open ? "Collapse episode" : "Edit episode"}
                          >
                            <Icon name={open ? "chevron-down" : "pencil"} size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeEpisode(season.id, episode.id)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-3 text-muted transition hover:bg-danger/15 hover:text-danger"
                            aria-label="Remove episode"
                          >
                            <Icon name="trash" size={15} />
                          </button>
                        </div>

                        {open ? (
                          <div className="space-y-4 border-t border-line px-4 py-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <TextInput
                                label="Episode title"
                                required
                                value={episode.title}
                                onChange={(e) =>
                                  patchEpisode(season.id, episode.id, { title: e.target.value })
                                }
                              />
                              <TextInput
                                label="Episode number"
                                type="number"
                                min={1}
                                value={episode.episodeNumber}
                                onChange={(e) =>
                                  patchEpisode(season.id, episode.id, {
                                    episodeNumber: Number(e.target.value) || 1,
                                  })
                                }
                              />
                              <TextInput
                                label="Duration"
                                placeholder="00:24:00"
                                defaultValue={formatDuration(episode.durationSec)}
                                onBlur={(e) =>
                                  patchEpisode(season.id, episode.id, {
                                    durationSec: parseDuration(e.target.value),
                                  })
                                }
                              />
                              <DateInput
                                label="Release date"
                                value={episode.releaseDate}
                                onChange={(v) => patchEpisode(season.id, episode.id, { releaseDate: v })}
                              />
                            </div>

                            <TextArea
                              label="Description"
                              rows={3}
                              value={episode.description}
                              onChange={(e) =>
                                patchEpisode(season.id, episode.id, { description: e.target.value })
                              }
                            />

                            <VideoUploader
                              label="Episode video"
                              value={episode.video}
                              onChange={(asset: VideoAsset | null) =>
                                patchEpisode(season.id, episode.id, { video: asset })
                              }
                            />
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>

                {season.episodes.length === 0 ? (
                  <p className="mt-4 rounded-[20px] bg-surface-2 px-4 py-3 text-[13px] text-muted">
                    No episode in this season yet.
                  </p>
                ) : null}
              </div>
            ) : null}
          </Card>
        );
      })}

      {seasons.length ? (
        <Button variant="secondary" icon="plus" onClick={addSeason}>
          Add season {seasons.length + 1}
        </Button>
      ) : null}
    </div>
  );
}
