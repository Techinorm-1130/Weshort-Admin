/* Typed API surface used by every screen. One function per backend endpoint. */

import type {
  ContentItem,
  Contribution,
  LandingPage,
  Dashboard,
  EncodingJob,
  EncodingProfile,
  FastChannel,
  ListQuery,
  Media,
  Organisation,
  OrgUser,
  Paginated,
  Person,
  Project,
  Taxonomies,
  UploaderStats,
  Viewer,
  ViewerStats,
  ViewerStatus,
} from "@/types";
import { http } from "./http";

/* --------------------------------- auth --------------------------------- */

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  organisation: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    http.post<{ token: string; user: OrgUser }>("/auth/login", { email, password }),
  register: (payload: SignupPayload) =>
    http.post<{ token: string; user: OrgUser }>("/auth/register", payload),
  me: () => http.get<OrgUser>("/auth/me"),
};

/* ------------------------------- dashboard ------------------------------ */

export const dashboardApi = {
  get: () => http.get<Dashboard>("/dashboard"),
};

/* ------------------------------ taxonomies ------------------------------ */

export const taxonomyApi = {
  all: () => http.get<Taxonomies>("/taxonomies"),
};

/* --------------------------------- medias ------------------------------- */

export const mediaApi = {
  list: (q?: ListQuery) => http.get<Paginated<Media>>("/medias", q as Record<string, unknown>),
  get: (id: string) => http.get<Media>(`/medias/${id}`),
  create: (payload: Partial<Media>) => http.post<Media>("/medias", payload),
  update: (id: string, payload: Partial<Media>) => http.patch<Media>(`/medias/${id}`, payload),
  remove: (id: string) => http.del<void>(`/medias/${id}`),
  startEncoding: (id: string) => http.post<EncodingJob>(`/medias/${id}/encode`),
};

/* -------------------------------- projects ------------------------------ */

export const projectApi = {
  list: (q?: ListQuery) => http.get<Paginated<Project>>("/projects", q as Record<string, unknown>),
  get: (id: string) => http.get<Project>(`/projects/${id}`),
  create: (payload: Partial<Project>) => http.post<Project>("/projects", payload),
  update: (id: string, payload: Partial<Project>) => http.patch<Project>(`/projects/${id}`, payload),
  remove: (id: string) => http.del<void>(`/projects/${id}`),
};

/* ------------------------------ fast channels --------------------------- */

export const fastApi = {
  list: (q?: ListQuery) => http.get<Paginated<FastChannel>>("/fast-channels", q as Record<string, unknown>),
  get: (id: string) => http.get<FastChannel>(`/fast-channels/${id}`),
  create: (payload: Partial<FastChannel>) => http.post<FastChannel>("/fast-channels", payload),
  update: (id: string, payload: Partial<FastChannel>) =>
    http.patch<FastChannel>(`/fast-channels/${id}`, payload),
  remove: (id: string) => http.del<void>(`/fast-channels/${id}`),
};

/* ------------------------------ contributions --------------------------- */

export const contributionApi = {
  list: (q?: ListQuery) => http.get<Paginated<Contribution>>("/contributions", q as Record<string, unknown>),
  get: (id: string) => http.get<Contribution>(`/contributions/${id}`),
  create: (payload: Partial<Contribution>) => http.post<Contribution>("/contributions", payload),
  update: (id: string, payload: Partial<Contribution>) =>
    http.patch<Contribution>(`/contributions/${id}`, payload),
  remove: (id: string) => http.del<void>(`/contributions/${id}`),
};

/* --------------------------------- casting ------------------------------ */

export const castingApi = {
  list: (q?: ListQuery) => http.get<Paginated<Person>>("/people", q as Record<string, unknown>),
  get: (id: string) => http.get<Person>(`/people/${id}`),
  create: (payload: Partial<Person>) => http.post<Person>("/people", payload),
  update: (id: string, payload: Partial<Person>) => http.patch<Person>(`/people/${id}`, payload),
  remove: (id: string) => http.del<void>(`/people/${id}`),
};

/* -------------------------------- encoding ------------------------------ */

export const encodingApi = {
  jobs: (q?: ListQuery) => http.get<Paginated<EncodingJob>>("/encoding-jobs", q as Record<string, unknown>),
  cancelJob: (id: string) => http.del<void>(`/encoding-jobs/${id}`),
  profiles: (q?: ListQuery) =>
    http.get<Paginated<EncodingProfile>>("/encoding-profiles", q as Record<string, unknown>),
  getProfile: (id: string) => http.get<EncodingProfile>(`/encoding-profiles/${id}`),
  createProfile: (payload: Partial<EncodingProfile>) =>
    http.post<EncodingProfile>("/encoding-profiles", payload),
  updateProfile: (id: string, payload: Partial<EncodingProfile>) =>
    http.patch<EncodingProfile>(`/encoding-profiles/${id}`, payload),
  removeProfile: (id: string) => http.del<void>(`/encoding-profiles/${id}`),
};

/* -------------------------------- viewers ------------------------------- */

/**
 * Audience accounts. Same shape as ListQuery, except `status` carries the
 * viewer states rather than the catalogue ones, plus the OTT-only filters.
 */
export interface ViewerQuery extends Omit<ListQuery, "status"> {
  status?: ViewerStatus | "all";
  plan?: string;
  country?: string;
  from?: string;
  to?: string;
}

export const viewerApi = {
  list: (q?: ViewerQuery) => http.get<Paginated<Viewer>>("/viewers", q as Record<string, unknown>),
  get: (id: string) => http.get<Viewer>(`/viewers/${id}`),
  stats: () => http.get<ViewerStats>("/viewers/stats"),
  update: (id: string, payload: Partial<Viewer>) => http.patch<Viewer>(`/viewers/${id}`, payload),
  remove: (id: string) => http.del<void>(`/viewers/${id}`),
};

/* -------------------------------- contents ------------------------------ */

/** Library filters: the standard list query plus the uploader. */
export interface ContentQuery extends ListQuery {
  uploadedBy?: string;
}

export const contentApi = {
  list: (q?: ContentQuery) => http.get<Paginated<ContentItem>>("/contents", q as Record<string, unknown>),
  /** Upload totals per team member. */
  byMember: () => http.get<UploaderStats[]>("/contents/stats"),
  get: (id: string) => http.get<ContentItem>(`/contents/${id}`),
  create: (payload: Partial<ContentItem>) => http.post<ContentItem>("/contents", payload),
  update: (id: string, payload: Partial<ContentItem>) => http.patch<ContentItem>(`/contents/${id}`, payload),
  publish: (id: string) => http.post<ContentItem>(`/contents/${id}/publish`),
  remove: (id: string) => http.del<void>(`/contents/${id}`),
};

/* ---------------------------- landing builder --------------------------- */

/** Shape the public site receives from `/landing/published/{slug}`. */
export interface PublishedLanding {
  slug: string;
  version: number;
  publishedAt: string;
  seo: LandingPage["seo"];
  sections: LandingPage["sections"];
}

export const landingApi = {
  pages: () => http.get<Paginated<LandingPage>>("/landing/pages"),
  get: (id: string) => http.get<LandingPage>(`/landing/pages/${id}`),
  saveDraft: (id: string, payload: Partial<LandingPage>) =>
    http.patch<LandingPage>(`/landing/pages/${id}`, payload),
  publish: (id: string) => http.post<LandingPage>(`/landing/pages/${id}`),
  /** Same endpoint the WeShort site calls when it renders the page. */
  published: (slug: string) => http.get<PublishedLanding>(`/landing/published/${slug}`),
};

/* ------------------------------ organisation ---------------------------- */

export const orgApi = {
  get: () => http.get<Organisation>("/organisation"),
  update: (payload: Partial<Organisation>) => http.patch<Organisation>("/organisation", payload),
  users: (q?: ListQuery) => http.get<Paginated<OrgUser>>("/organisation/users", q as Record<string, unknown>),
  createUser: (payload: Partial<OrgUser>) => http.post<OrgUser>("/organisation/users", payload),
  updateUser: (id: string, payload: Partial<OrgUser>) =>
    http.patch<OrgUser>(`/organisation/users/${id}`, payload),
  removeUser: (id: string) => http.del<void>(`/organisation/users/${id}`),
};
