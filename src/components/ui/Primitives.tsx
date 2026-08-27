import type { ReactNode } from "react";
import type { EntityStatus } from "@/types";
import Icon, { type IconName } from "./Icon";

/* --------------------------------- card --------------------------------- */

export function Card({
  children, className = "", padded = true, tone = "light",
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  /** "ink" renders the black panel used for highlight cards. */
  tone?: "light" | "ink";
}) {
  const base = tone === "ink" ? "bar-ink rounded-[26px]" : "card-premium";
  return <section className={`${base} ${padded ? "p-6" : ""} ${className}`}>{children}</section>;
}

export function CardTitle({
  title, subtitle, action, className = "",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`mb-5 flex items-start justify-between gap-4 ${className}`}>
      <div>
        <h2 className="font-display text-[17px] font-bold tracking-tight text-ink">{title}</h2>
        {subtitle ? <p className="mt-1 text-[13px] text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  );
}

/* ------------------------------- status dot ------------------------------ */

const STATUS_COLORS: Record<EntityStatus, string> = {
  online: "bg-ok",
  draft: "bg-warn",
  processing: "bg-accent",
  error: "bg-danger",
  offline: "bg-ink/25",
};

export const STATUS_LABELS: Record<EntityStatus, string> = {
  online: "Online",
  draft: "Draft",
  processing: "Processing",
  error: "Error",
  offline: "Offline",
};

export function StatusDot({ status, withLabel = false }: { status: EntityStatus; withLabel?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2" title={STATUS_LABELS[status]}>
      <span className={`h-2.5 w-2.5 rounded-full ${STATUS_COLORS[status]}`} />
      {withLabel ? <span className="text-[13px] text-muted-strong">{STATUS_LABELS[status]}</span> : null}
    </span>
  );
}

/* --------------------------------- badge -------------------------------- */

type Tone = "neutral" | "brand" | "accent" | "ok" | "warn" | "danger" | "info" | "ink";

const TONES: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted-strong",
  brand: "bg-brand-soft text-brand",
  accent: "bg-accent-soft text-accent",
  ok: "bg-ok/12 text-ok",
  warn: "bg-warn/12 text-warn",
  danger: "bg-danger/12 text-danger",
  info: "bg-accent-soft text-accent",
  ink: "bg-ink text-on-ink",
};

export function Badge({
  children, tone = "neutral", icon,
}: {
  children: ReactNode;
  tone?: Tone;
  icon?: IconName;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${TONES[tone]}`}>
      {icon ? <Icon name={icon} size={12} /> : null}
      {children}
    </span>
  );
}

/* -------------------------------- avatar -------------------------------- */

export function Avatar({
  name, initials, color = "#2563ff", size = 34, ring = true,
}: {
  name?: string;
  initials: string;
  color?: string;
  size?: number;
  ring?: boolean;
}) {
  return (
    <span
      title={name}
      style={{ width: size, height: size, background: color }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full text-[11px] font-bold uppercase text-white ${
        ring ? "ring-2 ring-white" : ""
      }`}
    >
      {initials}
    </span>
  );
}

/* ------------------------------- progress ------------------------------- */

const PROGRESS_FILLS = {
  brand: "grad-brand",
  accent: "grad-accent",
  ink: "grad-ink",
  ok: "bg-ok",
  info: "bg-accent",
  amber: "bg-warn",
  pink: "grad-brand",
} as const;

export function ProgressBar({
  value, tone = "ink", size = "sm",
}: {
  value: number;
  tone?: keyof typeof PROGRESS_FILLS;
  size?: "sm" | "md";
}) {
  return (
    <div className={`${size === "md" ? "h-2.5" : "h-1.5"} w-full overflow-hidden rounded-full bg-surface-3`}>
      <div
        className={`h-full rounded-full ${PROGRESS_FILLS[tone]} transition-all`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/** Label + value + bar. */
export function ProgressRow({
  label, value, percent, tone = "ink",
}: {
  label: string;
  value: string | number;
  percent: number;
  tone?: keyof typeof PROGRESS_FILLS;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-[13px]">
        <span className="font-medium text-muted-strong">{label}</span>
        <span className="text-muted">{value}</span>
      </div>
      <ProgressBar value={percent} tone={tone} size="md" />
    </div>
  );
}

/* ------------------------------- skeletons ------------------------------ */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-2xl ${className}`} />;
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-line">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-6 py-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={`h-4 ${c === 1 ? "flex-1" : "w-20"}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ empty state ----------------------------- */

export function EmptyState({
  title, description, icon = "film", action,
}: {
  title: string;
  description?: string;
  icon?: IconName;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-surface-2 text-ink/25">
        <Icon name={icon} size={40} />
      </div>
      <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

/* ------------------------------- delta pill ----------------------------- */

/** "+5" chip sitting next to the big numbers, as in the reference header. */
export function Delta({ value, className = "" }: { value: number; className?: string }) {
  const up = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${
        up ? "bg-ok/12 text-ok" : "bg-danger/12 text-danger"
      } ${className}`}
    >
      <Icon name="chevron-down" size={11} className={up ? "rotate-180" : ""} />
      {up ? "+" : ""}
      {value}
    </span>
  );
}

/* ------------------------------- error box ------------------------------ */

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl bg-danger/10 px-5 py-3.5 text-sm text-danger">
      <span className="flex items-center gap-2">
        <Icon name="close" size={16} /> {message}
      </span>
      {onRetry ? (
        <button onClick={onRetry} className="font-semibold underline underline-offset-2">
          Retry
        </button>
      ) : null}
    </div>
  );
}
