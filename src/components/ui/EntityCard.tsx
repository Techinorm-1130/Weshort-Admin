"use client";

import type { ReactNode } from "react";
import type { EntityStatus } from "@/types";
import Icon, { type IconName } from "./Icon";
import { Avatar, StatusDot, STATUS_LABELS } from "./Primitives";

/* ---------------------------------------------------------------------------
 * The card anatomy from the design reference, as reusable pieces:
 *
 *   ┌───────────────────────────────────────────────┐
 *   │ (avatar)                          (↗) (⋯)     │  CardHead
 *   │ Big bold title                                │  CardHeading
 *   │ muted sub-line                                │
 *   │ ─────────────────────────────────────────────  │
 *   │ Source            🔥 Hot client               │  MicroLabel + note
 *   │ [chip] [chip]              ● ● ● ○ ○          │  TagChip + DotRating
 *   │ Status                                        │
 *   │ [ (a) Call scheduled     ⌄ ]   (✉) (▣)        │  SelectPill + RoundAction
 *   └───────────────────────────────────────────────┘
 * ------------------------------------------------------------------------ */

export function EntityCard({
  children, onClick, highlight = "none", head, actions, className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  /** Solid accent fill — the highlighted tile in the reference grid. */
  highlight?: "none" | "brand" | "accent";
  /** Content of the header tab (avatar + name). Omit for a plain panel. */
  head?: ReactNode;
  /** Round buttons that float in the notch beside the tab. */
  actions?: ReactNode;
  className?: string;
}) {
  const fill = highlight === "brand" ? "is-brand" : highlight === "accent" ? "is-accent" : "";

  return (
    <article
      onClick={onClick}
      className={`card-shell group ${fill} ${head ? "" : "no-tab"} transition duration-300 hover:-translate-y-1.5 ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      {head || actions ? (
        <div className="flex w-full items-start">
          {head ? <div className="card-tab min-w-0">{head}</div> : null}
          {actions ? <div className="card-float">{actions}</div> : null}
        </div>
      ) : null}

      <div className="card-body">{children}</div>
    </article>
  );
}

/** Identity block that lives inside the header tab. */
export function CardHead({
  avatar, title, subtitle,
}: {
  avatar: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {avatar}
      <span className="min-w-0 pr-1">
        <span className="block truncate text-[14px] font-bold leading-tight text-ink">{title}</span>
        {subtitle ? <span className="block truncate text-xs text-muted">{subtitle}</span> : null}
      </span>
    </div>
  );
}

/** Small circular button used in the card corners and footer. */
export function RoundAction({
  icon, label, onClick, solid = false, rotate, size = "md",
}: {
  icon: IconName;
  label: string;
  onClick?: (e: React.MouseEvent) => void;
  /** Filled button — the primary action of the card. */
  solid?: boolean;
  rotate?: string;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "h-9 w-9" : "h-12 w-12";
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      className={`flex ${box} shrink-0 items-center justify-center rounded-full transition ${
        solid
          ? "bg-ink text-on-ink hover:opacity-90"
          : "bg-surface-2 text-muted-strong hover:bg-surface-3 hover:text-ink"
      }`}
    >
      <Icon name={icon} size={size === "sm" ? 15 : 18} className={rotate} />
    </button>
  );
}

/** The ↗ corner button every card in the reference carries. */
export function OpenAction({ label = "Open", onClick }: { label?: string; onClick?: (e: React.MouseEvent) => void }) {
  return <RoundAction icon="arrow-up-right" label={label} onClick={onClick} size="sm" />;
}

/** Rounded square icon tile that sits beside the big card title. */
export function IconTile({
  icon, color = "#2f6bff", size = 48, image,
}: {
  icon: IconName;
  color?: string;
  size?: number;
  image?: string | null;
}) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        style={{ width: size, height: size }}
        className="shrink-0 rounded-[18px] object-cover"
      />
    );
  }
  return (
    <span
      style={{ width: size, height: size, background: `${color}1f`, color }}
      className="flex shrink-0 items-center justify-center rounded-[18px]"
    >
      <Icon name={icon} size={Math.round(size * 0.45)} />
    </span>
  );
}

/** Big bold card title with an optional icon tile on its left. */
export function CardHeading({
  title, meta, tile, className = "", titleClassName = "text-[22px]",
}: {
  title: ReactNode;
  meta?: ReactNode;
  tile?: ReactNode;
  className?: string;
  /** Lets the stat cards run a bigger number in the title slot. */
  titleClassName?: string;
}) {
  return (
    <div className={`flex items-center gap-3.5 ${className}`}>
      {tile}
      <div className="min-w-0">
        <h3 className={`line-clamp-2 font-display font-bold leading-[1.15] tracking-tight text-ink ${titleClassName}`}>
          {title}
        </h3>
        {meta ? <div className="mt-1 flex items-center gap-2 text-xs text-muted">{meta}</div> : null}
      </div>
    </div>
  );
}

/** Tiny grey label above a card row ("Source", "Status"). */
export function MicroLabel({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <span className="text-[12px] font-medium text-muted">{children}</span>
      {note ? <span className="text-[12px] font-semibold">{note}</span> : null}
    </div>
  );
}

/** Small light pill used for the source / language tags. */
export function TagChip({ children, icon }: { children: ReactNode; icon?: IconName }) {
  return (
    <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface-2 px-3.5 text-[12px] font-semibold text-muted-strong">
      {icon ? <Icon name={icon} size={12} /> : null}
      {children}
    </span>
  );
}

/** Five-dot strength meter, filled left to right. */
export function DotRating({
  value, total = 5, color = "#e50914",
}: {
  value: number;
  total?: number;
  color?: string;
}) {
  return (
    <span className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className="h-2.5 w-2.5 rounded-full transition"
          style={{ background: i < value ? color : "var(--surface-3)" }}
        />
      ))}
    </span>
  );
}

/** Wide pill that reads like a select: leading dot/avatar, label, chevron. */
export function SelectPill({
  leading, children, onClick, className = "",
}: {
  leading?: ReactNode;
  children: ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      className={`pill-status flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-full pl-2 pr-4 text-left text-[13px] font-semibold text-muted-strong transition hover:brightness-95 ${className}`}
    >
      {leading}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <Icon name="chevron-down" size={15} className="shrink-0 text-muted" />
    </button>
  );
}

/** Hairline used between the card sections. */
export function CardDivider({ className = "" }: { className?: string }) {
  return <div className={`my-5 border-t border-line ${className}`} />;
}

/** Bottom row: status pill on the left, round actions on the right. */
export function CardFooter({ children }: { children: ReactNode }) {
  return <div className="mt-auto flex items-center gap-2.5 pt-1">{children}</div>;
}

/* ---------------------------------------------------------------------------
 * ListCard — the reference card, assembled. Every list screen feeds it the
 * same slots so the grids stay pixel-identical across the app.
 * ------------------------------------------------------------------------ */

export function ListCard({
  onOpen, highlight = "none", eyebrow, menu, tile, title, meta, label, note, chips,
  dots, status, statusNote, onDelete, primary,
}: {
  onOpen: () => void;
  highlight?: "none" | "brand" | "accent";
  /** Identity shown in the header tab. */
  eyebrow: { initials: string; color?: string; title: string; subtitle: string };
  menu?: ReactNode;
  tile: { icon: IconName; color?: string; image?: string | null };
  title: ReactNode;
  meta?: ReactNode;
  label: string;
  note?: ReactNode;
  chips?: ReactNode;
  dots?: { value: number; color?: string };
  status: EntityStatus;
  statusNote?: string;
  onDelete?: () => void;
  primary?: { icon: IconName; label: string; onClick: () => void };
}) {
  return (
    <EntityCard
      onClick={onOpen}
      highlight={highlight}
      head={
        <CardHead
          avatar={<Avatar initials={eyebrow.initials} color={eyebrow.color ?? "#2f6bff"} size={40} ring={false} />}
          title={eyebrow.title}
          subtitle={eyebrow.subtitle}
        />
      }
      actions={
        <>
          {menu ? <span onClick={(e) => e.stopPropagation()}>{menu}</span> : null}
          <OpenAction onClick={onOpen} />
        </>
      }
    >
      <CardHeading
        tile={<IconTile icon={tile.icon} color={tile.color} image={tile.image} />}
        title={title}
        meta={meta}
      />

      <CardDivider />

      <MicroLabel note={note}>{label}</MicroLabel>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">{chips}</div>
        {dots ? <DotRating value={dots.value} color={dots.color} /> : null}
      </div>

      <p className="mb-2 mt-5 text-[12px] font-medium text-muted">Status</p>
      <CardFooter>
        <SelectPill
          leading={
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-3">
              <StatusDot status={status} />
            </span>
          }
          onClick={onOpen}
        >
          {STATUS_LABELS[status]}
          {statusNote ? ` · ${statusNote}` : ""}
        </SelectPill>
        {onDelete ? <RoundAction icon="trash" label="Delete" onClick={onDelete} /> : null}
        {primary ? (
          <RoundAction icon={primary.icon} label={primary.label} solid onClick={primary.onClick} />
        ) : null}
      </CardFooter>
    </EntityCard>
  );
}
