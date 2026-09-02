"use client";

import { useEffect, useRef, useState, type InputHTMLAttributes, type ReactNode, type RefObject, type TextareaHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import type { Option } from "@/types";
import { formatDuration, parseDuration } from "@/lib/format";
import { useClickOutside } from "@/lib/hooks";
import Icon from "./Icon";

/* --------------------------------- shell -------------------------------- */

export function Field({
  label, hint, error, required, children, className = "",
}: {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`w-full ${className}`}>
      {label ? (
        <label className="mb-1.5 flex items-center gap-1 text-[12px] font-semibold text-muted-strong">
          {label}
          {required ? (
            <span className="text-danger" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-danger">
          <Icon name="close" size={11} />
          {error}
        </p>
      ) : null}
      {hint && !error ? <p className="mt-1.5 text-[11px] text-muted">{hint}</p> : null}
    </div>
  );
}

/**
 * One recipe for every control: hairline border, quiet placeholder, a hover
 * that firms the edge, and a focus ring that reads without shouting.
 */
const CONTROL =
  "w-full rounded-lg border border-border bg-input-bg px-3 text-[13px] text-ink placeholder:text-muted/70 " +
  "outline-none transition-[border-color,box-shadow,background-color] duration-150 " +
  "hover:border-border-strong focus:border-accent focus:ring-[3px] focus:ring-accent/15 " +
  "disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-2 disabled:text-muted";

/** Applied on top of CONTROL when the field is invalid. */
const CONTROL_ERROR = "border-danger hover:border-danger focus:border-danger focus:ring-danger/15";

/* -------------------------------- inputs -------------------------------- */

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  prefix?: string;
};

export function TextInput({ label, hint, error, required, prefix, className = "", ...rest }: TextInputProps) {
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      <div className="flex items-stretch">
        {prefix ? (
          <span className="flex select-none items-center rounded-l-lg border border-r-0 border-border bg-surface-2 px-3 text-[12px] font-medium text-muted">
            {prefix}
          </span>
        ) : null}
        <input
          className={`${CONTROL} h-9 ${prefix ? "rounded-l-none" : ""} ${error ? CONTROL_ERROR : ""} ${className}`}
          {...rest}
        />
      </div>
    </Field>
  );
}

export function TextArea({
  label, hint, error, required, rows = 4, className = "", ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string; error?: string }) {
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      <textarea
        rows={rows}
        className={`${CONTROL} py-2 leading-relaxed ${error ? CONTROL_ERROR : ""} ${className}`}
        {...rest}
      />
    </Field>
  );
}

/* ------------------------------- dropdowns ------------------------------ */

/**
 * Shared popover shell.
 *
 * Rendered into `document.body` rather than next to the trigger: an ancestor
 * with a transform (our step animation) or `overflow: hidden` (cards, table
 * wrappers) would otherwise trap or clip the panel, which is what made the
 * page behind draw over an open dropdown.
 */
function Popover({
  anchor, open, children,
}: {
  anchor: RefObject<HTMLElement | null>;
  open: boolean;
  children: ReactNode;
}) {
  const [rect, setRect] = useState<{ left: number; top: number; width: number; drop: "down" | "up" } | null>(
    null,
  );

  useEffect(() => {
    if (!open) return;

    const measure = () => {
      const el = anchor.current;
      if (!el) return;
      const box = el.getBoundingClientRect();
      const below = window.innerHeight - box.bottom;
      const drop: "down" | "up" = below < 260 && box.top > below ? "up" : "down";
      setRect({
        left: box.left,
        top: drop === "down" ? box.bottom + 6 : box.top - 6,
        width: box.width,
        drop,
      });
    };

    // measured on the next frame so the trigger has its final position
    const frame = requestAnimationFrame(measure);
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [open, anchor]);

  if (!open || !rect || typeof document === "undefined") return null;

  return createPortal(
    <div
      data-popover
      style={{
        position: "fixed",
        left: rect.left,
        top: rect.drop === "down" ? rect.top : undefined,
        bottom: rect.drop === "up" ? window.innerHeight - rect.top : undefined,
        width: rect.width,
        zIndex: 100,
      }}
      className="animate-fade-up overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-pop)]"
    >
      {children}
    </div>,
    document.body,
  );
}

/** Search field inside a popover, shown once a list gets long. */
function PopoverSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="border-b border-line p-1.5">
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search..."
        className="h-8 w-full rounded-md bg-surface-2 px-2.5 text-[13px] text-ink placeholder:text-muted/70 outline-none focus:bg-surface-3"
      />
    </div>
  );
}

/** Row in a popover list — one height, one hover, everywhere. */
function OptionRow({
  children, selected, onClick, leading,
}: {
  children: ReactNode;
  selected?: boolean;
  onClick: () => void;
  leading?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-8 w-full items-center gap-2.5 px-2.5 text-left text-[13px] transition ${
        selected ? "bg-surface-2 font-semibold text-ink" : "text-muted-strong hover:bg-surface-2 hover:text-ink"
      }`}
    >
      {leading}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {selected && !leading ? <Icon name="check" size={13} className="shrink-0 text-accent" /> : null}
    </button>
  );
}

/** Small square checkbox used in the multi-select list. */
function CheckSquare({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border transition ${
        checked ? "border-accent bg-accent text-white" : "border-border-strong bg-surface"
      }`}
    >
      {checked ? <Icon name="check" size={10} /> : null}
    </span>
  );
}

/**
 * Single select. A custom listbox rather than a native select element, so the
 * open list matches the rest of the UI instead of the browser default.
 * The `onChange` signature stays event-shaped so call sites read unchanged.
 */
export function Select({
  label, hint, error, required, options, placeholder = "Select...", className = "",
  value, onChange, disabled,
}: {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  options: Option[];
  placeholder?: string;
  className?: string;
  value?: string | number;
  onChange?: (event: { target: { value: string } }) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  const selected = options.find((o) => String(o.value) === String(value ?? ""));
  const searchable = options.length > 8;
  const shown = searchable
    ? options.filter((o) => o.label.toLowerCase().includes(filter.toLowerCase()))
    : options;

  const pick = (next: string) => {
    onChange?.({ target: { value: next } });
    setOpen(false);
    setFilter("");
  };

  return (
    <Field label={label} hint={hint} error={error} required={required}>
      <div ref={ref} className="relative">
        <button
          ref={trigger}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={`${CONTROL} flex h-9 items-center pr-9 text-left ${
            open ? "border-accent ring-[3px] ring-accent/15" : ""
          } ${error ? CONTROL_ERROR : ""} ${className}`}
        >
          <span className={`min-w-0 flex-1 truncate ${selected ? "text-ink" : "text-muted/70"}`}>
            {selected?.label ?? placeholder}
          </span>
          <Icon
            name="chevron-down"
            size={15}
            className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted transition ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        <Popover anchor={trigger} open={open}>
          <>
            {searchable ? <PopoverSearch value={filter} onChange={setFilter} /> : null}
            <div className="max-h-56 overflow-y-auto py-1" role="listbox">
              {placeholder && !searchable ? (
                <OptionRow selected={!selected} onClick={() => pick("")}>
                  <span className="text-muted">{placeholder}</span>
                </OptionRow>
              ) : null}
              {shown.length === 0 ? (
                <p className="px-3 py-3 text-[13px] text-muted">No match</p>
              ) : (
                shown.map((o) => (
                  <OptionRow
                    key={o.value}
                    selected={String(o.value) === String(value ?? "")}
                    onClick={() => pick(o.value)}
                  >
                    {o.label}
                  </OptionRow>
                ))
              )}
            </div>
          </>
        </Popover>
      </div>
    </Field>
  );
}

/* ------------------------------ multi select ---------------------------- */

export function MultiSelect({
  label, hint, error, options, value, onChange, placeholder = "Select...",
}: {
  label?: string;
  hint?: string;
  error?: string;
  options: Option[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

  const shown = options.filter((o) => o.label.toLowerCase().includes(filter.toLowerCase()));
  const labelFor = (v: string) => options.find((o) => o.value === v)?.label ?? v;

  return (
    <Field label={label} hint={hint} error={error}>
      <div ref={ref} className="relative">
        <button
          ref={trigger}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={`${CONTROL} flex min-h-9 flex-wrap items-center gap-1 py-1.5 pr-9 text-left ${
            open ? "border-accent ring-[3px] ring-accent/15" : ""
          } ${error ? CONTROL_ERROR : ""}`}
        >
          {value.length === 0 ? <span className="text-muted/70">{placeholder}</span> : null}

          {value.slice(0, 4).map((v) => (
            <span
              key={v}
              className="inline-flex h-6 items-center gap-1 rounded-md bg-surface-2 pl-2 pr-1 text-[11px] font-medium text-ink ring-1 ring-border"
            >
              {labelFor(v)}
              <span
                role="button"
                tabIndex={-1}
                aria-label={`Remove ${labelFor(v)}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(v);
                }}
                className="flex h-4 w-4 items-center justify-center rounded text-muted transition hover:bg-surface-3 hover:text-ink"
              >
                <Icon name="close" size={10} />
              </span>
            </span>
          ))}

          {value.length > 4 ? (
            <span className="text-[11px] font-medium text-muted">+{value.length - 4} more</span>
          ) : null}

          <Icon
            name="chevron-down"
            size={15}
            className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted transition ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        <Popover anchor={trigger} open={open}>
          <>
            <PopoverSearch value={filter} onChange={setFilter} />
            <div className="max-h-56 overflow-y-auto py-1" role="listbox">
              {shown.length === 0 ? (
                <p className="px-3 py-3 text-[13px] text-muted">No match</p>
              ) : (
                shown.map((o) => (
                  <OptionRow
                    key={o.value}
                    onClick={() => toggle(o.value)}
                    leading={<CheckSquare checked={value.includes(o.value)} />}
                  >
                    {o.label}
                  </OptionRow>
                ))
              )}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-line px-2.5 py-1.5">
              <span className="text-[11px] text-muted">{value.length} selected</span>
              <button
                type="button"
                onClick={() => onChange([])}
                disabled={value.length === 0}
                className="text-[11px] font-semibold text-muted transition hover:text-ink disabled:opacity-40"
              >
                Clear all
              </button>
            </div>
          </>
        </Popover>
      </div>
    </Field>
  );
}

/* -------------------------------- toggles ------------------------------- */

export function Toggle({
  checked, onChange, label, description, size = "md",
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  description?: string;
  size?: "sm" | "md";
}) {
  const w = size === "sm" ? "h-5 w-9" : "h-6 w-11";
  const knob = size === "sm" ? "h-3.5 w-3.5" : "h-4.5 w-4.5";
  const shift = size === "sm" ? "translate-x-4" : "translate-x-5";
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative ${w} shrink-0 rounded-full transition ${checked ? "bg-ink" : "bg-surface-3"}`}
      >
        <span
          className={`absolute left-0.5 top-1/2 ${knob} -translate-y-1/2 rounded-full bg-on-ink transition-transform ${
            checked ? shift : "translate-x-0"
          }`}
        />
      </button>
      {label || description ? (
        <span>
          {label ? <span className="block text-sm font-medium text-ink">{label}</span> : null}
          {description ? <span className="block text-xs text-muted">{description}</span> : null}
        </span>
      ) : null}
    </label>
  );
}

export function Checkbox({
  checked, onChange, label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-strong hover:text-ink">
      <span
        onClick={() => onChange(!checked)}
        className={`flex h-5 w-5 items-center justify-center rounded-md transition ${
          checked ? "bg-ink text-on-ink" : "bg-surface-2 ring-1 ring-border"
        }`}
      >
        {checked ? <Icon name="check" size={12} /> : null}
      </span>
      {label}
    </label>
  );
}

/* ------------------------------- specials ------------------------------- */

export function DurationInput({
  label, value, onChange, hint,
}: {
  label?: string;
  value: number;
  onChange: (seconds: number) => void;
  hint?: string;
}) {
  const [text, setText] = useState(formatDuration(value));
  return (
    <Field label={label} hint={hint}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const secs = parseDuration(text);
          setText(formatDuration(secs));
          onChange(secs);
        }}
        placeholder="00:00:00"
        className={`${CONTROL} h-9 font-mono`}
      />
    </Field>
  );
}

export function DateInput({
  label, value, onChange, hint, type = "date",
}: {
  label?: string;
  value: string;
  onChange: (next: string) => void;
  hint?: string;
  type?: "date" | "datetime-local";
}) {
  return (
    <Field label={label} hint={hint}>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${CONTROL} h-9`}
      />
    </Field>
  );
}

/** Key/value pairs used by the metadata tab. */
export function KeyValueList({
  label, items, onChange,
}: {
  label?: string;
  items: { name: string; value: string }[];
  onChange: (next: { name: string; value: string }[]) => void;
}) {
  const rows = items.length ? items : [{ name: "", value: "" }];
  const update = (i: number, patch: Partial<{ name: string; value: string }>) => {
    const next = rows.map((row, idx) => (idx === i ? { ...row, ...patch } : row));
    onChange(next.filter((r) => r.name || r.value));
  };
  return (
    <Field label={label}>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              value={row.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder="Variable name"
              className={`${CONTROL} h-9`}
            />
            <input
              value={row.value}
              onChange={(e) => update(i, { value: e.target.value })}
              placeholder="Variable value"
              className={`${CONTROL} h-9`}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...items, { name: "", value: "" }])}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition hover:text-ink"
        >
          <Icon name="plus" size={13} /> Add variable
        </button>
      </div>
    </Field>
  );
}
