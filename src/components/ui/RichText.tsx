"use client";

import { useRef, useState } from "react";
import Icon, { type IconName } from "./Icon";
import { Field } from "./Fields";

interface ToolbarButton {
  label: string;
  icon: IconName | null;
  glyph?: string;
  wrap: [string, string];
}

/** Markdown-flavoured editor: stores plain markdown so the backend stays simple. */
const BUTTONS: ToolbarButton[] = [
  { label: "Bold", icon: null, glyph: "B", wrap: ["**", "**"] },
  { label: "Italic", icon: null, glyph: "I", wrap: ["_", "_"] },
  { label: "Heading", icon: null, glyph: "H", wrap: ["## ", ""] },
  { label: "Quote", icon: null, glyph: "❝", wrap: ["> ", ""] },
  { label: "Bulleted list", icon: null, glyph: "•", wrap: ["- ", ""] },
  { label: "Numbered list", icon: null, glyph: "1.", wrap: ["1. ", ""] },
  { label: "Link", icon: "link", wrap: ["[", "](https://)"] },
  { label: "Image", icon: "image", wrap: ["![alt](", ")"] },
];

export default function RichText({
  label, value, onChange, rows = 8, hint,
}: {
  label?: string;
  value: string;
  onChange: (next: string) => void;
  rows?: number;
  hint?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);

  const apply = (wrap: [string, string]) => {
    const el = ref.current;
    if (!el) return;
    const [start, end] = [el.selectionStart, el.selectionEnd];
    const selected = value.slice(start, end);
    const next = `${value.slice(0, start)}${wrap[0]}${selected}${wrap[1]}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + wrap[0].length, end + wrap[0].length);
    });
  };

  return (
    <Field label={label} hint={hint}>
      <div className="overflow-hidden rounded-2xl bg-surface-2 ring-1 ring-border focus-within:ring-2 focus-within:ring-ink/70">
        <div className="flex flex-wrap items-center gap-0.5 border-b border-line px-2 py-2">
          {BUTTONS.map((b) => (
            <button
              key={b.label}
              type="button"
              title={b.label}
              onClick={() => apply(b.wrap)}
              className="flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-[13px] font-semibold text-muted transition hover:bg-surface-3 hover:text-ink"
            >
              {b.icon ? <Icon name={b.icon} size={15} /> : b.glyph}
            </button>
          ))}
          <span className="mx-1 h-4 w-px bg-border" />
          <button
            type="button"
            title="Preview"
            onClick={() => setPreview((v) => !v)}
            className={`flex h-8 min-w-8 items-center justify-center rounded-full px-2 transition hover:bg-surface-3 ${
              preview ? "text-ink" : "text-muted hover:text-ink"
            }`}
          >
            <Icon name="eye" size={15} />
          </button>
        </div>

        {preview ? (
          <div
            className="prose-cms min-h-32 px-4 py-3.5 text-sm text-ink"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
          />
        ) : (
          <textarea
            ref={ref}
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full resize-y bg-transparent px-4 py-3.5 text-sm text-ink placeholder:text-muted outline-none"
            placeholder="Write here..."
          />
        )}
      </div>
    </Field>
  );
}

/** Minimal markdown -> HTML for the preview pane (input is escaped first). */
export function renderMarkdown(src: string): string {
  const escaped = src
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped
    .replace(/^&gt; (.*)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2" />')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/^- (.*)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>")
    .split(/\n{2,}/)
    .map((block) => (block.startsWith("<") ? block : `<p>${block.replace(/\n/g, "<br/>")}</p>`))
    .join("");
}
