import type { IconName } from "@/components/ui/Icon";

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
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
    id: "main",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "home" },
      { label: "Projects", href: "/projects", icon: "store" },
    ],
  },
  {
    id: "catalogue",
    label: "Catalogue",
    items: [
      { label: "Medias", href: "/medias", icon: "film" },
      { label: "FAST channels", href: "/fast-channels", icon: "tv" },
      { label: "External contributions", href: "/contributions", icon: "inbox" },
      { label: "Casting", href: "/casting", icon: "user-circle" },
    ],
  },
  {
    id: "encoding",
    label: "Encoding",
    items: [
      { label: "Encodings", href: "/encodings", icon: "gauge" },
      { label: "Encoding profiles", href: "/encoding-profiles", icon: "sliders" },
    ],
  },
  {
    id: "organisation",
    label: "My organisation",
    items: [
      { label: "Users", href: "/organisation/users", icon: "users" },
      { label: "Settings", href: "/organisation/settings", icon: "settings" },
      { label: "Plan & billing", href: "/organisation/billing", icon: "billing" },
    ],
  },
];

export const APP_VERSION = "1.0.0";
