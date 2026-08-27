"use client";

import type { ReactNode } from "react";

export interface TabItem {
  id: string;
  label: string;
  badge?: number;
}

export function Tabs({
  tabs, active, onChange, className = "",
}: {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      className={`flex gap-1.5 overflow-x-auto rounded-full border border-border bg-surface p-1.5 ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
              isActive ? "bg-ink text-on-ink" : "text-muted hover:bg-surface-2 hover:text-ink"
            }`}
          >
            {tab.label}
            {tab.badge ? (
              <span className="ml-2 rounded-full bg-surface-2 px-1.5 py-0.5 text-[11px] text-muted-strong">
                {tab.badge}
              </span>
            ) : null}

          </button>
        );
      })}
    </div>
  );
}

/** Two-state segmented control (Simple / Expert, Internal / External, ...). */
export function SegmentedControl({
  options, value, onChange, size = "md",
}: {
  options: { value: string; label: string; disabled?: boolean }[];
  value: string;
  onChange: (v: string) => void;
  size?: "sm" | "md";
}) {
  const pad = size === "sm" ? "px-3 py-1.5 text-[13px]" : "px-4 py-2 text-sm";
  return (
    <div className="inline-flex rounded-full bg-surface-2 p-1 ring-1 ring-border">
      {options.map((o) => (
        <button
          key={o.value}
          disabled={o.disabled}
          onClick={() => onChange(o.value)}
          className={`rounded-full font-semibold transition disabled:opacity-40 ${pad} ${
            o.value === value ? "bg-ink text-on-ink" : "text-muted hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mt-5 animate-fade-up ${className}`}>{children}</div>;
}
