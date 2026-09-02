"use client";

import type { SectionField } from "@/lib/landing-sections";
import type { SectionValue } from "@/types";
import { Select, TextArea, TextInput, Toggle } from "@/components/ui/Fields";
import { ImageDrop } from "@/components/ui/Uploader";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";

type Row = Record<string, string | number | boolean>;

/**
 * Renders one field of a section from its schema. `list` fields recurse into
 * repeatable rows, which is what powers FAQ items, plans, features and so on.
 */
export default function FieldEditor({
  field, value, onChange,
}: {
  field: SectionField;
  value: SectionValue | undefined;
  onChange: (next: SectionValue) => void;
}) {
  switch (field.type) {
    case "textarea":
      return (
        <TextArea
          label={field.label}
          hint={field.hint}
          rows={3}
          placeholder={field.placeholder}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "number":
      return (
        <TextInput
          label={field.label}
          hint={field.hint}
          type="number"
          value={Number(value ?? 0)}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      );

    case "toggle":
      return (
        <div className="rounded-lg border border-border px-3 py-2.5">
          <Toggle checked={Boolean(value)} onChange={onChange} label={field.label} description={field.hint} />
        </div>
      );

    case "select":
      return (
        <Select
          label={field.label}
          hint={field.hint}
          options={field.options ?? []}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "image":
      return (
        <div className="w-full max-w-56">
          <ImageDrop
            ratio="16:9"
            label={field.label}
            value={value ? String(value) : undefined}
            onChange={(dataUrl) => onChange(dataUrl ?? "")}
          />
        </div>
      );

    case "color":
      return (
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-semibold text-muted-strong">{field.label}</span>
          <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-input-bg pl-1.5 pr-3 transition hover:border-border-strong">
            <input
              type="color"
              value={String(value ?? "#e50914")}
              onChange={(e) => onChange(e.target.value)}
              className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
            />
            <span className="font-mono text-[12px] text-muted">{String(value ?? "#e50914")}</span>
          </span>
        </label>
      );

    case "list": {
      const rows = (Array.isArray(value) ? value : []) as Row[];
      const subFields = field.fields ?? [];

      const patchRow = (index: number, key: string, next: string | number | boolean) =>
        onChange(rows.map((row, i) => (i === index ? { ...row, [key]: next } : row)));

      const move = (index: number, delta: number) => {
        const target = index + delta;
        if (target < 0 || target >= rows.length) return;
        const next = [...rows];
        [next[index], next[target]] = [next[target], next[index]];
        onChange(next);
      };

      return (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] font-semibold text-muted-strong">{field.label}</span>
            <span className="text-xs text-muted">{rows.length} item(s)</span>
          </div>

          <div className="space-y-3">
            {rows.map((row, index) => (
              <div key={index} className="rounded-lg border border-border bg-surface-2 p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    {field.itemLabel ?? "item"} {index + 1}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label="Move up"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition hover:bg-surface-3 hover:text-ink disabled:opacity-30"
                    >
                      <Icon name="chevron-down" size={13} className="rotate-180" />
                    </button>
                    <button
                      type="button"
                      aria-label="Move down"
                      onClick={() => move(index, 1)}
                      disabled={index === rows.length - 1}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition hover:bg-surface-3 hover:text-ink disabled:opacity-30"
                    >
                      <Icon name="chevron-down" size={13} />
                    </button>
                    <button
                      type="button"
                      aria-label="Remove item"
                      onClick={() => onChange(rows.filter((_, i) => i !== index))}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition hover:bg-danger/12 hover:text-danger"
                    >
                      <Icon name="trash" size={13} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {subFields.map((sub) => (
                    <FieldEditor
                      key={sub.key}
                      field={sub}
                      value={row[sub.key] as SectionValue}
                      onChange={(next) => patchRow(index, sub.key, next as string | number | boolean)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <Button
              size="sm"
              variant="secondary"
              icon="plus"
              onClick={() =>
                onChange([
                  ...rows,
                  Object.fromEntries(subFields.map((sub) => [sub.key, sub.type === "toggle" ? false : ""])),
                ])
              }
            >
              Add {field.itemLabel ?? "item"}
            </Button>
          </div>
        </div>
      );
    }

    default:
      return (
        <TextInput
          label={field.label}
          hint={field.hint}
          placeholder={field.placeholder}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}
