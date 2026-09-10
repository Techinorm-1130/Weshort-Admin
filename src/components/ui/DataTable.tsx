"use client";

import { useRef, useState, type ReactNode } from "react";
import type { Option } from "@/types";
import { useClickOutside } from "@/lib/hooks";
import Icon, { type IconName } from "./Icon";
import { TableSkeleton, EmptyState } from "./Primitives";

/** Static map — Tailwind cannot see class names built by interpolation. */
const ALIGN = { left: "text-left", center: "text-center", right: "text-right" } as const;

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** Cell renderer. */
  cell: (row: T) => ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
  /** Sort key sent to the API (prefix with "-" handled by the table). */
  sortKey?: string;
  /** Dropdown filter shown in the header cell. */
  filter?: { value: string; options: Option[]; onChange: (v: string) => void };
  className?: string;
}

/* ------------------------------ header filter --------------------------- */

function HeaderFilter({
  value, options, onChange,
}: {
  value: string;
  options: Option[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);
  const active = value && value !== "all";

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`ml-1 rounded p-0.5 transition ${active ? "text-accent" : "text-muted hover:text-ink"}`}
        aria-label="Filter"
      >
        <Icon name="chevron-down" size={14} />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-30 mt-1 min-w-40 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-[var(--shadow-pop)]">
          {[{ value: "all", label: "All" }, ...options].map((o) => (
            <button
              key={o.value}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between px-4 py-2 text-left text-[13px] transition hover:bg-surface-2 ${
                o.value === value ? "font-semibold text-ink" : "text-muted-strong"
              }`}
            >
              {o.label}
              {o.value === value ? <Icon name="check" size={13} className="text-accent" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* --------------------------------- table -------------------------------- */

export default function DataTable<T extends { id: string }>({
  columns, rows, loading, sort, onSortChange, onRowClick, rowActions, emptyTitle = "Nothing here yet",
  emptyDescription, emptyIcon, emptyAction,
}: {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  sort?: string;
  onSortChange?: (sort: string) => void;
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: IconName;
  emptyAction?: ReactNode;
}) {
  const toggleSort = (key: string) => {
    if (!onSortChange) return;
    onSortChange(sort === key ? `-${key}` : sort === `-${key}` ? key : `-${key}`);
  };

  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="border-b border-line">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={`whitespace-nowrap bg-surface px-4 py-3 align-middle ${
                    ALIGN[col.align ?? "left"]
                  } text-[12px] font-semibold text-muted`}
                >
                  <span className="inline-flex items-center">
                    {col.sortKey && onSortChange ? (
                      <button
                        onClick={() => toggleSort(col.sortKey!)}
                        className="inline-flex items-center gap-1 transition hover:text-ink"
                      >
                        {col.header}
                        {sort?.replace("-", "") === col.sortKey ? (
                          <Icon
                            name="chevron-down"
                            size={13}
                            className={sort?.startsWith("-") ? "" : "rotate-180"}
                          />
                        ) : null}
                      </button>
                    ) : (
                      col.header
                    )}
                    {col.filter ? <HeaderFilter {...col.filter} /> : null}
                  </span>
                </th>
              ))}
              {rowActions ? <th className="w-16 bg-surface px-4 py-3" /> : null}
            </tr>
          </thead>

          {loading ? null : (
            <tbody className="divide-y divide-line">
              {rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`group transition hover:bg-surface-2 ${onRowClick ? "cursor-pointer" : ""}`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 align-middle ${
                        ALIGN[col.align ?? "left"]
                      } text-[13px] text-muted-strong ${col.className ?? ""}`}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                  {rowActions ? (
                    <td className="px-4 py-3 text-right align-middle" onClick={(e) => e.stopPropagation()}>
                      {rowActions(row)}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>

      {loading ? <TableSkeleton cols={columns.length} /> : null}

      {!loading && rows.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} action={emptyAction} />
      ) : null}
    </div>
  );
}
