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
          } animate-fade-up overflow-hidden rounded-2xl bg-surface py-1.5 shadow-[var(--shadow-pop)] ring-1 ring-border`}
        >
          {items.map((item) => (
            <button
              key={item.label}
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition disabled:opacity-40 ${
                item.tone === "danger"
                  ? "text-danger hover:bg-danger/10"
                  : "text-muted-strong hover:bg-surface-2 hover:text-ink"
              }`}
            >
              {item.icon ? (
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    item.tone === "danger" ? "bg-danger/15" : "bg-surface-2 text-ink"
                  }`}
                >
                  <Icon name={item.icon} size={15} />
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
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${width} animate-fade-up overflow-hidden rounded-[26px] bg-surface shadow-[var(--shadow-pop)] ring-1 ring-border`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
            {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-muted transition hover:bg-surface-2 hover:text-ink"
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        {children ? <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div> : null}

        {footer ? (
          <footer className="flex items-center justify-end gap-3 border-t border-line px-6 py-4">
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
