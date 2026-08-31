import type { IconName } from "@/components/ui/Icon";
import type { LandingSection, SectionType, SectionValue } from "@/types";

/* ---------------------------------------------------------------------------
 * Section registry.
 *
 * One entry per section type: the fields the admin can edit and the defaults a
 * freshly added section starts from. The editor renders itself from this, so a
 * new section type needs no new form code here — only a matching component in
 * the public site's registry.
 * ------------------------------------------------------------------------ */

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "toggle"
  | "select"
  | "image"
  | "color"
  | "list";

export interface SectionField {
  key: string;
  label: string;
  type: FieldType;
  hint?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  /** For `list` fields: the shape of one row. */
  fields?: SectionField[];
  /** For `list` fields: singular noun used on the add button. */
  itemLabel?: string;
}

export interface SectionDefinition {
  type: SectionType;
  label: string;
  description: string;
  icon: IconName;
  fields: SectionField[];
  defaults: Record<string, SectionValue>;
}

const ICON_OPTIONS = [
  { value: "play", label: "Play" },
  { value: "film", label: "Film" },
  { value: "download", label: "Download" },
  { value: "globe", label: "Globe" },
  { value: "shield", label: "Shield" },
  { value: "bolt", label: "Bolt" },
  { value: "users", label: "Users" },
  { value: "tv", label: "TV" },
];

export const SECTION_LIBRARY: SectionDefinition[] = [
  {
    type: "hero",
    label: "Hero",
    description: "Full-width opening block with headline and call to action.",
    icon: "sparkles",
    fields: [
      { key: "eyebrow", label: "Eyebrow", type: "text", placeholder: "Unlimited short films" },
      { key: "title", label: "Headline", type: "text", placeholder: "Watch shorts that matter" },
      { key: "subtitle", label: "Sub-headline", type: "textarea" },
      { key: "ctaLabel", label: "Button label", type: "text", placeholder: "Start watching" },
      { key: "ctaHref", label: "Button link", type: "text", placeholder: "/signup" },
      { key: "backgroundImage", label: "Background image", type: "image" },
      { key: "showPosterWall", label: "Show poster wall behind", type: "toggle" },
    ],
    defaults: {
      eyebrow: "WeShort originals",
      title: "Short films, big stories",
      subtitle: "Thousands of award-winning shorts, ready when you are.",
      ctaLabel: "Start watching",
      ctaHref: "/signup",
      backgroundImage: "",
      showPosterWall: true,
    },
  },
  {
    type: "poster-wall",
    label: "Poster wall",
    description: "Scrolling columns of poster artwork.",
    icon: "image",
    fields: [
      { key: "title", label: "Title", type: "text" },
      {
        key: "posters",
        label: "Posters",
        type: "list",
        itemLabel: "poster",
        fields: [
          { key: "title", label: "Title", type: "text" },
          { key: "image", label: "Artwork", type: "image" },
        ],
      },
    ],
    defaults: { title: "", posters: [] },
  },
  {
    type: "genre-search",
    label: "Genre search",
    description: "Sliding rows of genre pills with a search field.",
    icon: "search",
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      { key: "placeholder", label: "Search placeholder", type: "text" },
      {
        key: "genres",
        label: "Genres",
        type: "list",
        itemLabel: "genre",
        fields: [{ key: "label", label: "Label", type: "text" }],
      },
    ],
    defaults: {
      title: "Find your genre",
      subtitle: "",
      placeholder: "Search a genre",
      genres: [{ label: "Drama" }, { label: "Comedy" }, { label: "Documentary" }],
    },
  },
  {
    type: "categories",
    label: "Categories",
    description: "Film-strip of category cards.",
    icon: "layers",
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      {
        key: "items",
        label: "Categories",
        type: "list",
        itemLabel: "category",
        fields: [
          { key: "title", label: "Title", type: "text" },
          { key: "description", label: "Description", type: "textarea" },
          { key: "image", label: "Image", type: "image" },
        ],
      },
    ],
    defaults: { title: "Browse by category", subtitle: "", items: [] },
  },
  {
    type: "features",
    label: "Features",
    description: "Icon + text grid explaining the product.",
    icon: "check",
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      {
        key: "items",
        label: "Features",
        type: "list",
        itemLabel: "feature",
        fields: [
          { key: "icon", label: "Icon", type: "select", options: ICON_OPTIONS },
          { key: "title", label: "Title", type: "text" },
          { key: "text", label: "Text", type: "textarea" },
        ],
      },
    ],
    defaults: {
      title: "Why WeShort",
      subtitle: "",
      items: [
        { icon: "play", title: "Watch anywhere", text: "Phone, tablet, laptop and TV." },
        { icon: "download", title: "Download and go", text: "Save shorts for the journey." },
      ],
    },
  },
  {
    type: "more-reasons",
    label: "More reasons",
    description: "Secondary reasons-to-join cards.",
    icon: "sparkles",
    fields: [
      { key: "title", label: "Title", type: "text" },
      {
        key: "items",
        label: "Reasons",
        type: "list",
        itemLabel: "reason",
        fields: [
          { key: "icon", label: "Icon", type: "select", options: ICON_OPTIONS },
          { key: "title", label: "Title", type: "text" },
          { key: "text", label: "Text", type: "textarea" },
        ],
      },
    ],
    defaults: { title: "More reasons to join", items: [] },
  },
  {
    type: "plans",
    label: "Plans",
    description: "Subscription pricing table.",
    icon: "billing",
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      {
        key: "plans",
        label: "Plans",
        type: "list",
        itemLabel: "plan",
        fields: [
          { key: "name", label: "Name", type: "text" },
          { key: "price", label: "Price", type: "text", placeholder: "€8.99" },
          { key: "period", label: "Period", type: "text", placeholder: "per month" },
          { key: "features", label: "Features (one per line)", type: "textarea" },
          { key: "highlighted", label: "Highlight this plan", type: "toggle" },
        ],
      },
    ],
    defaults: {
      title: "Pick your plan",
      subtitle: "",
      plans: [
        { name: "Basic", price: "€4.99", period: "per month", features: "HD\n1 device", highlighted: false },
        { name: "Premium", price: "€14.99", period: "per month", features: "4K\n4 devices\nDownloads", highlighted: true },
      ],
    },
  },
  {
    type: "faq",
    label: "FAQ",
    description: "Accordion of questions and answers.",
    icon: "help",
    fields: [
      { key: "title", label: "Title", type: "text" },
      {
        key: "items",
        label: "Questions",
        type: "list",
        itemLabel: "question",
        fields: [
          { key: "question", label: "Question", type: "text" },
          { key: "answer", label: "Answer", type: "textarea" },
        ],
      },
    ],
    defaults: {
      title: "Frequently asked questions",
      items: [{ question: "What is WeShort?", answer: "A streaming service for short films." }],
    },
  },
  {
    type: "trial-banner",
    label: "Trial banner",
    description: "Narrow band pushing the free trial.",
    icon: "bolt",
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      { key: "ctaLabel", label: "Button label", type: "text" },
      { key: "ctaHref", label: "Button link", type: "text" },
    ],
    defaults: {
      title: "Start your free trial",
      subtitle: "Cancel any time.",
      ctaLabel: "Try WeShort free",
      ctaHref: "/signup",
    },
  },
  {
    type: "email-cta",
    label: "Email capture",
    description: "Email field with a join button.",
    icon: "inbox",
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      { key: "placeholder", label: "Field placeholder", type: "text" },
      { key: "ctaLabel", label: "Button label", type: "text" },
    ],
    defaults: {
      title: "Ready to watch?",
      subtitle: "Enter your email to create or restart your membership.",
      placeholder: "Email address",
      ctaLabel: "Get started",
    },
  },
];

export const SECTION_MAP: Record<SectionType, SectionDefinition> = Object.fromEntries(
  SECTION_LIBRARY.map((definition) => [definition.type, definition]),
) as Record<SectionType, SectionDefinition>;

let counter = 0;

/** Builds a new section, pre-filled with the type's defaults. */
export function createSection(type: SectionType): LandingSection {
  const definition = SECTION_MAP[type];
  counter += 1;
  return {
    id: `sec_${Date.now().toString(36)}_${counter}`,
    type,
    name: definition.label,
    visible: true,
    props: structuredClone(definition.defaults),
  };
}
