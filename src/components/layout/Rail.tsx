"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "@/components/ui/Icon";
import { LogoBadge } from "./Logo";

interface RailItem {
  label: string;
  href: string;
  icon: IconName;
  /** Extra path prefixes that also light this item up. */
  match?: string[];
}

/** Top-level areas of the workspace — icon + label, like the ClickUp rail. */
const RAIL: RailItem[] = [
  { label: "Users", href: "/users", icon: "users" },
  { label: "Content", href: "/content/upload", icon: "upload" },
  { label: "Site", href: "/landing", icon: "globe" },
  { label: "Org", href: "/organisation/users", icon: "org", match: ["/organisation"] },
];

export default function Rail({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();

  const isActive = (item: RailItem) =>
    pathname.startsWith(item.href) || (item.match ?? []).some((m) => pathname.startsWith(m));

  return (
    <nav className="rail-surface fixed inset-y-0 left-0 z-40 hidden w-[68px] flex-col items-center py-3 lg:flex">
      <Link
        href="/users"
        aria-label="WeShort admin"
        className="mb-3 transition hover:scale-105"
      >
        <LogoBadge size={40} radius={12} className="shadow-sm" />
      </Link>

      <ul className="flex flex-1 flex-col items-center gap-1 pt-2">
        {RAIL.map((item) => {
          const active = isActive(item);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                title={item.label}
                className={`flex w-[58px] flex-col items-center gap-1 rounded-[10px] px-1 py-2 text-[10px] font-medium transition ${
                  active
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:bg-white/12 hover:text-white"
                }`}
              >
                <Icon name={item.icon} size={19} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <button
        onClick={onOpenMenu}
        title="Toggle sidebar"
        aria-label="Toggle sidebar"
        className="flex h-9 w-9 items-center justify-center rounded-[10px] text-white/70 transition hover:bg-white/12 hover:text-white"
      >
        <Icon name="menu" size={18} />
      </button>
    </nav>
  );
}
