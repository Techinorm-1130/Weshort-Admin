import Link from "next/link";
import type { ReactNode } from "react";
import Icon, { type IconName } from "./Icon";

export interface Crumb {
  label: string;
  href?: string;
  icon?: IconName;
}

export interface HeaderStat {
  label: string;
  value: ReactNode;
  delta?: ReactNode;
}

/**
 * Oversized uppercase title with a round back button, the page actions inline,
 * and the key figures spelled out beside it — the reference header anatomy.
 */
export default function PageHeader({
  title, count, subtitle, crumbs, actions, backHref, stats,
}: {
  title: ReactNode;
  count?: number;
  subtitle?: ReactNode;
  crumbs?: Crumb[];
  actions?: ReactNode;
  backHref?: string;
  stats?: HeaderStat[];
}) {
  return (
    <header className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex min-w-0 items-center gap-5">
        {backHref ? (
          <Link
            href={backHref}
            aria-label="Back"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface text-muted ring-1 ring-border transition hover:text-ink"
          >
            <Icon name="arrow-left" size={20} />
          </Link>
        ) : null}

        <div className="min-w-0">
          <h1 className="display-title truncate text-[34px] text-ink sm:text-[42px]">
            {title}
            {typeof count === "number" ? (
              <span className="ml-3 align-middle text-[20px] font-semibold normal-case tracking-normal text-muted">
                ({count})
              </span>
            ) : null}
          </h1>

          {crumbs?.length || subtitle ? (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
              {crumbs?.map((crumb, i) => (
                <span key={crumb.label} className="flex items-center gap-2">
                  {crumb.icon ? <Icon name={crumb.icon} size={14} /> : null}
                  {crumb.href ? (
                    <Link href={crumb.href} className="transition hover:text-ink">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                  {i < (crumbs.length ?? 0) - 1 ? (
                    <Icon name="chevron-right" size={12} className="text-muted/60" />
                  ) : null}
                </span>
              ))}
              {crumbs?.length && subtitle ? <span className="h-3.5 w-px bg-border" /> : null}
              {subtitle}
            </div>
          ) : null}
        </div>

        {actions ? <div className="hidden shrink-0 items-center gap-2.5 xl:flex">{actions}</div> : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-9 gap-y-4">
        {stats?.map((stat) => (
          <div key={stat.label} className="flex items-start gap-2">
            <span className="font-display text-[32px] font-bold leading-none tracking-tight text-ink">
              {stat.value}
            </span>
            <span className="flex flex-col gap-1">
              {stat.delta}
              <span className="text-[13px] text-muted">{stat.label}</span>
            </span>
          </div>
        ))}

        {actions ? <div className="flex flex-wrap items-center gap-2.5 xl:hidden">{actions}</div> : null}
      </div>
    </header>
  );
}
