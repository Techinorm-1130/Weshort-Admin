"use client";

import { useRef, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
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
        <label className="mb-2 block text-[13px] font-semibold text-muted-strong">
          {label} {required ? <span className="text-brand">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? <p className="mt-1.5 text-xs text-danger">{error}</p> : null}
      {hint && !error ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

const CONTROL =
  "w-full rounded-2xl bg-surface-2 px-4 text-sm text-ink placeholder:text-muted outline-none ring-1 ring-border transition hover:ring-border-strong focus:ring-2 focus:ring-ink/70 disabled:opacity-50";

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
          <span className="flex items-center rounded-l-2xl bg-surface-3 px-3.5 text-sm text-muted ring-1 ring-border">
            {prefix}
          </span>
        ) : null}
        <input
          className={`${CONTROL} h-11 ${prefix ? "rounded-l-none" : ""} ${error ? "ring-danger" : ""} ${className}`}
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
      <textarea rows={rows} className={`${CONTROL} py-2.5 ${className}`} {...rest} />
    </Field>
  );
}

export function Select({
  label, hint, error, required, options, placeholder = "Select...", className = "", ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
  options: Option[];
  placeholder?: string;
}) {
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      <div className="relative">
        <select
          className={`${CONTROL} h-11 appearance-none pr-9 ${!rest.value ? "text-muted" : ""} ${className}`}
          {...rest}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-surface text-ink">
              {o.label}
            </option>
          ))}
        </select>
        <Icon
          name="chevron-down"
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
        />
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
  useClickOutside(ref, () => setOpen(false), open);

  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

  const shown = options.filter((o) => o.label.toLowerCase().includes(filter.toLowerCase()));

  return (
    <Field label={label} hint={hint} error={error}>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`${CONTROL} flex min-h-11 flex-wrap items-center gap-1.5 py-2 pr-9 text-left`}
        >
          {value.length === 0 ? <span className="text-muted">{placeholder}</span> : null}
          {value.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-xs font-medium text-on-ink"
            >
              {options.find((o) => o.value === v)?.label ?? v}
              <span
                role="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(v);
                }}
                className="text-on-ink/60 hover:text-on-ink"
              >
                <Icon name="close" size={11} />
              </span>
            </span>
          ))}
          <Icon
            name="chevron-down"
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
          />
        </button>

        {open ? (
          <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-pop)] ring-1 ring-border">
            <div className="border-b border-line p-2">
              <input
                autoFocus
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search..."
                className="h-9 w-full rounded-xl bg-surface-2 px-3 text-sm text-ink placeholder:text-muted outline-none"
              />
            </div>
            <div className="max-h-56 overflow-y-auto py-1">
              {shown.length === 0 ? (
                <p className="px-3 py-3 text-sm text-muted">No result</p>
              ) : (
                shown.map((o) => {
                  const active = value.includes(o.value);
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => toggle(o.value)}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-muted-strong transition hover:bg-surface-2 hover:text-ink"
                    >
                      <span
                        className={`flex h-4.5 w-4.5 items-center justify-center rounded-md ${
                          active ? "bg-ink text-on-ink" : "bg-surface-2 ring-1 ring-border"
                        }`}
                      >
                        {active ? <Icon name="check" size={11} /> : null}
                      </span>
                      {o.label}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : null}
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
        className={`${CONTROL} h-11 font-mono`}
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
        className={`${CONTROL} h-11`}
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
              className={`${CONTROL} h-11`}
            />
            <input
              value={row.value}
              onChange={(e) => update(i, { value: e.target.value })}
              placeholder="Variable value"
              className={`${CONTROL} h-11`}
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
