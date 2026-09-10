/* ---------------------------------------------------------------------------
 * In-memory mock backend.
 *
 * It answers the exact REST paths the real API is expected to expose, so the
 * UI never knows which one it is talking to. Delete this file (and the
 * USING_MOCK branch in http.ts) once the backend is live.
 * ------------------------------------------------------------------------ */

import type {
  ActivityEvent,
  ContentItem,
  Contribution,
  LandingPage,
  Dashboard,
  EncodingJob,
  EncodingProfile,
  FastChannel,
  Media,
  Organisation,
  OrgUser,
  Paginated,
  Person,
  Project,
  Actor,
  Taxonomies,
  UploaderStats,
  Viewer,
  ViewerStats,
} from "@/types";
import {
  activityEvents,
  buildBandwidth,
  buildEncodingJobs,
  buildMedias,
  catalogueBreakdown,
  contributions,
  encodingProfiles,
  fastChannels,
  organisation,
  orgUsers,
  people,
  projects,
  statSeries,
  taxonomies,
} from "./seed";
import { UPLOADERS, buildContents, buildLandingPage, buildViewers } from "./seed-ott";

type Row = { id: string };

/** Field access on a heterogeneous row without widening the model types. */
const fields = (row: Row) => row as unknown as Record<string, unknown>;

interface Store {
  medias: Media[];
  viewers: Viewer[];
  contents: ContentItem[];
  landing: LandingPage[];
  projects: Project[];
  fastChannels: FastChannel[];
  contributions: Contribution[];
  people: Person[];
  encodingJobs: EncodingJob[];
  encodingProfiles: EncodingProfile[];
  orgUsers: OrgUser[];
  organisation: Organisation;
  events: ActivityEvent[];
  taxonomies: Taxonomies;
}

/** Kept on globalThis so hot-reload does not wipe edits made in the session. */
function createStore(): Store {
  const medias = buildMedias();
  return {
    medias,
    viewers: buildViewers(),
    contents: buildContents(),
    landing: [buildLandingPage()],
    projects: [...projects],
    fastChannels: [...fastChannels],
    contributions: [...contributions],
    people: [...people],
    encodingJobs: buildEncodingJobs(medias),
    encodingProfiles: [...encodingProfiles],
    orgUsers: [...orgUsers],
    organisation: { ...organisation },
    events: [...activityEvents],
    taxonomies,
  };
}

const globalRef = globalThis as unknown as { __weshortStore?: Store };

/**
 * Reuses the store across hot reloads so edits made in a session survive, while
 * back-filling any collection added since that store was created.
 */
function ensureStore(): Store {
  const existing = globalRef.__weshortStore;
  if (!existing) return (globalRef.__weshortStore = createStore());

  const fresh = createStore();
  for (const key of Object.keys(fresh) as (keyof Store)[]) {
    if (existing[key] === undefined) {
      (existing as unknown as Record<string, unknown>)[key] = fresh[key];
    }
  }
  // rows created before the approval fields existed still need them
  for (const row of existing.contents) {
    if (!row.approval) {
      row.approval = {
        state: row.status === "published" ? "approved" : "draft",
        submittedAt: "",
        reviewedAt: "",
        reviewedBy: null,
        note: "",
      };
    }
  }
  return existing;
}

const db: Store = ensureStore();

/* ------------------------------- helpers ------------------------------- */

const LATENCY_MS = 180;

function delay<T>(value: T): Promise<T> {
  if (typeof window === "undefined") return Promise.resolve(value);
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));
}

function nowIso(): string {
  return new Date().toISOString();
}

function makeId(prefix: string): string {
  const n = Math.floor(Math.random() * 1e6).toString(36);
  return `${prefix}_${n}`;
}

function textOf(row: Row): string {
  const f = fields(row);
  return [f.title, f.name, f.email, f.slug]
    .filter((v): v is string => typeof v === "string")
    .join(" ")
    .toLowerCase();
}

function paginate<T extends Row>(rows: T[], params: URLSearchParams): Paginated<T> {
  let items = [...rows];

  const search = params.get("search")?.trim().toLowerCase();
  if (search) items = items.filter((r) => textOf(r).includes(search));

  const status = params.get("status");
  if (status && status !== "all") {
    items = items.filter((r) => {
      const f = fields(r);
      return f.status === status || f.state === status;
    });
  }

  const type = params.get("type");
  if (type && type !== "all") {
    items = items.filter((r) => {
      const f = fields(r);
      return f.kind === type || f.sourceType === type || f.role === type || f.state === type;
    });
  }

  const approval = params.get("approval");
  if (approval && approval !== "all") {
    items = items.filter((r) => {
      const state = fields(r).approval as { state?: string } | undefined;
      return state?.state === approval;
    });
  }

  const uploadedBy = params.get("uploadedBy");
  if (uploadedBy && uploadedBy !== "all") {
    items = items.filter((r) => {
      const owner = fields(r).uploadedBy as { id?: string } | undefined;
      return owner?.id === uploadedBy;
    });
  }

  const plan = params.get("plan");
  if (plan && plan !== "all") items = items.filter((r) => fields(r).plan === plan);

  const country = params.get("country");
  if (country && country !== "all") items = items.filter((r) => fields(r).country === country);

  // Date window, applied to whichever timestamp the row carries.
  const from = params.get("from");
  const to = params.get("to");
  if (from || to) {
    items = items.filter((r) => {
      const f = fields(r);
      const stamp = String(f.joinedAt ?? f.createdAt ?? f.updatedAt ?? "");
      if (!stamp) return true;
      if (from && stamp < from) return false;
      if (to && stamp > `${to}T23:59:59.999Z`) return false;
      return true;
    });
  }

  const sort = params.get("sort") ?? "-updatedAt";
  const desc = sort.startsWith("-");
  const key = desc ? sort.slice(1) : sort;
  items.sort((a, b) => {
    const av = fields(a)[key];
    const bv = fields(b)[key];
    if (typeof av === "number" && typeof bv === "number") return desc ? bv - av : av - bv;
    return desc
      ? String(bv ?? "").localeCompare(String(av ?? ""))
      : String(av ?? "").localeCompare(String(bv ?? ""));
  });

  const page = Number(params.get("page") ?? 1);
  const perPage = Number(params.get("perPage") ?? 10);
  const start = (page - 1) * perPage;

  return { items: items.slice(start, start + perPage), total: items.length, page, perPage };
}

function findOr404<T extends Row>(rows: T[], id: string): T {
  const row = rows.find((r) => r.id === id);
  if (!row) throw new Error(`Not found: ${id}`);
  return row;
}

function patch<T extends Row>(rows: T[], id: string, body: unknown): T {
  const row = findOr404(rows, id);
  Object.assign(row, body as object, { updatedAt: nowIso() });
  return row;
}

/* -------------------------------- factories ----------------------------- */

function blankMedia(kind: Media["kind"]): Media {
  return {
    id: makeId("med"),
    kind,
    status: "draft",
    enabled: true,
    title: "New content",
    poster: null,
    previewUrl: null,
    creator: { id: "usr_ws", name: "WeShort Studio", initials: "WS", color: "#e50914" },
    updatedAt: nowIso(),
    createdAt: nowIso(),
    languages: ["en"],
    subtitles: [],
    restrictions: ["ww"],
    encodingProfileId: "enc_fullhd",
    encodingProgress: 0,
    sources: [],
    metadata: {
      durationSec: 0, durationType: "", isan: "", eidr: "", customId: "",
      productionYear: "", releaseDate: "", trailerId: "", category: "",
      classification: "", genre: [], format: "", theme: [], audience: "",
      accessibility: [], keywords: [], variables: [], internalComment: "",
    },
    defaultLanguage: "en",
    translations: [
      { language: "en", title: "", slug: "", shortHook: "", description: "", images: {} },
    ],
    casting: [],
    rights: {
      ownership: "", territories: [], startAt: "", endAt: "",
      monetisation: [], contractRef: "", notes: "",
    },
    availability: {
      projects: [], offers: [], publishAt: "", unpublishAt: "",
      geoBlocking: [], downloadable: false, featured: false,
    },
  };
}

function blankChannel(): FastChannel {
  return {
    id: makeId("fst"), name: "New content", status: "draft", enabled: true,
    sourceType: "internal", sourceUrl: "", epgUrl: "", adsEnabled: false, adTagUrl: "",
    logo: null, languages: ["en"], updatedAt: nowIso(), viewers: 0,
  };
}

function blankContribution(): Contribution {
  return {
    id: makeId("ctr"), title: "New content", status: "draft", enabled: true,
    sourceType: "flux", sourceUrl: "", epgUrl: "", durationSec: 0, durationType: "",
    languages: ["en"],
    creator: { id: "usr_ws", name: "WeShort Studio", initials: "WS", color: "#e50914" },
    updatedAt: nowIso(),
  };
}

function blankProject(): Project {
  return {
    id: makeId("prj"), name: "New project", slug: "new-project", kind: "svod", status: "draft",
    activeOffers: 0, registeredUsers: 0, activeUsers: 0, trialUsers: 0, churnedUsers: 0,
    domain: "", updatedAt: nowIso(),
  };
}

function blankPerson(): Person {
  return {
    id: makeId("per"), name: "New person", role: "actor", photo: null, country: "it",
    birthDate: "", biography: "", credits: 0, updatedAt: nowIso(),
  };
}

function blankProfile(): EncodingProfile {
  return {
    id: makeId("enc"), name: "New profile", resolution: "1920x1080", videoBitrateKbps: 6000,
    audioBitrateKbps: 192, codec: "H.264", container: "HLS", costMultiplier: 1,
    isDefault: false, updatedAt: nowIso(),
  };
}

function blankUser(): OrgUser {
  return {
    id: makeId("usr"), name: "New user", email: "", role: "viewer", status: "offline",
    lastLogin: "", avatarColor: "#2f80ed",
  };
}

function blankContent(type: ContentItem["type"]): ContentItem {
  const me = UPLOADERS[0];
  return {
    id: makeId("cnt"),
    type,
    uploadedBy: { id: me.id, name: me.name, initials: me.initials, color: me.color },
    approval: { state: "draft", submittedAt: "", reviewedAt: "", reviewedBy: null, note: "" },
    title: "",
    shortDescription: "",
    description: "",
    poster: null,
    thumbnail: null,
    banner: null,
    releaseDate: "",
    durationSec: 0,
    language: "",
    genres: [],
    category: "",
    country: "",
    ageRating: "",
    video: null,
    trailer: null,
    audioLanguages: [],
    subtitles: [],
    access: "premium",
    status: "draft",
    publishAt: "",
    expiryAt: "",
    featured: false,
    allowDownload: false,
    seasons: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

/* -------------------------------- dashboard ----------------------------- */

function buildDashboard(): Dashboard {
  const bandwidth = buildBandwidth();
  const registered = db.projects.reduce((s, p) => s + p.registeredUsers, 0);
  const active = db.projects.reduce((s, p) => s + p.activeUsers, 0);

  return {
    stats: [
      {
        key: "activeUsers", label: "Active users", value: String(active), icon: "users",
        delta: 4.2, hint: "last 30 days", color: "#2f80ed", series: statSeries.activeUsers,
      },
      {
        key: "registeredUsers", label: "Registered users", value: registered.toLocaleString("en-US"),
        icon: "user", delta: 1.8, hint: "all projects", color: "#82c91e", series: statSeries.registeredUsers,
      },
      {
        key: "contents", label: "Contents", value: String(db.medias.length), icon: "file",
        delta: 0.9, hint: "in catalogue", color: "#17c1e8", series: statSeries.contents,
      },
      {
        key: "bandwidth", label: "Bandwidth", value: `${bandwidth.totalGb} GB / 5.00 TB`, icon: "gauge",
        hint: "this month", color: "#f5a524", series: statSeries.bandwidth,
      },
    ],
    bandwidth,
    encodingQuota: {
      usedMin: db.organisation.encodingUsedMin,
      availableMin: db.organisation.encodingQuotaMin - db.organisation.encodingUsedMin,
    },
    catalogue: catalogueBreakdown,
    events: db.events,
  };
}

/* --------------------------------- router ------------------------------- */

/**
 * Titles pointing at a stored video asset. The uploads API asks before it
 * deletes one, so bytes something depends on cannot be pulled out from under it.
 */
export function contentsUsingAsset(assetId: string): { id: string; title: string }[] {
  return db.contents
    .filter(
      (c) =>
        c.video?.id === assetId ||
        c.trailer?.id === assetId ||
        c.seasons.some((s) => s.episodes.some((e) => e.video?.id === assetId)),
    )
    .map((c) => ({ id: c.id, title: c.title }));
}

export function handleMock<T>(method: string, rawPath: string, body?: unknown): Promise<T> {
  const [path, query = ""] = rawPath.split("?");
  const params = new URLSearchParams(query);
  const segments = path.split("/").filter(Boolean);
  const [resource, id, sub] = segments;
  const as = <R,>(value: R) => delay(value as unknown as T);

  switch (resource) {
    /* ------------------------------- auth ------------------------------- */
    case "auth": {
      if (id === "login") {
        const creds = body as { email?: string };
        return as({
          token: "mock-token",
          user: db.orgUsers.find((u) => u.email === creds?.email) ?? db.orgUsers[0],
        });
      }
      if (id === "register") {
        const payload = body as { name?: string; email?: string; organisation?: string };
        const created: OrgUser = {
          ...blankUser(),
          name: payload?.name ?? "New user",
          email: payload?.email ?? "",
          role: "admin",
          status: "online",
          lastLogin: nowIso(),
        };
        db.orgUsers.unshift(created);
        if (payload?.organisation) db.organisation.name = payload.organisation;
        return as({ token: "mock-token", user: created });
      }
      if (id === "me") return as(db.orgUsers[0]);
      break;
    }

    /* ----------------------------- dashboard ---------------------------- */
    case "dashboard":
      return as(buildDashboard());

    /* ---------------------------- taxonomies ---------------------------- */
    case "taxonomies":
      return as(db.taxonomies);

    /* ------------------------------ medias ------------------------------ */
    case "medias": {
      if (method === "GET" && !id) return as(paginate(db.medias, params));
      if (method === "GET" && id) return as(findOr404(db.medias, id));
      if (method === "POST" && !id) {
        const kind = ((body as { kind?: Media["kind"] })?.kind ?? "video") as Media["kind"];
        const created = { ...blankMedia(kind), ...(body as object) } as Media;
        db.medias.unshift(created);
        return as(created);
      }
      if (method === "POST" && sub === "encode") {
        const media = findOr404(db.medias, id);
        media.status = "processing";
        media.encodingProgress = 5;
        const job: EncodingJob = {
          id: makeId("job"), mediaId: media.id, mediaTitle: media.title,
          profileName: db.encodingProfiles.find((p) => p.id === media.encodingProfileId)?.name ?? "Full HD",
          state: "running", progress: 5, startedAt: nowIso(),
          durationSec: media.metadata.durationSec, costMultiplier: 1,
        };
        db.encodingJobs.unshift(job);
        return as(job);
      }
      if (method === "PATCH" || method === "PUT") return as(patch(db.medias, id, body));
      if (method === "DELETE") {
        db.medias = db.medias.filter((m) => m.id !== id);
        return as(undefined);
      }
      break;
    }

    /* ----------------------------- projects ----------------------------- */
    case "projects": {
      if (method === "GET" && !id) return as(paginate(db.projects, params));
      if (method === "GET" && id) return as(findOr404(db.projects, id));
      if (method === "POST") {
        const created = { ...blankProject(), ...(body as object) } as Project;
        db.projects.unshift(created);
        return as(created);
      }
      if (method === "PATCH" || method === "PUT") return as(patch(db.projects, id, body));
      if (method === "DELETE") {
        db.projects = db.projects.filter((p) => p.id !== id);
        return as(undefined);
      }
      break;
    }

    /* --------------------------- fast channels -------------------------- */
    case "fast-channels": {
      if (method === "GET" && !id) return as(paginate(db.fastChannels, params));
      if (method === "GET" && id) return as(findOr404(db.fastChannels, id));
      if (method === "POST") {
        const created = { ...blankChannel(), ...(body as object) } as FastChannel;
        db.fastChannels.unshift(created);
        return as(created);
      }
      if (method === "PATCH" || method === "PUT") return as(patch(db.fastChannels, id, body));
      if (method === "DELETE") {
        db.fastChannels = db.fastChannels.filter((c) => c.id !== id);
        return as(undefined);
      }
      break;
    }

    /* --------------------------- contributions -------------------------- */
    case "contributions": {
      if (method === "GET" && !id) return as(paginate(db.contributions, params));
      if (method === "GET" && id) return as(findOr404(db.contributions, id));
      if (method === "POST") {
        const created = { ...blankContribution(), ...(body as object) } as Contribution;
        db.contributions.unshift(created);
        return as(created);
      }
      if (method === "PATCH" || method === "PUT") return as(patch(db.contributions, id, body));
      if (method === "DELETE") {
        db.contributions = db.contributions.filter((c) => c.id !== id);
        return as(undefined);
      }
      break;
    }

    /* ------------------------------ casting ----------------------------- */
    case "people": {
      if (method === "GET" && !id) return as(paginate(db.people, params));
      if (method === "GET" && id) return as(findOr404(db.people, id));
      if (method === "POST") {
        const created = { ...blankPerson(), ...(body as object) } as Person;
        db.people.unshift(created);
        return as(created);
      }
      if (method === "PATCH" || method === "PUT") return as(patch(db.people, id, body));
      if (method === "DELETE") {
        db.people = db.people.filter((p) => p.id !== id);
        return as(undefined);
      }
      break;
    }

    /* ----------------------------- encodings ---------------------------- */
    case "encoding-jobs": {
      if (method === "GET") return as(paginate(db.encodingJobs, params));
      if (method === "DELETE") {
        db.encodingJobs = db.encodingJobs.filter((j) => j.id !== id);
        return as(undefined);
      }
      break;
    }

    case "encoding-profiles": {
      if (method === "GET" && !id) return as(paginate(db.encodingProfiles, params));
      if (method === "GET" && id) return as(findOr404(db.encodingProfiles, id));
      if (method === "POST") {
        const created = { ...blankProfile(), ...(body as object) } as EncodingProfile;
        db.encodingProfiles.unshift(created);
        return as(created);
      }
      if (method === "PATCH" || method === "PUT") return as(patch(db.encodingProfiles, id, body));
      if (method === "DELETE") {
        db.encodingProfiles = db.encodingProfiles.filter((p) => p.id !== id);
        return as(undefined);
      }
      break;
    }

    /* ------------------------------ viewers ----------------------------- */
    case "viewers": {
      if (method === "GET" && id === "stats") {
        const stats: ViewerStats = {
          total: db.viewers.length,
          active: db.viewers.filter((v) => v.status === "active").length,
          premium: db.viewers.filter((v) => v.plan === "premium").length,
          newThisMonth: db.viewers.filter((v) => v.joinedAt >= "2026-08-01").length,
        };
        return as(stats);
      }
      if (method === "GET" && !id) return as(paginate(db.viewers, params));
      if (method === "GET" && id) return as(findOr404(db.viewers, id));
      if (method === "PATCH" || method === "PUT") {
        const row = findOr404(db.viewers, id);
        Object.assign(row, body as object);
        return as(row);
      }
      if (method === "DELETE") {
        db.viewers = db.viewers.filter((v) => v.id !== id);
        return as(undefined);
      }
      break;
    }

    /* ------------------------------ contents ---------------------------- */
    case "contents": {
      // Upload totals per team member, for the "by member" library view.
      if (method === "GET" && id === "stats") {
        const stats: UploaderStats[] = UPLOADERS.map((member) => {
          const mine = db.contents.filter((c) => c.uploadedBy.id === member.id);
          const episodes = mine.reduce(
            (sum, c) => sum + c.seasons.reduce((n, season) => n + season.episodes.length, 0),
            0,
          );
          return {
            member: { id: member.id, name: member.name, initials: member.initials, color: member.color },
            role: member.role,
            total: mine.length,
            published: mine.filter((c) => c.status === "published").length,
            draft: mine.filter((c) => c.status === "draft").length,
            scheduled: mine.filter((c) => c.status === "scheduled").length,
            pending: mine.filter((c) => c.approval.state === "pending").length,
            approved: mine.filter((c) => c.approval.state === "approved").length,
            rejected: mine.filter((c) => c.approval.state === "rejected").length,
            movies: mine.filter((c) => c.type === "movie").length,
            series: mine.filter((c) => c.type === "series").length,
            episodes,
            totalDurationSec: mine.reduce((sum, c) => sum + c.durationSec, 0),
            lastUploadAt: mine.map((c) => c.createdAt).sort().at(-1) ?? "",
          };
        });
        return as(stats.sort((a, b) => b.total - a.total));
      }

      if (method === "GET" && !id) return as(paginate(db.contents, params));
      if (method === "GET" && id) return as(findOr404(db.contents, id));
      if (method === "POST" && !id) {
        const payload = body as Partial<ContentItem>;
        const created: ContentItem = {
          ...blankContent((payload?.type ?? "movie") as ContentItem["type"]),
          ...(payload as object),
        };
        db.contents.unshift(created);
        return as(created);
      }
      // the upload wizard hands the title to review rather than publishing it
      if (method === "POST" && sub === "submit") {
        const row = findOr404(db.contents, id);
        row.approval = {
          state: "pending",
          submittedAt: nowIso(),
          reviewedAt: "",
          reviewedBy: null,
          note: "",
        };
        row.status = "draft";
        row.updatedAt = nowIso();
        return as(row);
      }

      if (method === "POST" && (sub === "approve" || sub === "reject")) {
        const row = findOr404(db.contents, id);
        const payload = body as { note?: string; reviewer?: Actor } | undefined;
        const reviewer: Actor = payload?.reviewer ?? {
          id: UPLOADERS[0].id,
          name: UPLOADERS[0].name,
          initials: UPLOADERS[0].initials,
          color: UPLOADERS[0].color,
        };
        row.approval = {
          ...row.approval,
          state: sub === "approve" ? "approved" : "rejected",
          reviewedAt: nowIso(),
          reviewedBy: reviewer,
          note: payload?.note ?? "",
        };
        // approving releases it; a future publish date schedules it instead
        row.status =
          sub === "approve"
            ? row.publishAt && row.publishAt > nowIso().slice(0, 10)
              ? "scheduled"
              : "published"
            : "draft";
        row.updatedAt = nowIso();
        return as(row);
      }

      // an admin publishing their own upload is its own approval
      if (method === "POST" && sub === "publish") {
        const row = findOr404(db.contents, id);
        row.status = row.publishAt && row.publishAt > nowIso().slice(0, 10) ? "scheduled" : "published";
        if (row.approval.state !== "approved") {
          row.approval = {
            ...row.approval,
            state: "approved",
            reviewedAt: nowIso(),
            reviewedBy: row.uploadedBy,
          };
        }
        row.updatedAt = nowIso();
        return as(row);
      }
      if (method === "PATCH" || method === "PUT") return as(patch(db.contents, id, body));
      if (method === "DELETE") {
        db.contents = db.contents.filter((c) => c.id !== id);
        return as(undefined);
      }
      break;
    }

    /* ------------------------------ landing ----------------------------- */
    case "landing": {
      // What the public site reads: the published snapshot only.
      if (method === "GET" && id === "published") {
        const page = db.landing.find((p) => p.slug === sub);
        if (!page?.published) throw new Error(`Not published: ${sub}`);
        return as({
          slug: page.slug,
          version: page.published.version,
          publishedAt: page.publishedAt,
          seo: page.published.seo,
          sections: page.published.sections.filter((section) => section.visible),
        });
      }

      if (method === "GET" && id === "pages" && !sub) return as(paginate(db.landing, params));
      if (method === "GET" && id === "pages" && sub) return as(findOr404(db.landing, sub));

      if ((method === "PATCH" || method === "PUT") && id === "pages") {
        const page = findOr404(db.landing, sub);
        Object.assign(page, body as object, { updatedAt: nowIso(), status: "draft" });
        return as(page);
      }

      if (method === "POST" && id === "pages") {
        const page = findOr404(db.landing, sub);
        // publish promotes the working draft into the snapshot the site serves
        page.published = {
          sections: structuredClone(page.sections),
          seo: structuredClone(page.seo),
          version: page.version + 1,
        };
        page.version += 1;
        page.status = "published";
        page.publishedAt = nowIso();
        page.updatedAt = nowIso();
        return as(page);
      }
      break;
    }

    /* ---------------------------- organisation -------------------------- */
    case "organisation": {
      if (id === "users") {
        if (method === "GET") return as(paginate(db.orgUsers, params));
        if (method === "POST") {
          const created = { ...blankUser(), ...(body as object) } as OrgUser;
          db.orgUsers.unshift(created);
          return as(created);
        }
        if (method === "PATCH" || method === "PUT") return as(patch(db.orgUsers, sub, body));
        if (method === "DELETE") {
          db.orgUsers = db.orgUsers.filter((u) => u.id !== sub);
          return as(undefined);
        }
      }
      if (method === "GET") return as(db.organisation);
      if (method === "PATCH" || method === "PUT") {
        Object.assign(db.organisation, body as object);
        return as(db.organisation);
      }
      break;
    }

    default:
      break;
  }

  return Promise.reject(new Error(`Mock route not implemented: ${method} ${rawPath}`));
}
