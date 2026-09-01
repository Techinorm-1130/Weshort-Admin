"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { timeAgo } from "@/lib/format";
import Icon, { type IconName } from "@/components/ui/Icon";
import { Dropdown } from "@/components/ui/Overlays";
import { useToast } from "@/components/ui/Toast";

/** Round control used inside and beside the floating bar. */
function RoundButton({
  icon, label, href, badge, dot, onClick, tone = "plain",
}: {
  icon: IconName;
  label: string;
  href?: string;
  badge?: number;
  dot?: boolean;
  onClick?: () => void;
  tone?: "plain" | "ink" | "brand";
}) {
  const skin =
    tone === "ink"
      ? "bg-ink text-on-ink hover:bg-ink-soft"
      : tone === "brand"
        ? "bg-brand text-white hover:bg-brand-hover"
        : "bg-surface-2 text-muted hover:text-ink";

  const content = (
    <>
      <Icon name={icon} size={18} />
      {badge ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      ) : null}
      {dot && !badge ? (
        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-brand" />
      ) : null}
    </>
  );

  const className = `relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${skin}`;

  return href ? (
    <Link href={href} title={label} aria-label={label} className={className}>
      {content}
    </Link>
  ) : (
    <button title={label} aria-label={label} onClick={onClick} className={className}>
      {content}
    </button>
  );
}

export default function Topbar({
  onOpenMenu, onToggleCollapse,
}: {
  onOpenMenu: () => void;
  onToggleCollapse: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [search, setSearch] = useState("");

  return (
    <div className="sticky top-0 z-30 bg-background/90 px-4 py-4 backdrop-blur lg:px-6">
      <div className="flex items-center gap-3">
        {/* the floating pill bar */}
        <div className="bar-ink flex h-16 min-w-0 flex-1 items-center gap-3 rounded-full px-3">
          <button
            onClick={() => {
              onOpenMenu();
              onToggleCollapse();
            }}
            aria-label="Toggle menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted transition hover:text-ink"
          >
            <Icon name="menu" size={18} />
          </button>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (search.trim()) router.push(`/users?search=${encodeURIComponent(search.trim())}`);
            }}
            className="relative min-w-0 flex-1"
          >
            <Icon name="search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users"
              className="h-10 w-full rounded-full bg-surface-2 pl-11 pr-4 text-sm text-ink placeholder:text-muted outline-none transition focus:bg-surface-3"
            />
          </form>

          <RoundButton icon="bell" label="Notifications" dot onClick={() => toast.info("No new notification")} />
          <RoundButton icon="upload" label="Upload content" href="/content/upload" tone="ink" />
        </div>

        {/* account, outside the bar like the reference avatar */}
        <Dropdown
          width="w-60"
          trigger={({ toggle }) => (
            <button
              onClick={toggle}
              aria-label="Account"
              className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-surface ring-1 ring-border transition hover:ring-border-strong"
            >
              <span className="grad-brand flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-bold text-white">
                WS
              </span>
              <span className="absolute bottom-3 right-3 h-3 w-3 rounded-full border-2 border-surface bg-ok" />
            </button>
          )}
          items={[
            { label: "Organisation settings", icon: "settings", onSelect: () => router.push("/organisation/settings") },
            { label: "Users", icon: "users", onSelect: () => router.push("/organisation/users") },
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
    </div>
  );
}

export function LastUpdated({ at }: { at: string }) {
  return <span className="text-xs text-muted">Updated {timeAgo(at)}</span>;
}
