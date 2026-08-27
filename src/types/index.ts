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
