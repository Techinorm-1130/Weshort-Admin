"use client";

import { useId, useState } from "react";
import type { SeriesPoint } from "@/types";

/* One palette for every chart so the dashboard reads as a single system. */
export const CHART_COLORS = ["#e50914", "#2f6bff", "#38bdf8", "#ffffff", "#ffb020", "#7c5cff", "#3ddc84"];

/* -------------------------------------------------------------------------- */
/*                                  helpers                                   */
/* -------------------------------------------------------------------------- */

/** Catmull-Rom → cubic bézier, so the area/line charts curve like the reference. */
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function scale(data: SeriesPoint[], w: number, h: number, pad = 0) {
  const values = data.map((d) => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  return data.map((d, i) => ({
    x: (i / Math.max(1, data.length - 1)) * w,
    y: h - pad - ((d.value - min) / span) * (h - pad * 2),
  }));
}

/* -------------------------------------------------------------------------- */
/*                                 area chart                                 */
/* -------------------------------------------------------------------------- */

export function AreaChart({
  data, color = "#2f80ed", height = 90, showDots = false, strokeWidth = 2, className = "",
}: {
  data: SeriesPoint[];
  color?: string;
  height?: number;
  showDots?: boolean;
  strokeWidth?: number;
  className?: string;
}) {
  const gid = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);
  const W = 300;
  const H = height;
  const pad = showDots ? 10 : 4;
  const points = scale(data, W, H, pad);
  const line = smoothPath(points);
  const area = `${line} L ${W} ${H} L 0 ${H} Z`;

  return (
    <div className={`relative w-full ${className}`} style={{ height }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-full w-full overflow-visible"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`area-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.45" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={area} fill={`url(#area-${gid})`} />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          className="animate-draw"
        />

        {showDots
          ? points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={hover === i ? 5 : 3.5}
                fill="#121214"
                stroke={color}
                strokeWidth={2.5}
                vectorEffect="non-scaling-stroke"
                onMouseEnter={() => setHover(i)}
                className="cursor-pointer transition-all"
              />
            ))
          : null}

        {/* invisible hit areas so the tooltip works on a dense series */}
        {data.map((_, i) => (
          <rect
            key={`hit-${i}`}
            x={(i / data.length) * W}
            y={0}
            width={W / data.length}
            height={H}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
      </svg>

      {hover !== null ? (
        <span
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-xl bg-surface-3 px-3 py-2 text-xs shadow-[var(--shadow-pop)]"
          style={{ left: `${(hover / Math.max(1, data.length - 1)) * 100}%`, top: `${(points[hover].y / H) * 100}%` }}
        >
          <span className="block font-semibold text-ink">{data[hover].value}</span>
          <span className="block text-muted">{data[hover].label}</span>
        </span>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 bar chart                                  */
/* -------------------------------------------------------------------------- */

export function BarChart({
  data, colors = ["#f5a524", "#17c1e8"], unit = "", height = 260, ticks = 5, rounded = true, gap = 6,
}: {
  data: SeriesPoint[];
  /** Cycled per bar — two colours reproduce the alternating look of the reference. */
  colors?: string[];
  unit?: string;
  height?: number;
  ticks?: number;
  rounded?: boolean;
  gap?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = niceStep(max, ticks - 1);
  const ceiling = step * (ticks - 1);
  const lines = Array.from({ length: ticks }, (_, i) => Math.round(step * i * 100) / 100);

  return (
    <div className="w-full">
      <div className="flex" style={{ height }}>
        <div className="flex w-12 shrink-0 flex-col-reverse justify-between pr-3 text-right text-[11px] text-muted">
          {lines.map((v) => (
            <span key={v} className="leading-none">
              {v}
            </span>
          ))}
        </div>

        <div className="relative flex-1">
          {lines.map((v, i) => (
            <span
              key={v}
              className="absolute inset-x-0 border-t border-line"
              style={{ bottom: `${(i / (ticks - 1)) * 100}%` }}
            />
          ))}

          <div className="absolute inset-0 flex items-end" style={{ gap }}>
            {data.map((d, i) => (
              <div
                key={d.label}
                className="group relative flex h-full flex-1 items-end"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                <div
                  className={`w-full animate-grow-y transition-opacity ${rounded ? "rounded-lg" : ""} ${
                    hover !== null && hover !== i ? "opacity-45" : "opacity-100"
                  }`}
                  style={{
                    height: `${Math.max(1, (d.value / ceiling) * 100)}%`,
                    background: colors[i % colors.length],
                  }}
                />
                {hover === i ? (
                  <span className="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-xl bg-surface-3 px-3 py-2 text-xs shadow-[var(--shadow-pop)]">
                    <span className="block font-semibold text-ink">
                      {d.value}
                      {unit ? ` ${unit}` : ""}
                    </span>
                    <span className="block text-muted">{d.label}</span>
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="ml-12 mt-2.5 flex text-[11px] text-muted" style={{ gap }}>
        {data.map((d) => (
          <span key={d.label} className="flex-1 truncate text-center">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Rounds an axis step to a readable 1 / 2 / 2.5 / 5 × 10ⁿ value. */
function niceStep(max: number, steps: number): number {
  const raw = max / steps;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  return nice * mag;
}

/* -------------------------------------------------------------------------- */
/*                                donut chart                                 */
/* -------------------------------------------------------------------------- */

export function DonutChart({
  segments, size = 220, thickness = 26, centerLabel, centerValue, gradient, legend = true, rounded = false,
}: {
  segments: { label: string; value: number; color?: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
  /** Paints the first segment with a two-stop gradient, like the reference donut. */
  gradient?: [string, string];
  legend?: boolean;
  rounded?: boolean;
}) {
  const gid = useId().replace(/:/g, "");
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  const arcs = segments.reduce<{ length: number; offset: number }[]>((acc, seg) => {
    const previous = acc[acc.length - 1];
    const start = previous ? previous.offset + previous.length : 0;
    acc.push({ length: (seg.value / total) * circumference, offset: start });
    return acc;
  }, []);

  return (
    <div className={`flex flex-wrap items-center justify-center ${legend ? "gap-8" : ""}`}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {gradient ? (
            <defs>
              <linearGradient id={`donut-${gid}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={gradient[0]} />
                <stop offset="100%" stopColor={gradient[1]} />
              </linearGradient>
            </defs>
          ) : null}

          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={thickness}
          />
          {segments.map((seg, i) => (
            <circle
              key={seg.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={
                i === 0 && gradient
                  ? `url(#donut-${gid})`
                  : (seg.color ?? CHART_COLORS[i % CHART_COLORS.length])
              }
              strokeWidth={thickness}
              strokeDasharray={`${arcs[i].length} ${circumference - arcs[i].length}`}
              strokeDashoffset={-arcs[i].offset}
              strokeLinecap={rounded ? "round" : "butt"}
            />
          ))}
        </svg>

        {centerValue ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-3xl font-bold text-ink">{centerValue}</span>
            {centerLabel ? <span className="text-xs text-muted">{centerLabel}</span> : null}
          </div>
        ) : null}
      </div>

      {legend ? (
        <ul className="space-y-2.5">
          {segments.map((seg, i) => (
            <li key={seg.label} className="flex items-center gap-3 text-sm">
              <span
                className="h-3.5 w-3.5 rounded-sm"
                style={{
                  background:
                    i === 0 && gradient
                      ? `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`
                      : (seg.color ?? CHART_COLORS[i % CHART_COLORS.length]),
                }}
              />
              <span className="text-muted-strong">{seg.label}</span>
              <span className="ml-auto pl-6 font-semibold text-ink">{seg.value}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              small bar strip                               */
/* -------------------------------------------------------------------------- */

/** Compact bars used inside the small widgets (Total profit, etc.). */
export function MiniBars({
  data, color = "#ec4899", height = 90,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(1, ...data);
  return (
    <div className="flex w-full items-end gap-1.5" style={{ height }}>
      {data.map((v, i) => (
        <span
          key={i}
          className="flex-1 animate-grow-y rounded-sm"
          style={{ height: `${(v / max) * 100}%`, background: color, opacity: 0.55 + (v / max) * 0.45 }}
        />
      ))}
    </div>
  );
}

export function Sparkline({ data, color = "#e50914", height = 34 }: { data: number[]; color?: string; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${height - ((v - min) / span) * height}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="h-8 w-full">
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
