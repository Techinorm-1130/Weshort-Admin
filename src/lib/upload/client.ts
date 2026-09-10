/* ---------------------------------------------------------------------------
 * The browser half of the upload.
 *
 * Everything the queue shows about a transfer comes from here, and everything
 * here comes from the actual request: `xhr.upload.onprogress` reports bytes the
 * browser has really handed to the network, and speed / remaining time are
 * measured from those numbers. Nothing is ticked forward on a timer.
 * ------------------------------------------------------------------------ */

import type { UploadAsset, UploadConfig, UploadMedia } from "@/types";

const BASE = "/api/uploads";

/* ------------------------------- rest calls ----------------------------- */

async function json<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { cache: "no-store", ...init });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export interface UploadListQuery {
  search?: string;
  status?: string;
  from?: string;
  to?: string;
  sort?: string;
  page?: number;
  perPage?: number;
}

export interface UploadPage {
  items: UploadAsset[];
  total: number;
  page: number;
  perPage: number;
}

export const uploadApi = {
  config: () => json<UploadConfig>(`${BASE}/config`),

  list: (query: UploadListQuery = {}) => {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === "" || value === "all") continue;
      qs.set(key, String(value));
    }
    const suffix = qs.toString();
    return json<UploadPage>(suffix ? `${BASE}?${suffix}` : BASE);
  },

  /** Status poll for the assets the upload dock is watching. */
  statusOf: (ids: string[]) =>
    ids.length
      ? json<UploadPage>(`${BASE}?ids=${ids.join(",")}`).then((p) => p.items)
      : Promise.resolve([] as UploadAsset[]),

  get: (id: string) => json<UploadAsset>(`${BASE}/${id}`),

  create: (input: { fileName: string; sizeBytes: number; contentType: string; media: UploadMedia }) =>
    json<UploadAsset>(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),

  update: (id: string, patch: { internalName?: string; displayName?: string; description?: string }) =>
    json<UploadAsset>(`${BASE}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),

  cancel: (id: string) => json<UploadAsset>(`${BASE}/${id}/cancel`, { method: "POST" }),

  retryProcessing: (id: string) => json<UploadAsset>(`${BASE}/${id}/retry`, { method: "POST" }),

  remove: (id: string) => json<{ ok: true }>(`${BASE}/${id}`, { method: "DELETE" }),

  putThumbnail: (id: string, blob: Blob) =>
    json<UploadAsset>(`${BASE}/${id}/thumbnail`, {
      method: "PUT",
      headers: { "Content-Type": blob.type || "image/jpeg" },
      body: blob,
    }),

  removeThumbnail: (id: string) =>
    json<UploadAsset>(`${BASE}/${id}/thumbnail`, { method: "DELETE" }),

  streamUrl: (id: string) => `${BASE}/${id}/stream`,

  /** Cache-busted so a replaced poster shows immediately. */
  thumbnailUrl: (id: string, stamp?: string) =>
    `${BASE}/${id}/thumbnail${stamp ? `?v=${encodeURIComponent(stamp)}` : ""}`,
};

/* ------------------------------ the transfer ---------------------------- */

export interface TransferProgress {
  loaded: number;
  total: number;
  percent: number;
  /** Bytes per second over the last sample, 0 until there are two samples. */
  speedBps: number;
  /** Seconds left at the current speed, null while it cannot be measured. */
  etaSec: number | null;
}

export interface Transfer {
  promise: Promise<UploadAsset>;
  abort: () => void;
}

/**
 * PUTs the file with XMLHttpRequest — the only transport that reports upload
 * progress in every browser we target.
 */
export function sendFile(
  assetId: string,
  file: File,
  onProgress: (progress: TransferProgress) => void,
): Transfer {
  const xhr = new XMLHttpRequest();
  const startedAt = Date.now();
  let lastAt = startedAt;
  let lastLoaded = 0;
  let speedBps = 0;

  const promise = new Promise<UploadAsset>((resolve, reject) => {
    xhr.open("PUT", `${BASE}/${assetId}/file`, true);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const now = Date.now();
      const elapsed = (now - lastAt) / 1000;
      if (elapsed >= 0.25) {
        speedBps = (event.loaded - lastLoaded) / elapsed;
        lastAt = now;
        lastLoaded = event.loaded;
      }
      const remaining = event.total - event.loaded;
      onProgress({
        loaded: event.loaded,
        total: event.total,
        percent: event.total ? Math.floor((event.loaded / event.total) * 100) : 0,
        speedBps: Math.max(0, speedBps),
        etaSec: speedBps > 0 ? Math.round(remaining / speedBps) : null,
      });
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as UploadAsset);
        } catch {
          reject(new Error("The server returned an unreadable response"));
        }
        return;
      }
      let message = `Upload failed (${xhr.status})`;
      try {
        message = (JSON.parse(xhr.responseText) as { message?: string }).message ?? message;
      } catch {
        /* keep the status message */
      }
      reject(new Error(message));
    };

    xhr.onerror = () => reject(new Error("The connection dropped during the upload"));
    xhr.ontimeout = () => reject(new Error("The upload timed out"));
    xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));

    xhr.send(file);
  });

  return { promise, abort: () => xhr.abort() };
}

/* -------------------------------- probing ------------------------------- */

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

/** "1920x1080" -> "16:9". */
export function aspectRatioOf(width: number, height: number): string {
  if (!width || !height) return "";
  const divisor = gcd(width, height) || 1;
  return `${Math.round(width / divisor)}:${Math.round(height / divisor)}`;
}

/**
 * Reads what the browser can genuinely tell us about the file before it is
 * sent: duration and pixel size. Codecs and frame rate need a demuxer, so they
 * stay empty and the UI says "Not detected" rather than inventing a value.
 */
export function probeVideo(file: File): Promise<UploadMedia> {
  const container = (file.name.split(".").pop() ?? "").toUpperCase();
  const empty: UploadMedia = {
    durationSec: 0,
    width: 0,
    height: 0,
    aspectRatio: "",
    container,
    videoCodec: "",
    audioCodec: "",
    frameRate: 0,
  };

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    let settled = false;

    const done = (media: UploadMedia) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      resolve(media);
    };

    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () => {
      const width = video.videoWidth;
      const height = video.videoHeight;
      done({
        ...empty,
        durationSec: Number.isFinite(video.duration) ? Math.round(video.duration) : 0,
        width,
        height,
        aspectRatio: aspectRatioOf(width, height),
      });
    };
    // A container the browser cannot open (MKV in Safari, say) is still a valid
    // upload — the server decides. We just have nothing to report about it.
    video.onerror = () => done(empty);
    setTimeout(() => done(empty), 10_000);
    video.src = url;
  });
}

/** Grabs the frame showing at `atSec` as a JPEG, for the poster image. */
export function captureFrame(video: HTMLVideoElement): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext("2d");
  if (!context || !canvas.width || !canvas.height) return Promise.resolve(null);
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.85));
}
