"use client";

import { useState } from "react";
import { uploadApi } from "@/lib/upload/client";
import { formatBytes, formatDuration } from "@/lib/format";
import Icon from "@/components/ui/Icon";
import type { VideoAsset } from "@/types";

/**
 * Watch a film that has been uploaded.
 *
 * Approving a submission on the strength of its filename is not reviewing it.
 * Everything needed to play the bytes back was already here — the stream route
 * honours range requests, so seeking works on a large file — there was just
 * nowhere in the review screen to press play.
 *
 * The <video> element is only mounted once it is asked for. Mounting it with
 * the drawer would have every open of a title start pulling the film down,
 * including the ones the admin is only checking the metadata of.
 */
export default function VideoPreview({
  asset,
  poster,
  label = "Play",
}: {
  asset: VideoAsset | null | undefined;
  /** Shown behind the play button until the film is running. */
  poster?: string | null;
  label?: string;
}) {
  const [playing, setPlaying] = useState(false);

  if (!asset) return null;

  // The asset id is the one the upload pipeline knows; previewUrl is only a
  // fallback for a record that predates it.
  const src = asset.id ? uploadApi.streamUrl(asset.id) : asset.previewUrl ?? "";
  const ready = asset.state === "ready";
  const detail = [
    asset.durationSec ? formatDuration(asset.durationSec) : "",
    asset.sizeBytes ? formatBytes(asset.sizeBytes) : "",
    asset.width && asset.height ? `${asset.width} × ${asset.height}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  if (playing && src) {
    return (
      <video
        controls
        autoPlay
        preload="metadata"
        src={src}
        poster={poster ?? undefined}
        className="aspect-video w-full rounded-lg bg-black"
      />
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
      {poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
      ) : null}

      {ready && src ? (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 flex flex-col items-center justify-center gap-2 text-white transition hover:bg-black/25"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/50 backdrop-blur-sm transition group-hover:bg-white/25">
            <Icon name="play" size={20} />
          </span>
          <span className="text-[12px] font-semibold">{label}</span>
          {detail ? <span className="text-[11px] text-white/70">{detail}</span> : null}
        </button>
      ) : (
        // Not playable yet — say which of the two reasons it is.
        <p className="absolute inset-0 flex items-center justify-center px-4 text-center text-[12px] text-white/70">
          {asset.state === "failed"
            ? asset.error || "This upload failed and cannot be played."
            : asset.state === "processing"
              ? "Still processing — it can be played once it is ready."
              : asset.state === "uploading"
                ? `Still uploading — ${asset.progress}%`
                : "No playable file for this upload."}
        </p>
      )}
    </div>
  );
}
