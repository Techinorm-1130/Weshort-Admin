"use client";

import { useRef, useState } from "react";
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
 *
 * Where it plays from is settled BEFORE the element is mounted, never after.
 * Handing a <video> a new src while it is loading aborts that load, and Chrome
 * reports the abort as MEDIA_ERR_SRC_NOT_SUPPORTED — the same code a file it
 * genuinely cannot decode produces. Whether the lookup won the race decided
 * whether the film played, which is why it played only sometimes.
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
  const [src, setSrc] = useState("");
  const [opening, setOpening] = useState(false);
  const [failed, setFailed] = useState("");
  const video = useRef<HTMLVideoElement>(null);

  if (!asset) return null;

  const ready = asset.state === "ready";
  // previewUrl is only a fallback for a record made before the asset id was
  // the thing the pipeline keyed on
  const routeUrl = asset.id ? uploadApi.streamUrl(asset.id) : asset.previewUrl ?? "";

  const detail = [
    asset.durationSec ? formatDuration(asset.durationSec) : "",
    asset.sizeBytes ? formatBytes(asset.sizeBytes) : "",
    asset.width && asset.height ? `${asset.width} × ${asset.height}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  /** Finds where the file is, then mounts the player on that one address. */
  const open = async () => {
    setOpening(true);
    let target = routeUrl;
    try {
      const found = await uploadApi.get(asset.id);
      if (found.blobUrl) target = found.blobUrl;
    } catch {
      /* the stream route still stands in — no need to say anything */
    }
    setSrc(target);
    setOpening(false);
  };

  if (src) {
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
             * control bar. The code is the only detail the element gives, and
             * it separates "the file never arrived" from "this browser cannot
             * decode it".
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

        {failed ? <p className="mt-1.5 text-[12px] text-danger">{failed}</p> : null}

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

      {ready && routeUrl ? (
        <button
          type="button"
          onClick={() => void open()}
          disabled={opening}
          className="group absolute inset-0 flex flex-col items-center justify-center gap-2 text-white transition hover:bg-black/25 disabled:cursor-wait"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/50 backdrop-blur-sm transition group-hover:bg-white/25">
            <Icon name="play" size={20} />
          </span>
          <span className="text-[12px] font-semibold">{opening ? "Opening…" : label}</span>
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
