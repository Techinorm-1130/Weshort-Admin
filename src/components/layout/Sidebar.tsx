"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { APP_VERSION, NAV } from "@/lib/nav";
import { orgApi, viewerApi } from "@/lib/api/resources";
import { useQuery } from "@/lib/hooks";
import Icon from "@/components/ui/Icon";
import { Dropdown } from "@/components/ui/Overlays";
import Logo, { LogoBadge } from "./Logo";

/**
 * Detailed nav column: workspace switcher, then the grouped sections. Compact
 * rows and small type keep it dense without feeling busy.
 */
export default function Sidebar({
  open, onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: org } = useQuery(() => orgApi.get(), []);
  const { data: stats } = useQuery(() => viewerApi.stats(), []);
  const [collapsed, setCollapsed] = useState<string[]>([]);

  const toggleSection = (id: string) =>
    setCollapsed((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const logout = () => {
    window.localStorage.removeItem("weshort.admin.token");
    router.push("/login");
  };

  return (
    <>
      {open ? <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} /> : null}

      <aside
        className={`sidebar-surface fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col transition-transform lg:left-[68px] lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* workspace switcher */}
        <div className="flex items-center gap-2 px-2 py-3">
          <Dropdown
            align="left"
            width="w-56"
            trigger={({ toggle }) => (
              <button
                onClick={toggle}
                className="flex w-full min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-[var(--sidebar-hover)]"
              >
                <LogoBadge size={26} radius={7} />
                <span className="min-w-0 flex-1 truncate text-left text-[13px] font-semibold text-ink">
                  {org?.name ?? "WeShort"}
                </span>
                <Icon name="chevron-down" size={14} className="shrink-0 text-muted" />
              </button>
            )}
            items={[
              { label: "Organisation settings", icon: "settings", onSelect: () => router.push("/organisation/settings") },
              { label: "Plan and billing", icon: "billing", onSelect: () => router.push("/organisation/billing") },
              { label: "Log out", icon: "logout", tone: "danger", onSelect: logout },
            ]}
          />

          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-[var(--sidebar-hover)] hover:text-ink lg:hidden"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* nav */}
        <nav className="flex-1 overflow-y-auto px-2 pb-3">
          {NAV.map((section) => {
            const hidden = collapsed.includes(section.id);
            return (
              <div key={section.id} className="mb-3">
                {section.label ? (
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="nav-caption mb-1 flex h-7 w-full items-center gap-1.5 transition hover:text-ink"
                  >
                    <Icon name="chevron-down" size={12} className={`transition ${hidden ? "-rotate-90" : ""}`} />
                    {section.label}
                  </button>
                ) : null}

                {hidden ? null : (
                  <ul className="space-y-0.5">
                    {section.items.map((item) => {
                      const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                      const badge = item.href === "/users" ? stats?.total : undefined;
                      return (
                        <li key={item.href}>
                          <Link href={item.href} onClick={onClose} data-active={active} className="nav-row">
                            <span
                              className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[6px]"
                              style={{ background: `${item.color}1f`, color: item.color }}
                            >
                              <Icon name={item.icon} size={13} />
                            </span>
                            <span className="min-w-0 flex-1 truncate">{item.label}</span>
                            {badge ? (
                              <span className="rounded-full bg-surface-3 px-1.5 py-0.5 text-[10px] font-semibold text-muted-strong">
                                {badge}
                              </span>
                            ) : null}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        {/* footer */}
        <div className="border-t border-[var(--sidebar-border)] px-3 py-3">
          <Link href="/organisation/settings" className="nav-row" onClick={onClose}>
            <Icon name="help" size={16} className="text-muted" />
            <span className="flex-1">Help and docs</span>
          </Link>
          <div className="mt-2.5 flex items-center justify-between gap-2 px-2">
            <Logo height={16} showCms={false} />
            <span className="text-[10px] text-muted">v{APP_VERSION}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
