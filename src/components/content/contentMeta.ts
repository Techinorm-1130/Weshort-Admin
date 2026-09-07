import type { ContentAccess, ContentStatus, ContentType } from "@/types";
import type { IconName } from "@/components/ui/Icon";

/* Labels and tones shared by the library table, drawer and exports. */

export const STATUS_TONES: Record<ContentStatus, "ok" | "neutral" | "warn" | "danger"> = {
  published: "ok",
  draft: "neutral",
  scheduled: "warn",
  archived: "danger",
};

export const ACCESS_TONES: Record<ContentAccess, "accent" | "neutral"> = {
  premium: "accent",
  free: "neutral",
};

export const TYPE_ICONS: Record<ContentType, IconName> = {
  movie: "film",
  series: "layers",
  episode: "tv",
};

const STATUS_LABELS: Record<ContentStatus, string> = {
  published: "Published",
  draft: "Draft",
  scheduled: "Scheduled",
  archived: "Archived",
};

const ACCESS_LABELS: Record<ContentAccess, string> = {
  free: "Free",
  premium: "Premium",
};

const TYPE_LABELS: Record<ContentType, string> = {
  movie: "Movie",
  series: "Series",
  episode: "Episode",
};

export const statusLabel = (status: ContentStatus) => STATUS_LABELS[status];
export const accessLabel = (access: ContentAccess) => ACCESS_LABELS[access];
export const typeLabel = (type: ContentType) => TYPE_LABELS[type];

export const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
];

export const TYPE_FILTERS = [
  { value: "movie", label: "Movie" },
  { value: "series", label: "Series" },
  { value: "episode", label: "Episode" },
];
