"use client";

import type { ContentItem } from "@/types";
import type { ContentErrors } from "@/lib/content-validation";
import { Card, CardTitle } from "@/components/ui/Primitives";
import { ImageDrop } from "@/components/ui/Uploader";
import Icon from "@/components/ui/Icon";
import VideoUploader from "../VideoUploader";
import EpisodesEditor from "../EpisodesEditor";

export default function MediaStep({
  draft, patch, errors,
}: {
  draft: ContentItem;
  patch: (values: Partial<ContentItem>) => void;
  errors: ContentErrors;
}) {
  const isSeries = draft.type === "series";

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle title="Artwork" subtitle="Poster, thumbnail and hero banner" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <ImageDrop
            ratio="2:3"
            label="Poster *"
            value={draft.poster ?? undefined}
            onChange={(v) => patch({ poster: v ?? null })}
          />
          <ImageDrop
            ratio="16:9"
            label="Thumbnail"
            value={draft.thumbnail ?? undefined}
            onChange={(v) => patch({ thumbnail: v ?? null })}
          />
          <ImageDrop
            ratio="16:6"
            label="Banner / hero"
            value={draft.banner ?? undefined}
            onChange={(v) => patch({ banner: v ?? null })}
          />
        </div>
        {errors.poster ? <p className="mt-3 text-xs text-danger">{errors.poster}</p> : null}
      </Card>

      {!isSeries ? (
        <Card>
          <CardTitle
            title="Video files"
            subtitle="Uploaded to storage, then processed before it can be published"
          />
          <div className="space-y-4">
            <VideoUploader
              label="Main video"
              required
              value={draft.video}
              onChange={(asset) =>
                patch(
                  // the runtime read off the file fills the duration field once
                  asset?.durationSec && !draft.durationSec
                    ? { video: asset, durationSec: asset.durationSec }
                    : { video: asset },
                )
              }
            />
            {errors.video ? <p className="-mt-2 text-xs text-danger">{errors.video}</p> : null}

            <VideoUploader
              label="Trailer"
              hint="Optional — shown on the content page before playback"
              value={draft.trailer}
              onChange={(asset) => patch({ trailer: asset })}
              withQualities={false}
            />
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <CardTitle title="Trailer" subtitle="Optional series trailer" />
            <VideoUploader
              label="Trailer"
              value={draft.trailer}
              onChange={(asset) => patch({ trailer: asset })}
              withQualities={false}
            />
          </Card>

          <Card>
            <CardTitle
              title="Seasons and episodes"
              subtitle="Each episode carries its own video, duration and release date"
              action={
                <span className="text-[13px] text-muted">
                  {draft.seasons.reduce((n, s) => n + s.episodes.length, 0)} episode(s)
                </span>
              }
            />
            <EpisodesEditor seasons={draft.seasons} onChange={(seasons) => patch({ seasons })} />
            {errors.seasons ? <p className="mt-3 text-xs text-danger">{errors.seasons}</p> : null}
          </Card>
        </>
      )}

      <p className="flex items-start gap-2 rounded-2xl bg-surface-2 px-4 py-3 text-[13px] text-muted">
        <Icon name="shield" size={15} className="mt-0.5 shrink-0" />
        Source files stay private. Storage paths are never shown in the CMS — viewers only ever receive signed
        playback URLs.
      </p>
    </div>
  );
}
