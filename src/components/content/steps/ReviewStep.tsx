"use client";

import type { ContentItem, Taxonomies } from "@/types";
import { displayableImage } from "@/lib/upload/client";
import { formatBytes, formatDate, formatDuration, labelOf, labelsOf } from "@/lib/format";
import type { ContentErrors } from "@/lib/content-validation";
import { AGE_RATINGS, AUDIO_LANGUAGES, CONTENT_CATEGORIES } from "@/lib/api/seed-ott";
import { Badge, Card, CardTitle } from "@/components/ui/Primitives";
import { DrawerRow } from "@/components/ui/Drawer";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";

/** Final check before publishing: everything entered, plus blocking problems. */
export default function ReviewStep({
  draft, errors, taxonomies, onFix, pending,
}: {
  draft: ContentItem;
  errors: ContentErrors;
  taxonomies: Taxonomies | null;
  /** Jump back to the step that owns a field. */
  onFix: (field: string) => void;
  /** Uploads still running. */
  pending: number;
}) {
  const problems = Object.entries(errors).filter(([, message]) => message);
  const episodes = draft.seasons.reduce((n, s) => n + s.episodes.length, 0);

  return (
    <div className="space-y-4">
      {problems.length ? (
        <Card className="border-danger/30">
          <CardTitle
            title={`${problems.length} thing${problems.length === 1 ? "" : "s"} to fix before publishing`}
            subtitle="Everything else can stay as a draft."
          />
          <ul className="space-y-2">
            {problems.map(([field, message]) => (
              <li
                key={field}
                className="flex items-center justify-between gap-3 rounded-2xl bg-danger/10 px-4 py-3 text-[13px] text-danger"
              >
                <span className="flex items-center gap-2">
                  <Icon name="close" size={14} /> {message}
                </span>
                <Button size="sm" variant="secondary" onClick={() => onFix(field)}>
                  Fix
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-ok/15 text-ok">
              <Icon name="check" size={19} />
            </span>
            <div>
              <p className="font-display text-base font-bold text-ink">Ready to publish</p>
              <p className="text-[13px] text-muted">
                {pending
                  ? `${pending} upload(s) still processing — publishing waits for them.`
                  : "All required fields are filled. Publishing puts it live on WeShort."}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardTitle title="Artwork" />
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Poster", src: displayableImage(draft.poster), ratio: "2 / 3" },
              { label: "Thumb", src: displayableImage(draft.thumbnail), ratio: "16 / 9" },
              { label: "Banner", src: draft.banner, ratio: "16 / 6" },
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
                    <Icon name="image" size={18} />
                  )}
                </div>
                <p className="mt-1.5 text-center text-[11px] text-muted">{art.label}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardTitle
            title={draft.title || "Untitled"}
            subtitle={draft.shortDescription || "No short description"}
            action={
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral">{draft.type}</Badge>
                <Badge tone={draft.access === "premium" ? "brand" : "ok"}>{draft.access}</Badge>
                {draft.featured ? <Badge tone="accent">Featured</Badge> : null}
              </div>
            }
          />
          <div className="rounded-lg bg-surface-2 px-4">
            <DrawerRow label="Release date">{draft.releaseDate ? formatDate(draft.releaseDate) : "—"}</DrawerRow>
            <DrawerRow label="Duration">
              {draft.durationSec ? formatDuration(draft.durationSec) : "—"}
            </DrawerRow>
            <DrawerRow label="Language">{labelOf(taxonomies?.languages ?? [], draft.language) || "—"}</DrawerRow>
            <DrawerRow label="Genre">{labelsOf(taxonomies?.genres ?? [], draft.genres) || "—"}</DrawerRow>
            <DrawerRow label="Category">{labelOf(CONTENT_CATEGORIES, draft.category) || "—"}</DrawerRow>
            <DrawerRow label="Country">{labelOf(taxonomies?.countries ?? [], draft.country) || "—"}</DrawerRow>
            <DrawerRow label="Age rating">{labelOf(AGE_RATINGS, draft.ageRating) || "—"}</DrawerRow>
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle title="Media" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-surface-2 px-4">
            <DrawerRow label="Main video">
              {draft.video ? `${draft.video.name} · ${formatBytes(draft.video.sizeBytes)}` : "—"}
            </DrawerRow>
            <DrawerRow label="Video status">{draft.video?.state ?? "—"}</DrawerRow>
            <DrawerRow label="Resolution">
              {draft.video?.width && draft.video?.height
                ? `${draft.video.width} × ${draft.video.height}`
                : "Not detected"}
            </DrawerRow>
            <DrawerRow label="Trailer">{draft.trailer ? draft.trailer.name : "—"}</DrawerRow>
          </div>

          <div className="rounded-lg bg-surface-2 px-4">
            <DrawerRow label="Audio">{labelsOf(AUDIO_LANGUAGES, draft.audioLanguages) || "—"}</DrawerRow>
            <DrawerRow label="Subtitles">
              {draft.subtitles.length ? draft.subtitles.map((s) => s.label).join(", ") : "—"}
            </DrawerRow>
            {draft.type === "series" ? (
              <DrawerRow label="Seasons">
                {draft.seasons.length} season(s) · {episodes} episode(s)
              </DrawerRow>
            ) : null}
            <DrawerRow label="Download">{draft.allowDownload ? "Allowed" : "Blocked"}</DrawerRow>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle title="Publication" />
        <div className="rounded-lg bg-surface-2 px-4">
          <DrawerRow label="Publish date">{draft.publishAt ? formatDate(draft.publishAt) : "Immediately"}</DrawerRow>
          <DrawerRow label="Expiry date">{draft.expiryAt ? formatDate(draft.expiryAt) : "No expiry"}</DrawerRow>
          <DrawerRow label="Current status">{draft.status}</DrawerRow>
        </div>
      </Card>
    </div>
  );
}
