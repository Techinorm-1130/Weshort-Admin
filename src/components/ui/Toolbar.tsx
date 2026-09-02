"use client";

import { useEffect, useState, type ReactNode } from "react";
import Icon from "./Icon";
import { useDebounced } from "@/lib/hooks";
import { Select } from "./Fields";

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
      <Icon name="search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-border bg-input-bg pl-8 pr-8 text-[13px] text-ink placeholder:text-muted/70 outline-none transition-[border-color,box-shadow] duration-150 hover:border-border-strong focus:border-accent focus:ring-[3px] focus:ring-accent/15"
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
    <div className="mt-3 flex flex-col items-center justify-between gap-3 text-[12px] text-muted sm:flex-row">
      <span>Number of items: {total}</span>

      <div className="flex items-center gap-4">
        {pageCount > 1 ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-muted transition hover:text-ink disabled:opacity-30"
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
                  className={`h-7 min-w-7 rounded-md px-2 text-[12px] font-semibold transition ${
                    p === page ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2 hover:text-ink"
                  }`}
                >
                  {p}
                </button>
              ),
            )}
            <button
              onClick={() => onPage(Math.min(pageCount, page + 1))}
              disabled={page === pageCount}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-muted transition hover:text-ink disabled:opacity-30"
              aria-label="Next page"
            >
              <Icon name="chevron-right" size={16} />
            </button>
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <span>Per page</span>
          <div className="w-20">
            <Select
              value={String(perPage)}
              placeholder=""
              options={[10, 25, 50, 100].map((n) => ({ value: String(n), label: String(n) }))}
              onChange={(e) => onPerPage(Number(e.target.value))}
            />
          </div>
        </div>
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
