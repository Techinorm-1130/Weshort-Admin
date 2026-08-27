import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import Icon, { type IconName } from "./Icon";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "accent" | "subtle";
type Size = "sm" | "md" | "lg";

/* Black pills carry the primary actions, exactly like the reference. */
const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-on-ink shadow-[0_10px_24px_-12px_rgba(12,12,14,0.8)] hover:bg-ink-soft",
  accent: "grad-accent text-white shadow-[0_10px_24px_-12px_rgba(37,99,255,0.9)] hover:brightness-110",
  secondary: "bg-surface text-ink ring-1 ring-border hover:bg-surface-2",
  subtle: "bg-surface-2 text-muted-strong hover:bg-surface-3 hover:text-ink",
  ghost: "text-muted hover:bg-surface-2 hover:text-ink",
  danger: "bg-brand text-white hover:bg-brand-hover",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 gap-1.5 px-3.5 text-[13px]",
  md: "h-11 gap-2 px-5 text-sm",
  lg: "h-13 gap-2.5 px-6 text-base",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  className?: string;
  children?: ReactNode;
};

function classes({ variant = "primary", size = "md", className = "" }: CommonProps) {
  return `inline-flex items-center justify-center rounded-full font-semibold whitespace-nowrap transition
    active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
}

function Inner({ icon, iconRight, loading, children, size = "md", variant = "primary" }: CommonProps) {
  const s = size === "sm" ? 15 : 17;
  /* Leading icons sit in a contrasting round chip on the solid pills. */
  const chip =
    variant === "primary" || variant === "accent" || variant === "danger"
      ? "bg-white/15 text-current"
      : "bg-surface-2 text-ink";

  return (
    <>
      {loading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ) : icon ? (
        children ? (
          <span className={`-ml-1.5 flex h-6 w-6 items-center justify-center rounded-full ${chip}`}>
            <Icon name={icon} size={14} />
          </span>
        ) : (
          <Icon name={icon} size={s} />
        )
      ) : null}
      {children}
      {iconRight && !loading ? <Icon name={iconRight} size={s} className="-mr-1 opacity-70" /> : null}
    </>
  );
}

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({
  variant, size, icon, iconRight, loading, className, children, disabled, ...rest
}: ButtonProps) {
  return (
    <button className={classes({ variant, size, className })} disabled={disabled || loading} {...rest}>
      <Inner icon={icon} iconRight={iconRight} loading={loading} size={size} variant={variant}>
        {children}
      </Inner>
    </button>
  );
}

type LinkButtonProps = CommonProps & { href: string };

export function LinkButton({ href, variant, size, icon, iconRight, className, children }: LinkButtonProps) {
  return (
    <Link href={href} className={classes({ variant, size, className })}>
      <Inner icon={icon} iconRight={iconRight} size={size} variant={variant}>
        {children}
      </Inner>
    </Link>
  );
}

/** Circular icon-only button used in card corners and table rows. */
export function IconButton({
  icon, label, size = "md", variant = "secondary", className = "", ...rest
}: { icon: IconName; label: string } & Omit<ButtonProps, "icon" | "children">) {
  const box = size === "sm" ? "h-9 w-9" : "h-10 w-10";
  return (
    <button
      aria-label={label}
      title={label}
      className={`inline-flex ${box} items-center justify-center rounded-full transition ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      <Icon name={icon} size={size === "sm" ? 15 : 17} />
    </button>
  );
}

/** Filter chip row item — black when active, white otherwise. */
export function Chip({
  active, icon, children, onClick,
}: {
  active?: boolean;
  icon?: IconName;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition ${
        active ? "bg-ink text-on-ink" : "bg-surface text-muted-strong ring-1 ring-border hover:bg-surface-2"
      }`}
    >
      {icon ? <Icon name={icon} size={14} /> : null}
      {children}
    </button>
  );
}
