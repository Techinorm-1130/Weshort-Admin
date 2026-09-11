"use client";

import { useEffect, useRef, useState } from "react";
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
 *
 * A film held in object storage is played from there directly rather than
 * through the stream route. The route only redirects to the same place, and a
 * player follows that redirect on every seek — so each drag of the scrub bar
 * was costing a function invocation to be told where the file already was.
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
  const [direct, setDirect] = useState<string | null>(null);
  const [failed, setFailed] = useState("");
  const video = useRef<HTMLVideoElement>(null);

  const assetId = asset?.id ?? "";
  const canPlay = asset?.state === "ready";

  /*
   * Where the bytes actually are.
   *
   * Asked for only once play is pressed, and only for a film that is ready:
   * a drawer full of episodes should not fire a request per episode for
   * something nobody has opened.
   */
  useEffect(() => {
    if (!playing || !assetId || direct) return;
    let alive = true;
    uploadApi
      .get(assetId)
      .then((found) => {
        if (alive && found.blobUrl) setDirect(found.blobUrl);
      })
      .catch(() => {
        /* the stream route still stands in — no need to say anything */
      });
    return () => {
      alive = false;
    };
  }, [playing, assetId, direct]);

  if (!asset) return null;

  // The asset id is the one the upload pipeline knows; previewUrl is only a
  // fallback for a record that predates it.
  const src = direct || (asset.id ? uploadApi.streamUrl(asset.id) : asset.previewUrl ?? "");
  const ready = canPlay;
  const detail = [
    asset.durationSec ? formatDuration(asset.durationSec) : "",
    asset.sizeBytes ? formatBytes(asset.sizeBytes) : "",
    asset.width && asset.height ? `${asset.width} × ${asset.height}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  if (playing && src) {
    return (
      <div>
        <video
          ref={video}
          controls
          autoPlay
          playsInline
          preload="metadata"
          src={src}
          poster={poster ?? undefined}
          onError={() => {
            /*
             * Say what went wrong instead of showing a still frame and a dead
             * control bar. The codes are the only detail the element gives,
             * and knowing which one it is separates "the file never arrived"
             * from "this browser cannot decode it".
             */
            const code = video.current?.error?.code;
            setFailed(
              code === 4
                ? "This browser cannot decode the file. Open it in a new tab to download it."
                : code === 2
                  ? "The file could not be fetched. Check the upload still exists in storage."
                  : "Playback failed.",
            );
          }}
          className="aspect-video w-full rounded-lg bg-black"
        />

        {failed ? (
          <p className="mt-1.5 text-[12px] text-danger">{failed}</p>
        ) : null}

        {/* always a way to watch it, whatever the embedded player makes of it */}
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="mt-1.5 inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink"
        >
          Open in a new tab
          <Icon name="arrow-up-right" size={12} />
        </a>
      </div>
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
