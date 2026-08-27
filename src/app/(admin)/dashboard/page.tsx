"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { dashboardApi } from "@/lib/api/resources";
import { useQuery } from "@/lib/hooks";
import { formatMinutes, timeAgo } from "@/lib/format";
import type { ActivityEvent, DashboardStat } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import Icon, { type IconName } from "@/components/ui/Icon";
import Button, { Chip } from "@/components/ui/Button";
import { Delta, ErrorBox, ProgressBar, Skeleton } from "@/components/ui/Primitives";
import {
  CardDivider, CardFooter, CardHead, CardHeading, DotRating, EntityCard, IconTile,
  MicroLabel, OpenAction, RoundAction, SelectPill, TagChip,
} from "@/components/ui/EntityCard";
import { AreaChart, BarChart, DonutChart } from "@/components/charts/Charts";
import { DateInput } from "@/components/ui/Fields";
import { useToast } from "@/components/ui/Toast";

const STAT_ICONS: Record<DashboardStat["icon"], IconName> = {
  users: "users",
  user: "user",
  file: "file",
  gauge: "gauge",
};

/** Where the ↗ on each stat card goes. */
const STAT_LINKS: Record<string, string> = {
  activeUsers: "/projects",
  registeredUsers: "/projects",
  contents: "/medias",
  bandwidth: "/organisation/billing",
};

const EVENT_ICONS: Record<ActivityEvent["kind"], IconName> = {
  media: "film",
  user: "user",
  project: "store",
  encoding: "bolt",
  comment: "inbox",
};

const EVENT_COLORS: Record<ActivityEvent["kind"], string> = {
  media: "#e50914",
  user: "#3ddc84",
  project: "#2f6bff",
  encoding: "#ffb020",
  comment: "#38bdf8",
};

/** Round icon chip that sits in the header tab of the panels. */
function TabIcon({ icon, className }: { icon: IconName; className: string }) {
  return (
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${className}`}>
      <Icon name={icon} size={18} />
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const { data, loading, error, refresh } = useQuery(() => dashboardApi.get(), []);
  const [range, setRange] = useState({ from: "2026-08-01", to: "2026-08-27" });

  return (
    <>
      <PageHeader
        title="Dashboard"
        crumbs={[{ label: "Overview", icon: "layers" }]}
        subtitle="Everything happening across your projects, catalogue and encoding quota."
        actions={
          <Button icon="download" onClick={() => toast.success("Report export queued")}>
            Export report
          </Button>
        }
      />

      {error ? <ErrorBox message={error} onRetry={refresh} /> : null}

      <div className="mb-5 flex flex-wrap items-center gap-4">
        <h2 className="font-display text-xl font-bold tracking-tight text-ink">Key figures</h2>
        <span className="text-[13px] text-muted underline underline-offset-4">last 30 days</span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Chip active icon="chart">
            Overview
          </Chip>
          <Chip icon="film" onClick={() => router.push("/medias")}>
            Catalogue
          </Chip>
          <Chip icon="gauge" onClick={() => router.push("/encodings")}>
            Encoding
          </Chip>
        </div>
      </div>

      {/* ------------------------------ stat cards ---------------------------- */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {loading || !data
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[360px] rounded-[28px]" />)
          : data.stats.map((stat, i) => {
              const href = STAT_LINKS[stat.key] ?? "/medias";
              const filled = i === 0;
              const accent = filled ? "#0c0c0e" : stat.color;
              const trend = stat.series.map((point) => point.value);
              const last = trend[trend.length - 1] ?? 0;
              const peak = Math.max(...trend, 1);

              return (
                <EntityCard
                  key={stat.key}
                  highlight={filled ? "brand" : "none"}
                  onClick={() => router.push(href)}
                  head={
                    <CardHead
                      avatar={
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                          style={{
                            background: filled ? "rgba(12,12,14,0.08)" : `${stat.color}22`,
                            color: accent,
                          }}
                        >
                          <Icon name={STAT_ICONS[stat.icon]} size={18} />
                        </span>
                      }
                      title={stat.label}
                      subtitle={stat.hint}
                    />
                  }
                  actions={
                    <>
                      {typeof stat.delta === "number" ? <Delta value={stat.delta} /> : null}
                      <OpenAction onClick={() => router.push(href)} />
                    </>
                  }
                >
                  <CardHeading
                    titleClassName="text-[28px]"
                    tile={<IconTile icon={STAT_ICONS[stat.icon]} color={accent} />}
                    title={stat.value}
                    meta={
                      <>
                        <Icon name="clock" size={12} />
                        {stat.hint}
                      </>
                    }
                  />

                  <CardDivider />

                  <MicroLabel
                    note={
                      typeof stat.delta === "number" ? (
                        <span className={filled ? "" : stat.delta >= 0 ? "text-ok" : "text-danger"}>
                          {stat.delta >= 0 ? "+" : ""}
                          {stat.delta}% vs previous
                        </span>
                      ) : null
                    }
                  >
                    Trend
                  </MicroLabel>

                  <AreaChart data={stat.series} color={accent} height={64} />

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <TagChip icon="chart">peak {peak}</TagChip>
                    <DotRating value={Math.max(1, Math.round((last / peak) * 5))} color={accent} />
                  </div>

                  <p className="mb-2 mt-5 text-[12px] font-medium text-muted">Status</p>
                  <CardFooter>
                    <SelectPill
                      leading={
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-3">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ background: filled ? "#e50914" : stat.color }}
                          />
                        </span>
                      }
                      onClick={() => router.push(href)}
                    >
                      Live data
                    </SelectPill>
                    <RoundAction
                      icon="download"
                      label="Export"
                      onClick={() => toast.success(`${stat.label} exported`)}
                    />
                    <RoundAction icon="arrow-up-right" label="Open" solid onClick={() => router.push(href)} />
                  </CardFooter>
                </EntityCard>
              );
            })}
      </div>

      {/* --------------------------- bandwidth + plan ------------------------- */}
      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-12">
        <EntityCard
          className="xl:col-span-8"
          head={
            <CardHead
              avatar={<TabIcon icon="chart" className="bg-brand-soft text-brand" />}
              title="Bandwidth"
              subtitle="this billing period"
            />
          }
          actions={
            <>
              <RoundAction
                icon="download"
                label="Download CSV"
                size="sm"
                onClick={() => toast.success("Bandwidth CSV exported")}
              />
              <OpenAction onClick={() => router.push("/organisation/billing")} />
            </>
          }
        >
          <CardHeading
            tile={<IconTile icon="gauge" color="#e50914" />}
            title="How is my bandwidth used?"
            meta={data ? <>Total: {data.bandwidth.totalGb} GB</> : null}
          />

          <CardDivider />

          <MicroLabel
            note={
              <span className="flex items-center gap-2">
                <DateInput value={range.from} onChange={(v) => setRange((r) => ({ ...r, from: v }))} />
                <span className="text-muted">→</span>
                <DateInput value={range.to} onChange={(v) => setRange((r) => ({ ...r, to: v }))} />
              </span>
            }
          >
            Daily usage
          </MicroLabel>

          {loading || !data ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <BarChart data={data.bandwidth.series} colors={["#e50914"]} unit="GB" height={250} gap={4} />
          )}
        </EntityCard>

        <EntityCard
          className="xl:col-span-4"
          head={
            <CardHead
              avatar={<TabIcon icon="bolt" className="bg-accent-soft text-accent" />}
              title="Encoding plan"
              subtitle="minutes consumed"
            />
          }
          actions={<OpenAction onClick={() => router.push("/encodings")} />}
        >
          <CardHeading
            tile={<IconTile icon="gauge" color="#2f6bff" />}
            title="How is my plan used?"
            meta={<>this billing period</>}
          />

          <CardDivider />

          {loading || !data ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <>
              <div className="flex justify-center py-2">
                <DonutChart
                  size={180}
                  thickness={22}
                  rounded
                  legend={false}
                  gradient={["#ff5a63", "#e50914"]}
                  segments={[
                    { label: "Used", value: data.encodingQuota.usedMin },
                    { label: "Available", value: data.encodingQuota.availableMin, color: "rgba(255,255,255,0.08)" },
                  ]}
                  centerValue={formatMinutes(data.encodingQuota.usedMin)}
                  centerLabel="used"
                />
              </div>

              <MicroLabel
                note={<span className="text-muted">{formatMinutes(data.encodingQuota.availableMin)} left</span>}
              >
                Quota
              </MicroLabel>
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <TagChip icon="bolt">{formatMinutes(data.encodingQuota.usedMin)} used</TagChip>
                  <TagChip>{formatMinutes(data.encodingQuota.availableMin)} free</TagChip>
                </div>
                <DotRating
                  value={Math.max(
                    1,
                    Math.round(
                      (data.encodingQuota.usedMin /
                        (data.encodingQuota.usedMin + data.encodingQuota.availableMin)) *
                        5,
                    ),
                  )}
                />
              </div>

              <p className="mb-2 mt-5 text-[12px] font-medium text-muted">Status</p>
              <CardFooter>
                <SelectPill
                  leading={
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-3">
                      <span className="h-2.5 w-2.5 rounded-full bg-brand" />
                    </span>
                  }
                  onClick={() => router.push("/encodings")}
                >
                  Plan active
                </SelectPill>
                <RoundAction icon="billing" label="Billing" onClick={() => router.push("/organisation/billing")} />
                <RoundAction icon="bolt" label="Encodings" solid onClick={() => router.push("/encodings")} />
              </CardFooter>
            </>
          )}
        </EntityCard>
      </div>

      {/* -------------------------- catalogue + events ------------------------ */}
      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-12">
        <EntityCard
          className="xl:col-span-4"
          head={
            <CardHead
              avatar={<TabIcon icon="layers" className="bg-accent-soft text-accent" />}
              title="Catalogue"
              subtitle="contents by category"
            />
          }
          actions={<OpenAction onClick={() => router.push("/medias")} />}
        >
          <CardHeading tile={<IconTile icon="film" color="#2f6bff" />} title="Catalogue breakdown" />

          <CardDivider />

          {loading || !data ? (
            <Skeleton className="h-52 w-full" />
          ) : (
            <>
              <MicroLabel note={<span className="text-muted">{data.catalogue.length} categories</span>}>
                Distribution
              </MicroLabel>
              <ul className="space-y-4">
                {data.catalogue.map((row, i) => {
                  const max = Math.max(...data.catalogue.map((r) => r.value));
                  const tone = (["brand", "accent", "ok", "amber", "info"] as const)[i % 5];
                  return (
                    <li key={row.label}>
                      <div className="mb-2 flex items-center justify-between text-[13px]">
                        <span className="text-muted-strong">{row.label}</span>
                        <span className="font-semibold text-ink">{row.value}</span>
                      </div>
                      <ProgressBar value={(row.value / max) * 100} tone={tone} size="md" />
                    </li>
                  );
                })}
              </ul>

              <p className="mb-2 mt-5 text-[12px] font-medium text-muted">Status</p>
              <CardFooter>
                <SelectPill
                  leading={
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-3">
                      <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                    </span>
                  }
                  onClick={() => router.push("/medias")}
                >
                  Catalogue live
                </SelectPill>
                <RoundAction icon="plus" label="New media" solid onClick={() => router.push("/medias")} />
              </CardFooter>
            </>
          )}
        </EntityCard>

        <EntityCard
          className="xl:col-span-8"
          head={
            <CardHead
              avatar={<TabIcon icon="bell" className="bg-brand-soft text-brand" />}
              title="Activity"
              subtitle="catalogue, encoding and account"
            />
          }
          actions={
            <>
              <RoundAction icon="bolt" label="Refresh" size="sm" onClick={refresh} />
              <OpenAction onClick={() => router.push("/encodings")} />
            </>
          }
        >
          <CardHeading
            tile={<IconTile icon="inbox" color="#e50914" />}
            title="Latest events"
            meta={data ? <>{data.events.length} in the last days</> : null}
          />

          <CardDivider />

          {loading || !data ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <ul className="max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
              {data.events.map((event) => (
                <li
                  key={event.id}
                  className="flex items-start gap-3.5 rounded-[20px] bg-surface-2 p-4 transition hover:bg-surface-3"
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px]"
                    style={{ background: `${EVENT_COLORS[event.kind]}1f`, color: EVENT_COLORS[event.kind] }}
                  >
                    <Icon name={EVENT_ICONS[event.kind]} size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink">{event.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-[13px] text-muted">{event.description}</p>
                    <p className="mt-1.5 text-xs text-muted/70">
                      {event.actor} · {timeAgo(event.at)}
                    </p>
                  </div>
                  <RoundAction icon="arrow-up-right" label="Open" size="sm" />
                </li>
              ))}
            </ul>
          )}
        </EntityCard>
      </div>
    </>
  );
}
