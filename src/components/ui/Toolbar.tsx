"use client";

import { useEffect, useState, type ReactNode } from "react";
import Icon from "./Icon";
import { useDebounced } from "@/lib/hooks";

/* ------------------------------ search input ---------------------------- */

export function SearchInput({
  value, onChange, placeholder = "Search", className = "",
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [text, setText] = useState(value);
  const debounced = useDebounced(text, 300);

  useEffect(() => {
    if (debounced !== value) onChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className={`relative ${className}`}>
      <Icon name="search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-full bg-surface pl-11 pr-9 text-sm text-ink placeholder:text-muted outline-none ring-1 ring-border transition hover:ring-border-strong focus:ring-2 focus:ring-ink/70"
      />
      {text ? (
        <button
          onClick={() => setText("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted transition hover:text-ink"
        >
          <Icon name="close" size={14} />
        </button>
      ) : null}
    </div>
  );
}

/* -------------------------------- toolbar ------------------------------- */

export function Toolbar({ left, right }: { left?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">{left}</div>
      <div className="flex flex-wrap items-center gap-3">{right}</div>
    </div>
  );
}

/* ------------------------------- pagination ----------------------------- */

export function Pagination({
  page, pageCount, perPage, total, onPage, onPerPage,
}: {
  page: number;
  pageCount: number;
  perPage: number;
  total: number;
  onPage: (page: number) => void;
  onPerPage: (perPage: number) => void;
}) {
  const pages = pageWindow(page, pageCount);
  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 text-sm text-muted sm:flex-row">
      <span>Number of items: {total}</span>

      <div className="flex items-center gap-4">
        {pageCount > 1 ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-muted ring-1 ring-border transition hover:text-ink disabled:opacity-30"
              aria-label="Previous page"
            >
              <Icon name="chevron-left" size={16} />
            </button>
            {pages.map((p, i) =>
              p === "..." ? (
                <span key={`gap-${i}`} className="px-1 text-muted">
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPage(p)}
                  className={`h-9 min-w-9 rounded-full px-3 text-[13px] font-semibold transition ${
                    p === page ? "bg-ink text-on-ink" : "text-muted hover:bg-surface-2 hover:text-ink"
                  }`}
                >
                  {p}
                </button>
              ),
            )}
            <button
              onClick={() => onPage(Math.min(pageCount, page + 1))}
              disabled={page === pageCount}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-muted ring-1 ring-border transition hover:text-ink disabled:opacity-30"
              aria-label="Next page"
            >
              <Icon name="chevron-right" size={16} />
            </button>
          </div>
        ) : null}

        <label className="flex items-center gap-2">
          Per page
          <select
            value={perPage}
            onChange={(e) => onPerPage(Number(e.target.value))}
            className="h-9 rounded-full bg-surface px-3 text-[13px] text-ink outline-none ring-1 ring-border"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n} className="bg-surface">
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

/** 1 ... 4 5 6 ... 20 */
function pageWindow(page: number, pageCount: number): (number | "...")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const out: (number | "...")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  if (start > 2) out.push("...");
  for (let p = start; p <= end; p++) out.push(p);
  if (end < pageCount - 1) out.push("...");
  out.push(pageCount);
  return out;
}
