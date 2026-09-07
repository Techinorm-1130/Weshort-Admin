/* ---------------------------------------------------------------------------
 * Spreadsheet export.
 *
 * CSV with a UTF-8 BOM: Excel opens it directly (and keeps accents), while it
 * stays readable by Sheets, Numbers and any importer the backend team uses
 * later. No dependency, no build step.
 * ------------------------------------------------------------------------ */

export type Cell = string | number | boolean | null | undefined;

export interface SheetColumn<T> {
  header: string;
  value: (row: T) => Cell;
}

/** Quotes a cell only when it needs it, and never lets a value break a row. */
function encode(cell: Cell): string {
  if (cell === null || cell === undefined) return "";
  const text = String(cell);
  return /[",\n\r;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv<T>(rows: T[], columns: SheetColumn<T>[]): string {
  const head = columns.map((c) => encode(c.header)).join(",");
  const body = rows.map((row) => columns.map((c) => encode(c.value(row))).join(","));
  return [head, ...body].join("\r\n");
}

/** Timestamped filename, so repeated exports do not overwrite each other. */
export function stampedName(base: string): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${base}-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(
    now.getHours(),
  )}${pad(now.getMinutes())}.csv`;
}

/** Builds the file in the browser and triggers the download. */
export function downloadCsv<T>(base: string, rows: T[], columns: SheetColumn<T>[]): number {
  const csv = toCsv(rows, columns);
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = stampedName(base);
  document.body.appendChild(link);
  link.click();
  link.remove();
  // give the browser a tick to start the download before revoking
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return rows.length;
}
