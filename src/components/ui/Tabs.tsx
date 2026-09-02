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
      className={`flex gap-1 overflow-x-auto border-b border-border ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            data-active={isActive}
            className="view-tab shrink-0"
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
  const pad = size === "sm" ? "px-2.5 py-1 text-[12px]" : "px-3 py-1.5 text-[13px]";
  return (
    <div className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          disabled={o.disabled}
          onClick={() => onChange(o.value)}
          className={`rounded-md font-semibold transition disabled:opacity-40 ${pad} ${
            o.value === value ? "bg-surface text-ink shadow-[var(--shadow-card)]" : "text-muted hover:text-ink"
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
