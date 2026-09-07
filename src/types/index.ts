/* ---------------------------------------------------------------------------
 * Domain models for the WeShort admin CMS.
 * Every screen renders from these shapes — swapping the mock adapter in
 * src/lib/api/http.ts for a real backend requires no component changes.
 * ------------------------------------------------------------------------ */

export type ID = string;

/** Traffic-light state shown as a coloured dot in every list. */
export type EntityStatus = "online" | "draft" | "processing" | "error" | "offline";

export type MediaKind = "video" | "audio" | "linked" | "live";

export interface Actor {
  id: ID;
  name: string;
  initials: string;
  color?: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

export interface ListQuery {
  search?: string;
  page?: number;
  perPage?: number;
  status?: EntityStatus | "all";
  type?: string | "all";
  sort?: string;
}

/* ---------------------------------- projects --------------------------- */

export interface Project {
  id: ID;
  name: string;
  slug: string;
  kind: "svod" | "avod" | "tvod" | "fast";
  status: EntityStatus;
  activeOffers: number;
  registeredUsers: number;
  activeUsers: number;
  trialUsers: number;
  churnedUsers: number;
  domain: string;
  updatedAt: string;
}

/* ----------------------------------- media ----------------------------- */

export interface Translation {
  language: string;
  title: string;
  slug: string;
  shortHook: string;
  description: string;
  images: Partial<Record<"16:6" | "16:9" | "3:4" | "1:1" | "2:3", string>>;
}

export interface MediaMetadata {
  durationSec: number;
  durationType: string;
  isan: string;
  eidr: string;
  customId: string;
  productionYear: string;
  releaseDate: string;
  trailerId: string;
  category: string;
  classification: string;
  genre: string[];
  format: string;
  theme: string[];
  audience: string;
  accessibility: string[];
  keywords: string[];
  variables: { name: string; value: string }[];
  internalComment: string;
}

export interface CastCredit {
  personId: ID;
  role: string;
  character?: string;
}

export interface Rights {
  ownership: string;
  territories: string[];
  startAt: string;
  endAt: string;
  monetisation: ("svod" | "avod" | "tvod" | "fast")[];
  contractRef: string;
  notes: string;
}

export interface Availability {
  projects: ID[];
  offers: string[];
  publishAt: string;
  unpublishAt: string;
  geoBlocking: string[];
  downloadable: boolean;
  featured: boolean;
}

export interface EncodingSource {
  id: ID;
  name: string;
  sizeBytes: number;
  kind: "video" | "audio" | "subtitle";
  url: string;
  addedAt: string;
}

export interface Media {
  id: ID;
  kind: MediaKind;
  status: EntityStatus;
  enabled: boolean;
  title: string;
  poster: string | null;
  previewUrl: string | null;
  creator: Actor;
  updatedAt: string;
  createdAt: string;
  languages: string[];
  subtitles: string[];
  restrictions: string[];
  encodingProfileId: ID;
  encodingProgress: number;
  sources: EncodingSource[];
  metadata: MediaMetadata;
  translations: Translation[];
  defaultLanguage: string;
  casting: CastCredit[];
  rights: Rights;
  availability: Availability;
}

/* ------------------------------- fast channels -------------------------- */

export interface FastChannel {
  id: ID;
  name: string;
  status: EntityStatus;
  enabled: boolean;
  sourceType: "internal" | "external";
  sourceUrl: string;
  epgUrl: string;
  adsEnabled: boolean;
  adTagUrl: string;
  logo: string | null;
  languages: string[];
  updatedAt: string;
  viewers: number;
}

/* --------------------------- external contributions --------------------- */

export interface Contribution {
  id: ID;
  title: string;
  status: EntityStatus;
  enabled: boolean;
  sourceType: "flux" | "external";
  sourceUrl: string;
  epgUrl: string;
  durationSec: number;
  durationType: string;
  languages: string[];
  creator: Actor;
  updatedAt: string;
}

/* ---------------------------------- casting ----------------------------- */

export interface Person {
  id: ID;
  name: string;
  role: string;
  photo: string | null;
  country: string;
  birthDate: string;
  biography: string;
  credits: number;
  updatedAt: string;
}

/* --------------------------------- encoding ----------------------------- */

export interface EncodingJob {
  id: ID;
  mediaId: ID;
  mediaTitle: string;
  profileName: string;
  state: "queued" | "running" | "done" | "failed";
  progress: number;
  startedAt: string;
  durationSec: number;
  costMultiplier: number;
}

export interface EncodingProfile {
  id: ID;
  name: string;
  resolution: string;
  videoBitrateKbps: number;
  audioBitrateKbps: number;
  codec: string;
  container: string;
  costMultiplier: number;
  isDefault: boolean;
  updatedAt: string;
}

/* ------------------------------- organisation --------------------------- */

export interface OrgUser {
  id: ID;
  name: string;
  email: string;
  role: "owner" | "admin" | "editor" | "contributor" | "viewer";
  status: EntityStatus;
  lastLogin: string;
  avatarColor: string;
}

export interface Organisation {
  id: ID;
  name: string;
  email: string;
  slug: string;
  country: string;
  timezone: string;
  defaultLanguage: string;
  plan: string;
  storageQuotaBytes: number;
  storageUsedBytes: number;
  encodingQuotaMin: number;
  encodingUsedMin: number;
}

/* --------------------------------- dashboard ---------------------------- */

export interface DashboardStat {
  key: string;
  label: string;
  value: string;
  hint?: string;
  delta?: number;
  icon: "users" | "user" | "file" | "gauge";
  /** Accent used by the card icon chip and its sparkline. */
  color: string;
  /** Trend behind the value — drawn as the card sparkline. */
  series: SeriesPoint[];
}

export interface SeriesPoint {
  label: string;
  value: number;
}

export interface ActivityEvent {
  id: ID;
  kind: "media" | "user" | "project" | "encoding" | "comment";
  title: string;
  description: string;
  at: string;
  actor: string;
}

export interface Dashboard {
  stats: DashboardStat[];
  bandwidth: { totalGb: number; series: SeriesPoint[]; from: string; to: string };
  encodingQuota: { usedMin: number; availableMin: number };
  catalogue: SeriesPoint[];
  events: ActivityEvent[];
}

/* -------------------------------- taxonomies ---------------------------- */

export interface Option {
  value: string;
  label: string;
}

export interface Taxonomies {
  categories: Option[];
  classifications: Option[];
  genres: Option[];
  formats: Option[];
  themes: Option[];
  audiences: Option[];
  accessibility: Option[];
  keywords: Option[];
  languages: Option[];
  countries: Option[];
  durationTypes: Option[];
  roles: Option[];
  monetisation: Option[];
}

/* ===========================================================================
 * OTT viewers (audience accounts — distinct from OrgUser, who are CMS staff)
 * ======================================================================== */

export type ViewerStatus = "active" | "inactive" | "suspended";
export type SubscriptionPlan = "free" | "basic" | "standard" | "premium";

export interface WatchEntry {
  id: ID;
  title: string;
  kind: "movie" | "series";
  /** 0-100 */
  progress: number;
  durationSec: number;
  watchedAt: string;
}

export interface ViewerDevice {
  id: ID;
  name: string;
  kind: "tv" | "mobile" | "tablet" | "web";
  lastUsedAt: string;
  location: string;
}

export interface Viewer {
  id: ID;
  name: string;
  email: string;
  phone: string;
  /** ISO country code, resolved through the taxonomies list. */
  country: string;
  avatarColor: string;
  avatar: string | null;
  plan: SubscriptionPlan;
  status: ViewerStatus;
  /** Minutes watched, all time. */
  watchTimeMin: number;
  moviesWatched: number;
  seriesWatched: number;
  lastActiveAt: string;
  lastLoginAt: string;
  joinedAt: string;
  subscription: {
    plan: SubscriptionPlan;
    startAt: string;
    endAt: string;
    autoRenew: boolean;
    priceMonthly: number;
  };
  watchHistory: WatchEntry[];
  devices: ViewerDevice[];
}

export interface ViewerStats {
  total: number;
  active: number;
  premium: number;
  newThisMonth: number;
}

/* ===========================================================================
 * Content upload (movies, series, episodes)
 * ======================================================================== */

export type ContentType = "movie" | "series" | "episode";
export type ContentStatus = "draft" | "published" | "scheduled" | "archived";
export type ContentAccess = "free" | "premium";
export type UploadState = "idle" | "uploading" | "processing" | "ready" | "failed";
export type QualityLevel = "360p" | "480p" | "720p" | "1080p" | "4k";

export interface QualityRendition {
  level: QualityLevel;
  state: UploadState;
}

export interface VideoAsset {
  id: ID;
  name: string;
  sizeBytes: number;
  /** 0-100 while uploading. */
  progress: number;
  state: UploadState;
  qualities: QualityRendition[];
  /** Local object URL for preview; the backend returns the real one. */
  previewUrl?: string | null;
  error?: string;
}

export interface SubtitleTrack {
  id: ID;
  language: string;
  label: string;
  fileName: string;
  sizeBytes: number;
}

export interface EpisodeItem {
  id: ID;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  description: string;
  durationSec: number;
  releaseDate: string;
  thumbnail: string | null;
  video: VideoAsset | null;
}

export interface SeasonItem {
  id: ID;
  number: number;
  title: string;
  episodes: EpisodeItem[];
}

/** Upload totals for one team member. */
export interface UploaderStats {
  member: Actor;
  role: string;
  total: number;
  published: number;
  draft: number;
  scheduled: number;
  movies: number;
  series: number;
  episodes: number;
  totalDurationSec: number;
  lastUploadAt: string;
}

export interface ContentItem {
  id: ID;
  type: ContentType;
  /** Team member who uploaded the title — drives the per-member library. */
  uploadedBy: Actor;
  title: string;
  shortDescription: string;
  description: string;
  poster: string | null;
  thumbnail: string | null;
  banner: string | null;
  releaseDate: string;
  durationSec: number;
  language: string;
  genres: string[];
  category: string;
  country: string;
  ageRating: string;
  video: VideoAsset | null;
  trailer: VideoAsset | null;
  audioLanguages: string[];
  subtitles: SubtitleTrack[];
  access: ContentAccess;
  status: ContentStatus;
  publishAt: string;
  expiryAt: string;
  featured: boolean;
  allowDownload: boolean;
  seasons: SeasonItem[];
  createdAt: string;
  updatedAt: string;
}

/* ===========================================================================
 * Landing page builder
 *
 * The admin edits an ordered list of sections; the public site renders them
 * through a component registry keyed by `type`. Nothing is hardcoded on either
 * side — adding a section type means adding it to the registry in both apps.
 * ======================================================================== */

export type SectionType =
  | "hero"
  | "poster-wall"
  | "genre-search"
  | "categories"
  | "features"
  | "more-reasons"
  | "plans"
  | "faq"
  | "trial-banner"
  | "email-cta";

/** Values a section prop can hold. `list` fields hold rows of these. */
export type SectionValue = string | number | boolean | Record<string, string | number | boolean>[];

export interface LandingSection {
  id: ID;
  type: SectionType;
  /** Editable label so the admin can tell two heroes apart. */
  name: string;
  visible: boolean;
  props: Record<string, SectionValue>;
}

export interface LandingPage {
  id: ID;
  slug: string;
  title: string;
  status: "draft" | "published";
  /** Bumped on every publish so the site can cache-bust. */
  version: number;
  sections: LandingSection[];
  seo: { title: string; description: string; ogImage: string | null };
  updatedAt: string;
  publishedAt: string;
  /** Snapshot served to the public site — only replaced on publish. */
  published: { sections: LandingSection[]; seo: LandingPage["seo"]; version: number } | null;
}
