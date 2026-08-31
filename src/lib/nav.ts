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
    id: "audience",
    label: "Audience",
    items: [{ label: "Users", href: "/users", icon: "users" }],
  },
  {
    id: "catalogue",
    label: "Catalogue",
    items: [{ label: "Upload content", href: "/content/upload", icon: "upload" }],
  },
  {
    id: "site",
    label: "Website",
    items: [{ label: "Landing page", href: "/landing", icon: "globe" }],
  },
  {
    id: "organisation",
    label: "My organisation",
    items: [
      { label: "Team members", href: "/organisation/users", icon: "users" },
      { label: "Settings", href: "/organisation/settings", icon: "settings" },
      { label: "Plan & billing", href: "/organisation/billing", icon: "billing" },
    ],
  },
];

export const APP_VERSION = "1.0.0";
