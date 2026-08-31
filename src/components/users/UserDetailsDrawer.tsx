"use client";

import { viewerApi } from "@/lib/api/resources";
import { useQuery } from "@/lib/hooks";
import { formatDate, formatDuration, formatMinutes, initialsOf } from "@/lib/format";
import type { Viewer } from "@/types";
import Drawer, { DrawerRow, DrawerSection } from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import Icon, { type IconName } from "@/components/ui/Icon";
import { Avatar, Badge, ProgressBar, Skeleton } from "@/components/ui/Primitives";
import { PLAN_TONES, STATUS_TONES, planLabel, statusLabel } from "./userMeta";

const DEVICE_ICONS: Record<Viewer["devices"][number]["kind"], IconName> = {
  tv: "tv",
  mobile: "user",
  tablet: "file",
  web: "globe",
};

/** Full viewer record: profile, subscription, activity, history and devices. */
export default function UserDetailsDrawer({
  viewerId, open, onClose, onEdit, onToggleStatus, onDelete,
}: {
  viewerId: string | null;
  open: boolean;
  onClose: () => void;
  onEdit: (viewer: Viewer) => void;
  onToggleStatus: (viewer: Viewer) => void;
  onDelete: (viewer: Viewer) => void;
}) {
  const { data: viewer, loading, error } = useQuery(
    () => (viewerId ? viewerApi.get(viewerId) : Promise.resolve(null)),
    [viewerId],
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="max-w-2xl"
      title={viewer?.name ?? (loading ? "Loading…" : "User")}
      subtitle={viewer ? viewer.email : null}
      badge={
        viewer ? (
          <>
            <Badge tone={STATUS_TONES[viewer.status]}>{statusLabel(viewer.status)}</Badge>
            <Badge tone={PLAN_TONES[viewer.plan]}>{planLabel(viewer.plan)}</Badge>
          </>
        ) : null
      }
      footer={
        viewer ? (
          <>
            <Button variant="danger" icon="trash" onClick={() => onDelete(viewer)}>
              Delete
            </Button>
            <Button
              variant="secondary"
              icon={viewer.status === "suspended" ? "check" : "shield"}
              onClick={() => onToggleStatus(viewer)}
            >
              {viewer.status === "suspended" ? "Activate" : "Suspend"}
            </Button>
            <Button icon="pencil" onClick={() => onEdit(viewer)}>
              Edit user
            </Button>
          </>
        ) : null
      }
    >
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {loading || !viewer ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <>
          {/* -------------------------- identity ------------------------- */}
          <div className="mb-6 flex items-center gap-4 rounded-[22px] bg-surface-2 p-4">
            <Avatar initials={initialsOf(viewer.name)} color={viewer.avatarColor} size={56} ring={false} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-lg font-bold text-ink">{viewer.name}</p>
              <p className="truncate text-[13px] text-muted">{viewer.email}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="user" size={12} /> {viewer.phone}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="globe" size={12} /> {viewer.country.toUpperCase()}
                </span>
              </p>
            </div>
          </div>

          {/* --------------------------- activity ------------------------ */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Watch time", value: formatMinutes(viewer.watchTimeMin) },
              { label: "Movies", value: String(viewer.moviesWatched) },
              { label: "Series", value: String(viewer.seriesWatched) },
              { label: "Devices", value: String(viewer.devices.length) },
            ].map((stat) => (
              <div key={stat.label} className="rounded-[20px] bg-surface-2 p-4">
                <p className="font-display text-xl font-bold text-ink">{stat.value}</p>
                <p className="mt-1 text-xs text-muted">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* ------------------------- subscription ---------------------- */}
          <DrawerSection title="Subscription">
            <div className="rounded-[20px] bg-surface-2 px-4">
              <DrawerRow label="Plan">{planLabel(viewer.subscription.plan)}</DrawerRow>
              <DrawerRow label="Price">
                {viewer.subscription.priceMonthly ? `€${viewer.subscription.priceMonthly.toFixed(2)} / month` : "Free"}
              </DrawerRow>
              <DrawerRow label="Started">{formatDate(viewer.subscription.startAt)}</DrawerRow>
              <DrawerRow label="Renews / ends">
                {viewer.subscription.endAt ? formatDate(viewer.subscription.endAt) : "—"}
              </DrawerRow>
              <DrawerRow label="Auto renew">{viewer.subscription.autoRenew ? "On" : "Off"}</DrawerRow>
            </div>
          </DrawerSection>

          {/* ---------------------------- account ------------------------ */}
          <DrawerSection title="Account">
            <div className="rounded-[20px] bg-surface-2 px-4">
              <DrawerRow label="Status">{statusLabel(viewer.status)}</DrawerRow>
              <DrawerRow label="Joined">{formatDate(viewer.joinedAt)}</DrawerRow>
              <DrawerRow label="Last login">{formatDate(viewer.lastLoginAt, true)}</DrawerRow>
              <DrawerRow label="Last active">{formatDate(viewer.lastActiveAt, true)}</DrawerRow>
            </div>
          </DrawerSection>

          {/* ------------------------ watch history ---------------------- */}
          <DrawerSection title={`Recently watched (${viewer.watchHistory.length})`}>
            {viewer.watchHistory.length === 0 ? (
              <p className="rounded-[20px] bg-surface-2 p-4 text-[13px] text-muted">Nothing watched yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {viewer.watchHistory.map((entry) => (
                  <li key={entry.id} className="rounded-[20px] bg-surface-2 p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-surface-3 text-ink">
                        <Icon name={entry.kind === "series" ? "layers" : "film"} size={17} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{entry.title}</p>
                        <p className="text-xs text-muted">
                          {formatDuration(entry.durationSec)} · {formatDate(entry.watchedAt)}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-muted">{entry.progress}%</span>
                    </div>
                    <div className="mt-3">
                      <ProgressBar value={entry.progress} tone={entry.progress === 100 ? "ok" : "brand"} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </DrawerSection>

          {/* ---------------------------- devices ------------------------ */}
          <DrawerSection title={`Devices (${viewer.devices.length})`}>
            <ul className="space-y-2.5">
              {viewer.devices.map((device) => (
                <li key={device.id} className="flex items-center gap-3 rounded-[20px] bg-surface-2 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-surface-3 text-ink">
                    <Icon name={DEVICE_ICONS[device.kind]} size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{device.name}</p>
                    <p className="text-xs text-muted">{device.location}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted">{formatDate(device.lastUsedAt)}</span>
                </li>
              ))}
            </ul>
          </DrawerSection>
        </>
      )}
    </Drawer>
  );
}
