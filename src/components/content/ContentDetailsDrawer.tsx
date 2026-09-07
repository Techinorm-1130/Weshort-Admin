"use client";

import { contentApi, taxonomyApi } from "@/lib/api/resources";
import { useQuery } from "@/lib/hooks";
import { formatBytes, formatDate, formatDuration, labelOf, labelsOf } from "@/lib/format";
import { AGE_RATINGS, AUDIO_LANGUAGES, CONTENT_CATEGORIES } from "@/lib/api/seed-ott";
import type { ContentItem } from "@/types";
import Drawer, { DrawerRow, DrawerSection } from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { Avatar, Badge, Skeleton } from "@/components/ui/Primitives";
import { ACCESS_TONES, STATUS_TONES, accessLabel, statusLabel, typeLabel } from "./contentMeta";

/** Everything recorded about one uploaded title. */
export default function ContentDetailsDrawer({
  contentId, open, onClose, onEdit, onDelete,
}: {
  contentId: string | null;
  open: boolean;
  onClose: () => void;
  onEdit: (item: ContentItem) => void;
  onDelete: (item: ContentItem) => void;
}) {
  const { data: item, loading, error } = useQuery(
    () => (contentId ? contentApi.get(contentId) : Promise.resolve(null)),
    [contentId],
  );
  const { data: taxonomies } = useQuery(() => taxonomyApi.all(), []);

  const episodes = item?.seasons.reduce((n, s) => n + s.episodes.length, 0) ?? 0;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="max-w-2xl"
      title={item?.title ?? (loading ? "Loading…" : "Content")}
      subtitle={item ? `${typeLabel(item.type)} · uploaded ${formatDate(item.createdAt)}` : null}
      badge={
        item ? (
          <>
            <Badge tone={STATUS_TONES[item.status]}>{statusLabel(item.status)}</Badge>
            <Badge tone={ACCESS_TONES[item.access]}>{accessLabel(item.access)}</Badge>
            {item.featured ? <Badge tone="accent">Featured</Badge> : null}
          </>
        ) : null
      }
      footer={
        item ? (
          <>
            <Button variant="danger" icon="trash" onClick={() => onDelete(item)}>
              Delete
            </Button>
            <Button icon="pencil" onClick={() => onEdit(item)}>
              Edit content
            </Button>
          </>
        ) : null
      }
    >
      {error ? <p className="text-[13px] text-danger">{error}</p> : null}

      {loading || !item ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <>
          {/* -------------------------- uploader -------------------------- */}
          <div className="mb-5 flex items-center gap-3 rounded-lg border border-border p-3">
            <Avatar
              initials={item.uploadedBy.initials}
              color={item.uploadedBy.color}
              size={38}
              ring={false}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-ink">{item.uploadedBy.name}</p>
              <p className="text-[11px] text-muted">Uploaded {formatDate(item.createdAt, true)}</p>
            </div>
            <span className="text-[11px] text-muted">Updated {formatDate(item.updatedAt)}</span>
          </div>

          {/* --------------------------- artwork -------------------------- */}
          <DrawerSection title="Artwork">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Poster", src: item.poster, ratio: "2 / 3" },
                { label: "Thumbnail", src: item.thumbnail, ratio: "16 / 9" },
                { label: "Banner", src: item.banner, ratio: "16 / 6" },
              ].map((art) => (
                <div key={art.label}>
                  <div
                    style={{ aspectRatio: art.ratio }}
                    className="flex w-full items-center justify-center overflow-hidden rounded-md bg-surface-2 text-muted"
                  >
                    {art.src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={art.src} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Icon name="image" size={16} />
                    )}
                  </div>
                  <p className="mt-1 text-center text-[11px] text-muted">{art.label}</p>
                </div>
              ))}
            </div>
          </DrawerSection>

          {/* -------------------------- basic info ------------------------ */}
          <DrawerSection title="Basic information">
            <div className="rounded-lg border border-border px-3">
              <DrawerRow label="Type">{typeLabel(item.type)}</DrawerRow>
              <DrawerRow label="Short description">{item.shortDescription || "—"}</DrawerRow>
              <DrawerRow label="Release date">
                {item.releaseDate ? formatDate(item.releaseDate) : "—"}
              </DrawerRow>
              <DrawerRow label="Duration">
                {item.durationSec ? formatDuration(item.durationSec) : "—"}
              </DrawerRow>
              <DrawerRow label="Language">
                {labelOf(taxonomies?.languages ?? [], item.language) || "—"}
              </DrawerRow>
              <DrawerRow label="Genre">{labelsOf(taxonomies?.genres ?? [], item.genres) || "—"}</DrawerRow>
              <DrawerRow label="Category">{labelOf(CONTENT_CATEGORIES, item.category) || "—"}</DrawerRow>
              <DrawerRow label="Country">
                {labelOf(taxonomies?.countries ?? [], item.country) || "—"}
              </DrawerRow>
              <DrawerRow label="Age rating">{labelOf(AGE_RATINGS, item.ageRating) || "—"}</DrawerRow>
            </div>
            {item.description ? (
              <p className="mt-3 rounded-lg bg-surface-2 p-3 text-[13px] leading-relaxed text-muted-strong">
                {item.description}
              </p>
            ) : null}
          </DrawerSection>

          {/* ----------------------------- media -------------------------- */}
          <DrawerSection title="Media">
            <div className="rounded-lg border border-border px-3">
              <DrawerRow label="Main video">
                {item.video ? `${item.video.name} · ${formatBytes(item.video.sizeBytes)}` : "—"}
              </DrawerRow>
              <DrawerRow label="Video status">{item.video?.state ?? "—"}</DrawerRow>
              <DrawerRow label="Qualities">
                {item.video?.qualities.filter((q) => q.state === "ready").map((q) => q.level).join(", ") ||
                  "—"}
              </DrawerRow>
              <DrawerRow label="Trailer">{item.trailer?.name ?? "—"}</DrawerRow>
              <DrawerRow label="Audio">{labelsOf(AUDIO_LANGUAGES, item.audioLanguages) || "—"}</DrawerRow>
              <DrawerRow label="Subtitles">
                {item.subtitles.length ? item.subtitles.map((s) => s.label).join(", ") : "—"}
              </DrawerRow>
            </div>
          </DrawerSection>

          {/* --------------------------- episodes ------------------------- */}
          {item.type === "series" ? (
            <DrawerSection title={`Seasons (${item.seasons.length}) · ${episodes} episodes`}>
              <div className="space-y-2.5">
                {item.seasons.map((season) => (
                  <div key={season.id} className="rounded-lg border border-border">
                    <p className="border-b border-line px-3 py-2 text-[13px] font-semibold text-ink">
                      {season.title}
                    </p>
                    <ul className="divide-y divide-line">
                      {season.episodes.map((episode) => (
                        <li key={episode.id} className="flex items-center gap-3 px-3 py-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-surface-2 text-[11px] font-semibold text-muted-strong">
                            {episode.episodeNumber}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
                            {episode.title}
                          </span>
                          <span className="shrink-0 text-[11px] text-muted">
                            {episode.durationSec ? formatDuration(episode.durationSec) : "—"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </DrawerSection>
          ) : null}

          {/* ------------------------- availability ----------------------- */}
          <DrawerSection title="Availability">
            <div className="rounded-lg border border-border px-3">
              <DrawerRow label="Access">{accessLabel(item.access)}</DrawerRow>
              <DrawerRow label="Status">{statusLabel(item.status)}</DrawerRow>
              <DrawerRow label="Publish date">
                {item.publishAt ? formatDate(item.publishAt) : "Immediately"}
              </DrawerRow>
              <DrawerRow label="Expiry date">
                {item.expiryAt ? formatDate(item.expiryAt) : "No expiry"}
              </DrawerRow>
              <DrawerRow label="Featured">{item.featured ? "Yes" : "No"}</DrawerRow>
              <DrawerRow label="Downloads">{item.allowDownload ? "Allowed" : "Blocked"}</DrawerRow>
            </div>
          </DrawerSection>
        </>
      )}
    </Drawer>
  );
}
