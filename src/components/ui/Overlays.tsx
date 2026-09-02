"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useClickOutside } from "@/lib/hooks";
import Icon, { type IconName } from "./Icon";
import Button from "./Button";

/* -------------------------------- dropdown ------------------------------ */

export interface MenuItem {
  label: string;
  icon?: IconName;
  onSelect: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
}

export function Dropdown({
  trigger, items, align = "right", width = "w-56",
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  items: MenuItem[];
  align?: "left" | "right";
  width?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  return (
    <div ref={ref} className="relative inline-flex">
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      {open ? (
        <div
          className={`absolute top-full z-40 mt-2 ${width} ${
            align === "right" ? "right-0" : "left-0"
          } animate-fade-up overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-[var(--shadow-pop)]`}
        >
          {items.map((item) => (
            <button
              key={item.label}
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition disabled:opacity-40 ${
                item.tone === "danger"
                  ? "text-danger hover:bg-danger/10"
                  : "text-muted-strong hover:bg-surface-2 hover:text-ink"
              }`}
            >
              {item.icon ? (
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-md ${
                    item.tone === "danger" ? "bg-danger/12" : "bg-surface-2 text-muted"
                  }`}
                >
                  <Icon name={item.icon} size={13} />
                </span>
              ) : null}
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* --------------------------------- modal -------------------------------- */

export function Modal({
  open, onClose, title, description, children, footer, width = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${width} animate-fade-up overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-pop)]`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-3.5">
          <div>
            <h2 className="font-display text-[15px] font-bold text-ink">{title}</h2>
            {description ? <p className="mt-0.5 text-[12px] text-muted">{description}</p> : null}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-ink"
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        {children ? <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div> : null}

        {footer ? (
          <footer className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, message, confirmLabel = "Delete", pending,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  pending?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width="max-w-md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" loading={pending} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-strong">{message}</p>
    </Modal>
  );
}
