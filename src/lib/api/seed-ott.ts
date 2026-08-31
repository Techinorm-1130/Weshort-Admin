/* Deterministic seed data for the OTT modules (viewers + content). */

import type {
  ContentItem, LandingPage, LandingSection, SubscriptionPlan, Viewer, ViewerStatus,
} from "@/types";
import { rng } from "./seed";

const NAMES: [string, string][] = [
  ["Arun Prakash", "in"], ["Giulia Ferraro", "it"], ["Marco Bianchi", "it"],
  ["Priya Sharma", "in"], ["Elena Rossi", "it"], ["Karthik Raja", "in"],
  ["Sophie Martin", "fr"], ["Divya Menon", "in"], ["Luca Costa", "it"],
  ["Anita Desai", "in"], ["Thomas Weber", "de"], ["Meera Nair", "in"],
  ["Paolo Greco", "it"], ["Hannah Klein", "de"], ["Ravi Kumar", "in"],
  ["Chiara Villa", "it"], ["James Carter", "us"], ["Sneha Iyer", "in"],
  ["Emma Dubois", "fr"], ["Vikram Singh", "in"], ["Laura Conti", "it"],
  ["Daniel Brooks", "gb"], ["Ananya Rao", "in"], ["Marta Ferrari", "it"],
  ["Suresh Babu", "in"], ["Nina Lopez", "es"], ["Aditya Verma", "in"],
  ["Clara Moretti", "it"], ["Owen Fletcher", "gb"], ["Kavya Pillai", "in"],
];

const PLANS: SubscriptionPlan[] = ["free", "basic", "standard", "premium"];
const STATUSES: ViewerStatus[] = ["active", "active", "active", "inactive", "active", "suspended"];
const PLAN_PRICE: Record<SubscriptionPlan, number> = { free: 0, basic: 4.99, standard: 8.99, premium: 14.99 };
const AVATAR_COLORS = ["#e50914", "#2f6bff", "#3ddc84", "#ffb020", "#7c5cff", "#38bdf8"];

const TITLES = [
  "Super Funny Button", "Babau", "Eidos", "Danzamorfosi", "Il silenzio del sudore",
  "Cojocabron", "Blue Hour", "The Last Reel", "Kintsugi", "Notturno",
];

const DEVICE_NAMES: [string, "tv" | "mobile" | "tablet" | "web"][] = [
  ["Samsung Smart TV", "tv"], ["iPhone 15", "mobile"], ["iPad Air", "tablet"],
  ["Chrome on Windows", "web"], ["Android TV", "tv"], ["Pixel 8", "mobile"],
];

const CITIES = ["Chennai, IN", "Milan, IT", "Rome, IT", "Bengaluru, IN", "Paris, FR", "Berlin, DE"];

export function buildViewers(): Viewer[] {
  const rand = rng(4242);

  return NAMES.map(([name, country], i) => {
    const plan = PLANS[i % PLANS.length];
    const status = STATUSES[i % STATUSES.length];
    const slug = name.toLowerCase().replace(/[^a-z]+/g, ".");
    const joinedMonth = String(1 + (i % 8)).padStart(2, "0");
    const joinedDay = String(1 + ((i * 3) % 27)).padStart(2, "0");
    const activeDay = String(1 + ((i * 5) % 27)).padStart(2, "0");

    const historyCount = 3 + (i % 4);
    const watchHistory = Array.from({ length: historyCount }, (_, h) => ({
      id: `wh_${i}_${h}`,
      title: TITLES[(i + h) % TITLES.length],
      kind: (h % 3 === 0 ? "series" : "movie") as "series" | "movie",
      progress: h === 0 ? 100 : Math.round(20 + rand() * 75),
      durationSec: 600 + Math.round(rand() * 4200),
      watchedAt: `2026-08-${String(27 - h * 2).padStart(2, "0")}T${String(18 + (h % 5)).padStart(2, "0")}:20:00.000Z`,
    }));

    const deviceCount = 1 + (i % 3);
    const devices = Array.from({ length: deviceCount }, (_, d) => {
      const [deviceName, kind] = DEVICE_NAMES[(i + d) % DEVICE_NAMES.length];
      return {
        id: `dev_${i}_${d}`,
        name: deviceName,
        kind,
        lastUsedAt: `2026-08-${String(26 - d * 3).padStart(2, "0")}T20:10:00.000Z`,
        location: CITIES[(i + d) % CITIES.length],
      };
    });

    return {
      id: `vwr_${String(i + 1).padStart(3, "0")}`,
      name,
      email: `${slug}@example.com`,
      phone: `+${country === "in" ? "91" : country === "it" ? "39" : "1"} ${String(600000000 + i * 137). slice(0, 9)}`,
      country,
      avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
      avatar: null,
      plan,
      status,
      watchTimeMin: 120 + Math.round(rand() * 5400),
      moviesWatched: 2 + Math.round(rand() * 60),
      seriesWatched: Math.round(rand() * 14),
      lastActiveAt: `2026-08-${activeDay}T${String(9 + (i % 12)).padStart(2, "0")}:30:00.000Z`,
      lastLoginAt: `2026-08-${activeDay}T${String(9 + (i % 12)).padStart(2, "0")}:12:00.000Z`,
      joinedAt: `2026-${joinedMonth}-${joinedDay}T10:00:00.000Z`,
      subscription: {
        plan,
        startAt: `2026-${joinedMonth}-${joinedDay}`,
        endAt: plan === "free" ? "" : `2026-${String(1 + ((i + 6) % 12)).padStart(2, "0")}-${joinedDay}`,
        autoRenew: plan !== "free" && i % 4 !== 0,
        priceMonthly: PLAN_PRICE[plan],
      },
      watchHistory,
      devices,
    } satisfies Viewer;
  });
}

/* ------------------------------- content -------------------------------- */

export function buildContents(): ContentItem[] {
  const rand = rng(909);

  return TITLES.slice(0, 6).map((title, i) => {
    const type = i % 3 === 2 ? "series" : "movie";
    const status = (["published", "draft", "published", "scheduled"] as const)[i % 4];

    return {
      id: `cnt_${String(i + 1).padStart(3, "0")}`,
      type,
      title,
      shortDescription: `${title} — a WeShort original.`,
      description: `${title} follows a handful of characters through a single decisive moment.`,
      poster: null,
      thumbnail: null,
      banner: null,
      releaseDate: `2026-0${1 + (i % 8)}-1${i % 9}`,
      durationSec: 900 + Math.round(rand() * 4000),
      language: i % 2 === 0 ? "en" : "it",
      genres: [["drama"], ["comedy"], ["thriller"]][i % 3],
      category: "short-film",
      country: i % 2 === 0 ? "it" : "in",
      ageRating: ["all-audiences", "12", "16"][i % 3],
      video: null,
      trailer: null,
      audioLanguages: i % 2 === 0 ? ["en", "it"] : ["ta", "en"],
      subtitles: [],
      access: i % 2 === 0 ? "premium" : "free",
      status,
      publishAt: `2026-0${1 + (i % 8)}-15`,
      expiryAt: "",
      featured: i === 0,
      allowDownload: i % 3 === 0,
      seasons:
        type === "series"
          ? [
              {
                id: `sea_${i}_1`,
                number: 1,
                title: "Season 1",
                episodes: [1, 2, 3].map((n) => ({
                  id: `ep_${i}_${n}`,
                  seasonNumber: 1,
                  episodeNumber: n,
                  title: `Episode ${n}`,
                  description: "",
                  durationSec: 600 + n * 120,
                  releaseDate: `2026-0${1 + (i % 8)}-2${n}`,
                  thumbnail: null,
                  video: null,
                })),
              },
            ]
          : [],
      createdAt: `2026-0${1 + (i % 8)}-01T10:00:00.000Z`,
      updatedAt: `2026-08-${String(20 + (i % 8)).padStart(2, "0")}T10:00:00.000Z`,
    } satisfies ContentItem;
  });
}


/* ----------------------------- landing page ----------------------------- */

/** The live WeShort landing page, as sections the admin can rearrange. */
export function buildLandingPage(): LandingPage {
  const sections: LandingSection[] = [
    {
      id: "sec_hero",
      type: "hero",
      name: "Hero",
      visible: true,
      props: {
        eyebrow: "WeShort originals",
        title: "Short films, big stories",
        subtitle: "Thousands of award-winning shorts, ready when you are. Watch on any device.",
        ctaLabel: "Start watching",
        ctaHref: "/signup",
        backgroundImage: "",
        showPosterWall: true,
      },
    },
    {
      id: "sec_genres",
      type: "genre-search",
      name: "Genre search",
      visible: true,
      props: {
        title: "Find your genre",
        subtitle: "From two-minute comedies to festival-winning drama.",
        placeholder: "Search a genre",
        genres: [
          { label: "Drama" }, { label: "Comedy" }, { label: "Documentary" },
          { label: "Animation" }, { label: "Thriller" }, { label: "Experimental" },
        ],
      },
    },
    {
      id: "sec_categories",
      type: "categories",
      name: "Categories",
      visible: true,
      props: {
        title: "Browse by category",
        subtitle: "",
        items: [
          { title: "Festival winners", description: "Selected in international festivals.", image: "" },
          { title: "Under 5 minutes", description: "A story on your coffee break.", image: "" },
          { title: "Italian shorts", description: "Straight from our home market.", image: "" },
        ],
      },
    },
    {
      id: "sec_features",
      type: "features",
      name: "Features",
      visible: true,
      props: {
        title: "Why WeShort",
        subtitle: "",
        items: [
          { icon: "play", title: "Watch anywhere", text: "Phone, tablet, laptop and TV." },
          { icon: "download", title: "Download and go", text: "Save shorts for the journey." },
          { icon: "globe", title: "Subtitled worldwide", text: "Every title, multiple languages." },
        ],
      },
    },
    {
      id: "sec_plans",
      type: "plans",
      name: "Plans",
      visible: true,
      props: {
        title: "Pick your plan",
        subtitle: "Change or cancel any time.",
        plans: [
          { name: "Basic", price: "\u20ac4.99", period: "per month", features: "HD\n1 device", highlighted: false },
          { name: "Standard", price: "\u20ac8.99", period: "per month", features: "Full HD\n2 devices\nDownloads", highlighted: false },
          { name: "Premium", price: "\u20ac14.99", period: "per month", features: "4K\n4 devices\nDownloads", highlighted: true },
        ],
      },
    },
    {
      id: "sec_faq",
      type: "faq",
      name: "FAQ",
      visible: true,
      props: {
        title: "Frequently asked questions",
        items: [
          { question: "What is WeShort?", answer: "A streaming service dedicated to short films." },
          { question: "How much does it cost?", answer: "Plans start at \u20ac4.99 per month." },
          { question: "Can I cancel?", answer: "Yes, any time, in two clicks." },
        ],
      },
    },
    {
      id: "sec_cta",
      type: "email-cta",
      name: "Email capture",
      visible: true,
      props: {
        title: "Ready to watch?",
        subtitle: "Enter your email to create or restart your membership.",
        placeholder: "Email address",
        ctaLabel: "Get started",
      },
    },
  ];

  const seo = {
    title: "WeShort — short films, big stories",
    description: "Stream award-winning short films on any device. Plans from \u20ac4.99.",
    ogImage: null,
  };

  return {
    id: "page_home",
    slug: "home",
    title: "Landing page",
    status: "published",
    version: 4,
    sections,
    seo,
    updatedAt: "2026-08-28T09:00:00.000Z",
    publishedAt: "2026-08-28T09:00:00.000Z",
    published: { sections, seo, version: 4 },
  };
}

/* ------------------------------ taxonomies ------------------------------ */

export const AUDIO_LANGUAGES = [
  { value: "ta", label: "Tamil" },
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "te", label: "Telugu" },
  { value: "ml", label: "Malayalam" },
  { value: "other", label: "Other" },
];

export const AGE_RATINGS = [
  { value: "all-audiences", label: "All audiences" },
  { value: "7", label: "7+" },
  { value: "12", label: "12+" },
  { value: "16", label: "16+" },
  { value: "18", label: "18+" },
];

export const CONTENT_CATEGORIES = [
  { value: "short-film", label: "Short film" },
  { value: "feature-film", label: "Feature film" },
  { value: "series", label: "Series" },
  { value: "documentary", label: "Documentary" },
  { value: "animation", label: "Animation" },
];

export const PLAN_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "basic", label: "Basic" },
  { value: "standard", label: "Standard" },
  { value: "premium", label: "Premium" },
];

export const VIEWER_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];
