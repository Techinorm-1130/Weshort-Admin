"use client";

import { useEffect, type ReactNode } from "react";
import Icon from "./Icon";

/**
 * Right-hand slide-over. Same surface language as Modal, but anchored to the
 * edge so long records (a viewer profile, a watch history) stay scannable.
 */
export default function Drawer({
  open, onClose, title, subtitle, badge, children, footer, width = "max-w-xl",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 animate-fade-in bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <aside
        role="dialog"
        aria-modal="true"
        className={`relative flex h-full w-full ${width} animate-fade-up flex-col bg-surface shadow-[var(--shadow-pop)]`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-xl font-bold tracking-tight text-ink">{title}</h2>
              {badge}
            </div>
            {subtitle ? <div className="mt-1.5 text-[13px] text-muted">{subtitle}</div> : null}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted transition hover:bg-surface-3 hover:text-ink"
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer ? (
          <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-line px-6 py-4">
            {footer}
          </footer>
        ) : null}
      </aside>
    </div>
  );
}

/** Label / value row used inside the drawer sections. */
export function DrawerRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-3 last:border-0">
      <span className="text-[13px] text-muted">{label}</span>
      <span className="max-w-[60%] text-right text-[13px] font-medium text-ink">{children}</span>
    </div>
  );
}

/** Titled block inside the drawer. */
export function DrawerSection({
  title, action, children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mb-6 last:mb-0">
      <header className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-[12px] font-bold uppercase tracking-[0.14em] text-muted">{title}</h3>
        {action}
      </header>
      {children}
    </section>
  );
}
