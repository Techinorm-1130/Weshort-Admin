"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import Icon, { type IconName } from "./Icon";

export interface Crumb {
  label: string;
  href?: string;
  icon?: IconName;
}

export interface ViewTab {
  id: string;
  label: string;
  icon?: IconName;
  /** Glyph tint, so a row of views reads at a glance. */
  color?: string;
  href?: string;
  onSelect?: () => void;
}

export interface HeaderStat {
  label: string;
  value: ReactNode;
  delta?: ReactNode;
}

/**
 * Workspace page header: breadcrumb, title row with actions, then the row of
 * views for this page — the strip that keeps a dense tool navigable.
 */
export default function PageHeader({
  title, count, subtitle, crumbs, actions, backHref, stats, tabs, activeTab, icon,
  iconColor = "var(--brand)",
}: {
  title: ReactNode;
  count?: number;
  subtitle?: ReactNode;
  crumbs?: Crumb[];
  actions?: ReactNode;
  backHref?: string;
  stats?: HeaderStat[];
  tabs?: ViewTab[];
  activeTab?: string;
  icon?: IconName;
  /** Tint for the title icon; defaults to the brand red. */
  iconColor?: string;
}) {
  return (
    <header className="mb-5">
      {crumbs?.length ? (
        <nav className="mb-2 flex flex-wrap items-center gap-1.5 text-[12px] text-muted">
          {crumbs.map((crumb, i) => (
            <span key={crumb.label} className="flex items-center gap-1.5">
              {crumb.icon ? <Icon name={crumb.icon} size={12} /> : null}
              {crumb.href ? (
                <Link href={crumb.href} className="transition hover:text-ink">
                  {crumb.label}
                </Link>
              ) : (
                <span>{crumb.label}</span>
              )}
              {i < crumbs.length - 1 ? <span className="text-muted/60">/</span> : null}
            </span>
          ))}
        </nav>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {backHref ? (
          <Link
            href={backHref}
            aria-label="Back"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-ink"
          >
            <Icon name="arrow-left" size={17} />
          </Link>
        ) : null}

        {icon ? (
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={
              iconColor
                ? { background: `${iconColor}1f`, color: iconColor }
                : undefined
            }
          >
            <Icon name={icon} size={17} />
          </span>
        ) : null}

        <h1 className="font-display text-[22px] font-bold leading-tight tracking-tight text-ink">
          {title}
          {typeof count === "number" ? (
            <span className="ml-2 text-[15px] font-semibold text-muted">{count}</span>
          ) : null}
        </h1>

        {stats?.length ? (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pl-2">
            {stats.map((stat) => (
              <span key={stat.label} className="flex items-baseline gap-1.5">
                <span className="font-display text-[17px] font-bold tabular-nums text-ink">{stat.value}</span>
                <span className="text-[12px] text-muted">{stat.label}</span>
                {stat.delta}
              </span>
            ))}
          </div>
        ) : null}

        {actions ? <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>

      {subtitle ? <div className="mt-1.5 text-[13px] text-muted">{subtitle}</div> : null}

      {tabs?.length ? (
        <div className="mt-3 flex items-center gap-1 overflow-x-auto border-b border-border">
          {tabs.map((tab) => {
            const active = tab.id === activeTab;
            const content = (
              <>
                {tab.icon ? (
                  <span
                    className="flex h-[18px] w-[18px] items-center justify-center rounded-[5px]"
                    style={
                      tab.color
                        ? { background: `${tab.color}1f`, color: tab.color }
                        : undefined
                    }
                  >
                    <Icon name={tab.icon} size={12} />
                  </span>
                ) : null}
                {tab.label}
              </>
            );
            return tab.href ? (
              <Link key={tab.id} href={tab.href} data-active={active} className="view-tab">
                {content}
              </Link>
            ) : (
              <button key={tab.id} onClick={tab.onSelect} data-active={active} className="view-tab">
                {content}
              </button>
            );
          })}
        </div>
      ) : null}
    </header>
  );
}
