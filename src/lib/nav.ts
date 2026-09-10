import type { IconName } from "@/components/ui/Icon";

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  /** Tint of the row's icon chip — how a dense nav stays scannable. */
  color: string;
  /** Shown as a small chip on the right of the row. */
  tag?: string;
}

export interface NavSection {
  id: string;
  /** Small uppercase heading above the group. Omitted for the top block. */
  label?: string;
  items: NavItem[];
}

/** Sidebar structure — flat sections, like the reference dashboard. */
export const NAV: NavSection[] = [
  {
    id: "audience",
    label: "Audience",
    items: [{ label: "Users", href: "/users", icon: "users", color: "#0d9488" }],
  },
  {
    id: "catalogue",
    label: "Catalogue",
    items: [
      { label: "Content library", href: "/content", icon: "film", color: "#0369a1" },
      { label: "Upload content", href: "/content/upload", icon: "upload", color: "#0d9488" },
      /*
       * "Video files" (/videos) is hidden: a title's videos are managed from the
       * upload wizard, and the raw file list only invited confusion — one
       * submission stores a film and a trailer, which read as a duplicate there.
       * The page and its API are untouched; the upload dock still links to it,
       * and putting the line back restores it to the sidebar.
       */
    ],
  },
  {
    id: "site",
    label: "Website",
    items: [{ label: "Landing page", href: "/landing", icon: "globe", color: "#7c3aed" }],
  },
  {
    id: "organisation",
    label: "My organisation",
    items: [
      { label: "Team members", href: "/organisation/users", icon: "users", color: "#b45309" },
      { label: "Settings", href: "/organisation/settings", icon: "settings", color: "#475569" },
      { label: "Plan & billing", href: "/organisation/billing", icon: "billing", color: "#047857" },
    ],
  },
];

export const APP_VERSION = "1.0.0";
