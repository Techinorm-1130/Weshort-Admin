"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { timeAgo } from "@/lib/format";
import Icon, { type IconName } from "@/components/ui/Icon";
import { Dropdown } from "@/components/ui/Overlays";
import { useToast } from "@/components/ui/Toast";
import ThemeToggle from "./ThemeToggle";
import { LogoBadge } from "./Logo";

function HeaderButton({
  icon, label, dot, onClick,
}: {
  icon: IconName;
  label: string;
  dot?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-ink"
    >
      <Icon name={icon} size={16} />
      {dot ? <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-danger" /> : null}
    </button>
  );
}

/** Slim workspace header: centred search, quiet actions, account menu. */
export default function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [search, setSearch] = useState("");

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-border bg-topbar px-3">
      <button
        onClick={onOpenMenu}
        aria-label="Open sidebar"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-ink lg:hidden"
      >
        <Icon name="menu" size={17} />
      </button>

      <span className="lg:hidden">
        <LogoBadge size={30} radius={8} />
      </span>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (search.trim()) router.push(`/users?search=${encodeURIComponent(search.trim())}`);
        }}
        className="relative mx-auto w-full max-w-md"
      >
        <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users"
          className="h-8 w-full rounded-lg border border-border bg-surface-2 pl-8 pr-16 text-[13px] text-ink placeholder:text-muted/70 outline-none transition-[border-color,box-shadow,background-color] duration-150 hover:border-border-strong focus:border-accent focus:bg-surface focus:ring-[3px] focus:ring-accent/15"
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted sm:block">
          Ctrl K
        </kbd>
      </form>

      <div className="ml-auto flex items-center gap-0.5">
        <ThemeToggle />
        <HeaderButton icon="help" label="Help" onClick={() => toast.info("Docs are on the way")} />
        <HeaderButton icon="bell" label="Notifications" dot onClick={() => toast.info("No new notification")} />

        <Dropdown
          width="w-56"
          trigger={({ toggle }) => (
            <button
              onClick={toggle}
              aria-label="Account"
              className="ml-1 flex items-center gap-2 rounded-lg p-1 transition hover:bg-surface-2"
            >
              <span className="grad-brand flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white">
                WS
              </span>
            </button>
          )}
          items={[
            { label: "Team members", icon: "users", onSelect: () => router.push("/organisation/users") },
            { label: "Organisation settings", icon: "settings", onSelect: () => router.push("/organisation/settings") },
            { label: "Plan and billing", icon: "billing", onSelect: () => router.push("/organisation/billing") },
            {
              label: "Log out",
              icon: "logout",
              tone: "danger",
              onSelect: () => {
                window.localStorage.removeItem("weshort.admin.token");
                router.push("/login");
              },
            },
          ]}
        />
      </div>
    </header>
  );
}

export function LastUpdated({ at }: { at: string }) {
  return <span className="text-xs text-muted">Updated {timeAgo(at)}</span>;
}
