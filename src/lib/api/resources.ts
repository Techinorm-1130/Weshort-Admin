/* Typed API surface used by every screen. One function per backend endpoint. */

import type {
  Contribution,
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
