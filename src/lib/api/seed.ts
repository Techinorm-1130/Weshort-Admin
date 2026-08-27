/* Deterministic seed data. Values never come from Math.random()/Date.now() so
 * the server render and the client render agree (no hydration mismatch). */

import type {
  ActivityEvent,
  Contribution,
  EncodingJob,
  EncodingProfile,
  FastChannel,
  Media,
  Organisation,
  OrgUser,
  Person,
  Project,
  SeriesPoint,
  Taxonomies,
} from "@/types";

/** Tiny deterministic PRNG so generated numbers stay identical across renders. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const opt = (values: string[]) =>
  values.map((v) => ({ value: v.toLowerCase().replace(/[^a-z0-9]+/g, "-"), label: v }));

export const taxonomies: Taxonomies = {
  categories: opt(["Short film", "Feature film", "Series", "Documentary", "Animation", "Podcast"]),
  classifications: opt(["All audiences", "10+", "12+", "16+", "18+"]),
  genres: opt([
    "Drama", "Comedy", "Thriller", "Horror", "Romance", "Sci-Fi", "Fantasy",
    "Documentary", "Experimental", "Animation", "Musical", "Crime",
  ]),
  formats: opt(["Short", "Mid-length", "Feature", "Episode", "Trailer", "Clip"]),
  themes: opt(["Family", "Society", "Nature", "Identity", "Travel", "Sport", "Technology", "Food"]),
  audiences: opt(["Everyone", "Teens", "Young adults", "Adults", "Kids"]),
  accessibility: opt(["Subtitles", "Closed captions", "Audio description", "Sign language"]),
  keywords: opt([
    "award winning", "festival", "italian", "black and white", "one shot",
    "coming of age", "true story", "dance", "silence", "night",
  ]),
  languages: [
    { value: "en", label: "English" },
    { value: "it", label: "Italian" },
    { value: "fr", label: "French" },
    { value: "es", label: "Spanish" },
    { value: "de", label: "German" },
    { value: "pt", label: "Portuguese" },
    { value: "ar", label: "Arabic" },
    { value: "hi", label: "Hindi" },
  ],
  countries: [
    { value: "it", label: "Italy" },
    { value: "fr", label: "France" },
    { value: "us", label: "United States" },
    { value: "gb", label: "United Kingdom" },
    { value: "es", label: "Spain" },
    { value: "de", label: "Germany" },
    { value: "in", label: "India" },
    { value: "ww", label: "Worldwide" },
  ],
  durationTypes: opt(["Exact", "Estimated", "Live", "Loop"]),
  roles: opt(["Director", "Actor", "Producer", "Writer", "Composer", "Editor", "Cinematographer"]),
  monetisation: [
    { value: "svod", label: "Subscription (SVOD)" },
    { value: "avod", label: "Advertising (AVOD)" },
    { value: "tvod", label: "Transactional (TVOD)" },
    { value: "fast", label: "FAST channel" },
  ],
};

export const organisation: Organisation = {
  id: "org_weshort",
  name: "WeShort Srl",
  email: "sarin@weshort.com",
  slug: "weshort",
  country: "it",
  timezone: "Europe/Rome",
  defaultLanguage: "en",
  plan: "Studio",
  storageQuotaBytes: 5 * 1024 ** 4,
  storageUsedBytes: Math.round(8.98 * 1024 ** 3),
  encodingQuotaMin: 6000,
  encodingUsedMin: 2816,
};

export const projects: Project[] = [
  {
    id: "prj_cscplay", name: "cscplay", slug: "cscplay", kind: "svod", status: "online",
    activeOffers: 1, registeredUsers: 14, activeUsers: 0, trialUsers: 0, churnedUsers: 0,
    domain: "cscplay.weshort.com", updatedAt: "2026-08-21T10:12:00.000Z",
  },
  {
    id: "prj_weshort_app", name: "WeShort App", slug: "weshort-app", kind: "avod", status: "online",
    activeOffers: 3, registeredUsers: 8421, activeUsers: 1263, trialUsers: 96, churnedUsers: 214,
    domain: "app.weshort.com", updatedAt: "2026-08-25T08:40:00.000Z",
  },
  {
    id: "prj_festival", name: "Festival Edition", slug: "festival", kind: "tvod", status: "draft",
    activeOffers: 0, registeredUsers: 0, activeUsers: 0, trialUsers: 0, churnedUsers: 0,
    domain: "festival.weshort.com", updatedAt: "2026-07-02T16:05:00.000Z",
  },
];

const mediaTitles: [string, string][] = [
  ["Super Funny Button", "it"], ["Babau", "it"], ["Eidos", "it"], ["Danzamorfosi", "it"],
  ["Il silenzio del sudore", "it"], ["Cojocabron", "es"], ["La casa dei ricordi", "it"],
  ["Notturno", "it"], ["Blue Hour", "en"], ["Pane e sale", "it"], ["The Last Reel", "en"],
  ["Marea", "es"], ["Kintsugi", "en"], ["Ferro", "it"], ["Lettera al mare", "it"],
  ["Sotto la pioggia", "it"], ["Petit Matin", "fr"], ["Origami", "en"], ["Rosso Ocra", "it"],
  ["The Quiet Room", "en"], ["Cenere", "it"], ["Bandiera", "it"], ["Dust and Honey", "en"],
  ["Vertigine", "it"],
];

const creators = [
  { id: "usr_ws", name: "WeShort Studio", initials: "WS", color: "#e50914" },
  { id: "usr_ml", name: "Marco Lombardi", initials: "ML", color: "#2f80ed" },
  { id: "usr_sa", name: "Sara Aiello", initials: "SA", color: "#12b886" },
];

const kinds: Media["kind"][] = ["linked", "video", "audio", "linked", "video"];
const statuses: Media["status"][] = ["online", "online", "online", "draft", "processing", "online"];

export function buildMedias(): Media[] {
  const rand = rng(2026);
  return mediaTitles.map((entry, i) => {
    const [title, lang] = entry;
    const kind = kinds[i % kinds.length];
    const status = statuses[i % statuses.length];
    const day = String(28 - (i % 27)).padStart(2, "0");
    const month = String(1 + ((i * 3) % 8)).padStart(2, "0");
    const updatedAt = `2026-${month}-${day}T09:${String(10 + (i % 45)).padStart(2, "0")}:00.000Z`;
    const durationSec = 240 + Math.round(rand() * 1800);
    const media: Media = {
      id: `med_${String(i + 1).padStart(3, "0")}`,
      kind,
      status,
      enabled: status !== "draft",
      title,
      poster: null,
      previewUrl: null,
      creator: creators[i % creators.length],
      updatedAt,
      createdAt: updatedAt,
      languages: [lang, ...(i % 3 === 0 ? ["en"] : [])],
      subtitles: i % 2 === 0 ? ["en", "it"] : ["en"],
      restrictions: i % 4 === 0 ? ["it"] : ["ww"],
      encodingProfileId: i % 3 === 0 ? "enc_4k" : "enc_fullhd",
      encodingProgress: status === "processing" ? 40 + Math.round(rand() * 50) : 100,
      sources: [],
      metadata: {
        durationSec,
        durationType: "exact",
        isan: "",
        eidr: "",
        customId: `WS-${1000 + i}`,
        productionYear: String(2019 + (i % 7)),
        releaseDate: `2026-0${1 + (i % 8)}-1${i % 9}`,
        trailerId: "",
        category: taxonomies.categories[i % taxonomies.categories.length].value,
        classification: taxonomies.classifications[i % taxonomies.classifications.length].value,
        genre: [taxonomies.genres[i % taxonomies.genres.length].value],
        format: taxonomies.formats[i % taxonomies.formats.length].value,
        theme: [taxonomies.themes[i % taxonomies.themes.length].value],
        audience: taxonomies.audiences[i % taxonomies.audiences.length].value,
        accessibility: ["subtitles"],
        keywords: [taxonomies.keywords[i % taxonomies.keywords.length].value],
        variables: [],
        internalComment: "",
      },
      defaultLanguage: "en",
      translations: [
        {
          language: "en",
          title,
          slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          shortHook: `${title} — a WeShort original short film.`,
          description: `${title} follows a handful of characters through a single decisive moment. Shot on location and selected in international festivals.`,
          images: {},
        },
      ],
      casting: [
        { personId: "per_001", role: "director" },
        { personId: "per_002", role: "actor", character: "Lead" },
      ],
      rights: {
        ownership: "WeShort Srl",
        territories: ["ww"],
        startAt: "2026-01-01",
        endAt: "2028-12-31",
        monetisation: ["svod", "avod"],
        contractRef: `CTR-${2000 + i}`,
        notes: "",
      },
      availability: {
        projects: i % 2 === 0 ? ["prj_cscplay"] : ["prj_weshort_app"],
        offers: ["premium"],
        publishAt: "2026-02-01",
        unpublishAt: "",
        geoBlocking: [],
        downloadable: i % 3 === 0,
        featured: i % 6 === 0,
      },
    };
    return media;
  });
}

export const fastChannels: FastChannel[] = [
  {
    id: "fst_001", name: "WeShort 24/7", status: "online", enabled: true, sourceType: "internal",
    sourceUrl: "https://stream.weshort.com/live/247.m3u8", epgUrl: "https://epg.weshort.com/247.xml",
    adsEnabled: true, adTagUrl: "https://ads.weshort.com/vast?ch=247", logo: null,
    languages: ["en", "it"], updatedAt: "2026-08-20T12:00:00.000Z", viewers: 312,
  },
  {
    id: "fst_002", name: "Corti Italiani", status: "draft", enabled: false, sourceType: "external",
    sourceUrl: "", epgUrl: "", adsEnabled: false, adTagUrl: "", logo: null,
    languages: ["it"], updatedAt: "2026-08-11T09:30:00.000Z", viewers: 0,
  },
];

export const contributions: Contribution[] = [
  {
    id: "ctr_001", title: "Nouveau contenu", status: "draft", enabled: true, sourceType: "flux",
    sourceUrl: "", epgUrl: "", durationSec: 0, durationType: "exact", languages: ["en"],
    creator: creators[0], updatedAt: "2026-08-27T08:15:00.000Z",
  },
  {
    id: "ctr_002", title: "New content", status: "online", enabled: true, sourceType: "external",
    sourceUrl: "https://partner.example.com/stream.m3u8", epgUrl: "https://partner.example.com/epg.xml",
    durationSec: 1620, durationType: "estimated", languages: ["en"],
    creator: creators[1], updatedAt: "2026-06-26T14:45:00.000Z",
  },
];

const peopleNames: [string, string, string][] = [
  ["Giulia Ferraro", "director", "it"], ["Luca Bianchi", "actor", "it"],
  ["Amina Cherif", "actor", "fr"], ["Tommaso Rizzo", "producer", "it"],
  ["Elena Moretti", "writer", "it"], ["Noah Feldman", "composer", "us"],
  ["Chiara Villa", "editor", "it"], ["Diego Sanz", "cinematographer", "es"],
];

export const people: Person[] = peopleNames.map(([name, role, country], i) => ({
  id: `per_${String(i + 1).padStart(3, "0")}`,
  name,
  role,
  photo: null,
  country,
  birthDate: `19${70 + i}-0${1 + (i % 9)}-1${i % 9}`,
  biography: `${name} has collaborated on more than ${4 + i} WeShort productions.`,
  credits: 3 + i,
  updatedAt: `2026-0${1 + (i % 8)}-1${i % 9}T10:00:00.000Z`,
}));

export const encodingProfiles: EncodingProfile[] = [
  {
    id: "enc_fullhd", name: "Full HD", resolution: "1920x1080", videoBitrateKbps: 6000,
    audioBitrateKbps: 192, codec: "H.264", container: "HLS", costMultiplier: 1, isDefault: true,
    updatedAt: "2026-03-04T10:00:00.000Z",
  },
  {
    id: "enc_4k", name: "Ultra HD", resolution: "3840x2160", videoBitrateKbps: 18000,
    audioBitrateKbps: 256, codec: "H.265", container: "HLS", costMultiplier: 3, isDefault: false,
    updatedAt: "2026-03-04T10:00:00.000Z",
  },
  {
    id: "enc_hd", name: "HD Ready", resolution: "1280x720", videoBitrateKbps: 3000,
    audioBitrateKbps: 128, codec: "H.264", container: "DASH", costMultiplier: 0.6, isDefault: false,
    updatedAt: "2026-02-18T10:00:00.000Z",
  },
  {
    id: "enc_audio", name: "Audio only", resolution: "-", videoBitrateKbps: 0,
    audioBitrateKbps: 256, codec: "AAC", container: "HLS", costMultiplier: 0.2, isDefault: false,
    updatedAt: "2026-01-22T10:00:00.000Z",
  },
];

export function buildEncodingJobs(medias: Media[]): EncodingJob[] {
  const states: EncodingJob["state"][] = ["done", "running", "queued", "done", "failed", "done"];
  return medias.slice(0, 10).map((m, i) => ({
    id: `job_${String(i + 1).padStart(3, "0")}`,
    mediaId: m.id,
    mediaTitle: m.title,
    profileName: i % 3 === 0 ? "Ultra HD" : "Full HD",
    state: states[i % states.length],
    progress: states[i % states.length] === "running" ? 35 + i * 5 : 100,
    startedAt: `2026-08-${String(26 - i).padStart(2, "0")}T07:${String(10 + i).padStart(2, "0")}:00.000Z`,
    durationSec: m.metadata.durationSec,
    costMultiplier: i % 3 === 0 ? 3 : 1,
  }));
}

export const orgUsers: OrgUser[] = [
  { id: "usr_ws", name: "Sarin Kumar", email: "sarin@weshort.com", role: "owner", status: "online", lastLogin: "2026-08-27T07:40:00.000Z", avatarColor: "#e50914" },
  { id: "usr_ml", name: "Marco Lombardi", email: "marco@weshort.com", role: "admin", status: "online", lastLogin: "2026-08-26T18:02:00.000Z", avatarColor: "#2f80ed" },
  { id: "usr_sa", name: "Sara Aiello", email: "sara@weshort.com", role: "editor", status: "online", lastLogin: "2026-08-25T11:23:00.000Z", avatarColor: "#12b886" },
  { id: "usr_gp", name: "Giulio Pace", email: "giulio@partner.tv", role: "contributor", status: "offline", lastLogin: "2026-07-30T09:00:00.000Z", avatarColor: "#f59f00" },
];

export function buildBandwidth(): { totalGb: number; series: SeriesPoint[]; from: string; to: string } {
  const rand = rng(77);
  const series: SeriesPoint[] = Array.from({ length: 27 }, (_, i) => ({
    label: `Aug ${String(i + 1).padStart(2, "0")}`,
    value: Number((rand() * 1.7 + 0.05).toFixed(2)),
  }));
  const totalGb = Number(series.reduce((s, p) => s + p.value, 0).toFixed(2));
  return { totalGb, series, from: "2026-08-01", to: "2026-08-27" };
}

export const activityEvents: ActivityEvent[] = [
  { id: "evt_1", kind: "media", title: "Super Funny Button published", description: "Encoding finished and the media went online on cscplay.", at: "2026-08-27T08:12:00.000Z", actor: "WeShort Studio" },
  { id: "evt_2", kind: "encoding", title: "Ultra HD encoding started", description: "Danzamorfosi queued on the Ultra HD profile (x3).", at: "2026-08-27T07:44:00.000Z", actor: "Marco Lombardi" },
  { id: "evt_3", kind: "user", title: "New registered user", description: "A viewer signed up on the cscplay project.", at: "2026-08-26T21:03:00.000Z", actor: "System" },
  { id: "evt_4", kind: "project", title: "Offer updated", description: "Premium monthly offer price changed on WeShort App.", at: "2026-08-26T16:20:00.000Z", actor: "Sara Aiello" },
  { id: "evt_5", kind: "media", title: "Rights expiring soon", description: "3 medias have distribution rights ending in 30 days.", at: "2026-08-26T09:00:00.000Z", actor: "System" },
  { id: "evt_6", kind: "comment", title: "External contribution received", description: "A partner submitted a new content for review.", at: "2026-08-25T13:35:00.000Z", actor: "Giulio Pace" },
];


/* ------------------------------ stat sparklines ------------------------- */

/** Trend series drawn behind each dashboard stat value. */
const spark = (seed: number, n = 22, min = 20, max = 100): SeriesPoint[] => {
  const rand = rng(seed);
  return Array.from({ length: n }, (_, i) => ({
    label: `D${i + 1}`,
    value: Math.round(min + rand() * (max - min)),
  }));
};

export const statSeries = {
  activeUsers: spark(11),
  registeredUsers: spark(23),
  contents: spark(37),
  bandwidth: spark(51),
};

export const catalogueBreakdown: SeriesPoint[] = [
  { label: "Short film", value: 78 },
  { label: "Documentary", value: 24 },
  { label: "Series", value: 16 },
  { label: "Animation", value: 9 },
  { label: "Podcast", value: 6 },
];
