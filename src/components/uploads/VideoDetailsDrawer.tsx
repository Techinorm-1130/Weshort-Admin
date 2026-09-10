"use client";

import { useRef, useState } from "react";
import type { UploadAsset } from "@/types";
import { formatBytes, formatDate, formatDuration } from "@/lib/format";
import { captureFrame, uploadApi } from "@/lib/upload/client";
import { UPLOAD_STATUS_TONES, uploadStatusLabel } from "@/lib/upload/uploadMeta";
import Drawer, { DrawerRow, DrawerSection } from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { Badge, Card, Skeleton } from "@/components/ui/Primitives";
import { TextArea, TextInput } from "@/components/ui/Fields";
import { useToast } from "@/components/ui/Toast";

/** Detected values are shown as they are; a missing one says so plainly. */
const detected = (value: string | number, suffix = "") =>
  value === 0 || value === "" ? "Not detected" : `${value}${suffix}`;

export default function VideoDetailsDrawer({
  asset, open, onClose, onSaved, onDelete, onRetryProcessing,
}: {
  asset: UploadAsset | null;
  open: boolean;
  onClose: () => void;
  onSaved: (asset: UploadAsset) => void;
  onDelete: (asset: UploadAsset) => void;
  onRetryProcessing: (asset: UploadAsset) => void;
}) {
  const toast = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);

  // The page keys this drawer on the asset id, so mounting is the reset: the
  // form starts from whatever the record holds and is never re-synced under
  // the admin's fingers while they type.
  const [internalName, setInternalName] = useState(asset?.internalName ?? "");
  const [displayName, setDisplayName] = useState(asset?.displayName ?? "");
  const [description, setDescription] = useState(asset?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [thumbStamp, setThumbStamp] = useState(asset?.hasThumbnail ? asset.id : "");
  const [thumbBusy, setThumbBusy] = useState(false);
  const thumbInput = useRef<HTMLInputElement>(null);

  if (!asset) {
    return (
      <Drawer open={open} onClose={onClose} width="max-w-2xl" title="Video">
        <div className="space-y-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </Drawer>
    );
  }

  const dirty =
    internalName !== asset.internalName ||
    displayName !== asset.displayName ||
    description !== asset.description;

  const save = async () => {
    if (!internalName.trim()) {
      toast.error("Internal name is required");
      return;
    }
    setSaving(true);
    try {
      const updated = await uploadApi.update(asset.id, {
        internalName: internalName.trim(),
        displayName,
        description,
      });
      onSaved(updated);
      toast.success("Video details updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the details");
    } finally {
      setSaving(false);
    }
  };

  const putThumbnail = async (blob: Blob, message: string) => {
    setThumbBusy(true);
    try {
      const updated = await uploadApi.putThumbnail(asset.id, blob);
      onSaved(updated);
      setThumbStamp(String(Date.now()));
      toast.success(message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the thumbnail");
    } finally {
      setThumbBusy(false);
    }
  };

  const grabFrame = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      toast.error("Play the video for a moment first, then grab the frame");
      return;
    }
    const blob = await captureFrame(video);
    if (!blob) {
      toast.error("This frame could not be captured");
      return;
    }
    await putThumbnail(blob, "Thumbnail generated from the video");
  };

  const dropThumbnail = async () => {
    setThumbBusy(true);
    try {
      const updated = await uploadApi.removeThumbnail(asset.id);
      onSaved(updated);
      setThumbStamp("");
      toast.success("Thumbnail removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove the thumbnail");
    } finally {
      setThumbBusy(false);
    }
  };

  const media = asset.media;
  const playable = asset.status === "ready" || asset.status === "processing";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="max-w-2xl"
      title={asset.displayName || asset.internalName}
      subtitle={`${asset.fileName} · uploaded ${formatDate(asset.createdAt, true)}`}
      badge={
        <>
          <Badge tone={UPLOAD_STATUS_TONES[asset.status]}>{uploadStatusLabel(asset.status)}</Badge>
          {asset.duplicateOf ? <Badge tone="warn">Duplicate file</Badge> : null}
        </>
      }
      footer={
        <>
          <Button variant="danger" icon="trash" onClick={() => onDelete(asset)}>
            Delete
          </Button>
          {asset.status === "failed" && asset.failedStage === "processing" ? (
            <Button variant="secondary" icon="upload" onClick={() => onRetryProcessing(asset)}>
              Retry processing
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button icon="check" loading={saving} disabled={!dirty} onClick={save}>
            Save
          </Button>
        </>
      }
    >
      {asset.status === "failed" ? (
        <div className="mb-5 rounded-lg border border-danger/30 bg-danger/8 p-3.5">
          <p className="text-[13px] font-semibold text-danger">
            {asset.failedStage === "processing" ? "Video processing failed" : "Upload failed"}
          </p>
          <p className="mt-1 text-[12px] text-danger">
            <span className="font-medium">Reason: </span>
            {asset.error || "No reason was reported"}
          </p>
        </div>
      ) : null}

      {/* ------------------------------ preview ------------------------------ */}
      <DrawerSection title="Preview">
        {playable ? (
          <video
            ref={videoRef}
            controls
            preload="metadata"
            poster={asset.hasThumbnail ? uploadApi.thumbnailUrl(asset.id, thumbStamp) : undefined}
            src={uploadApi.streamUrl(asset.id)}
            className="w-full rounded-lg bg-black"
          />
        ) : (
          <div className="flex h-40 items-center justify-center rounded-lg bg-surface-2 text-[13px] text-muted">
            The preview appears once processing has finished
          </div>
        )}
      </DrawerSection>

      {/* ----------------------------- thumbnail ----------------------------- */}
      <DrawerSection title="Thumbnail">
        <input
          ref={thumbInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void putThumbnail(file, "Thumbnail updated");
          }}
        />
        <div className="flex flex-wrap items-start gap-4">
          <div className="h-24 w-40 shrink-0 overflow-hidden rounded-lg bg-surface-2">
            {asset.hasThumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={uploadApi.thumbnailUrl(asset.id, thumbStamp)}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted">
                <Icon name="image" size={18} />
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              icon="upload"
              loading={thumbBusy}
              onClick={() => thumbInput.current?.click()}
            >
              {asset.hasThumbnail ? "Replace" : "Upload thumbnail"}
            </Button>
            {playable ? (
              <Button size="sm" variant="secondary" icon="image" loading={thumbBusy} onClick={grabFrame}>
                Use current frame
              </Button>
            ) : null}
            {asset.hasThumbnail ? (
              <Button size="sm" variant="ghost" icon="trash" loading={thumbBusy} onClick={dropThumbnail}>
                Remove
              </Button>
            ) : null}
          </div>
        </div>
        <p className="mt-2 text-[11px] text-muted">
          Pause the player on the frame you want, then &ldquo;Use current frame&rdquo; to grab it.
        </p>
      </DrawerSection>

      {/* --------------------------- basic details --------------------------- */}
      <DrawerSection title="Basic information">
        <Card padded className="space-y-4">
          <TextInput
            label="Internal name"
            required
            hint="What the team searches for. Not shown to viewers."
            value={internalName}
            onChange={(event) => setInternalName(event.target.value)}
          />
          <TextInput
            label="Display name"
            hint="The title viewers see when this video is used."
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
          <TextArea
            label="Description"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Card>
      </DrawerSection>

      {/* -------------------------- media information ------------------------ */}
      <DrawerSection title="Media information">
        <div className="rounded-lg border border-border px-3">
          <DrawerRow label="Duration">
            {media.durationSec ? formatDuration(media.durationSec) : "Not detected"}
          </DrawerRow>
          <DrawerRow label="File size">{formatBytes(asset.sizeBytes)}</DrawerRow>
          <DrawerRow label="Stored bytes">
            {asset.receivedBytes ? formatBytes(asset.receivedBytes) : "—"}
          </DrawerRow>
          <DrawerRow label="Resolution">
            {media.width && media.height ? `${media.width} × ${media.height}` : "Not detected"}
          </DrawerRow>
          <DrawerRow label="Aspect ratio">{detected(media.aspectRatio)}</DrawerRow>
          <DrawerRow label="Video format">{detected(media.container)}</DrawerRow>
          <DrawerRow label="Video codec">{detected(media.videoCodec)}</DrawerRow>
          <DrawerRow label="Audio codec">{detected(media.audioCodec)}</DrawerRow>
          <DrawerRow label="Frame rate">{detected(media.frameRate, " fps")}</DrawerRow>
        </div>
        <p className="mt-2 text-[11px] text-muted">
          Read from the file itself, so these cannot be edited by hand.
        </p>
      </DrawerSection>

      {/* ------------------------------ history ------------------------------ */}
      <DrawerSection title="Upload">
        <div className="rounded-lg border border-border px-3">
          <DrawerRow label="File name">{asset.fileName}</DrawerRow>
          <DrawerRow label="Uploaded by">{asset.uploadedBy.name}</DrawerRow>
          <DrawerRow label="Started">{formatDate(asset.createdAt, true)}</DrawerRow>
          <DrawerRow label="Upload finished">
            {asset.uploadedAt ? formatDate(asset.uploadedAt, true) : "—"}
          </DrawerRow>
          <DrawerRow label="Ready">{asset.readyAt ? formatDate(asset.readyAt, true) : "—"}</DrawerRow>
          <DrawerRow label="Used by">
            {asset.usedBy.length ? asset.usedBy.map((c) => c.title).join(", ") : "Not used yet"}
          </DrawerRow>
        </div>
      </DrawerSection>
    </Drawer>
  );
}
