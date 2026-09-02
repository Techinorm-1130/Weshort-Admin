"use client";

import { useState } from "react";
import Icon, { type IconName } from "@/components/ui/Icon";

export const THEME_KEY = "weshort.admin.theme";

export type Theme = "light" | "dark";

/** Applied before paint by the inline script in the root layout. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(
  THEME_KEY,
)})||"light";document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

const OPTIONS: { value: Theme; label: string; icon: IconName }[] = [
  { value: "light", label: "White theme", icon: "sun" },
  { value: "dark", label: "Black theme", icon: "moon" },
];

function currentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

/** Two explicit choices — white or black — rather than a hidden toggle. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(currentTheme);

  const apply = (next: Theme) => {
    document.documentElement.setAttribute("data-theme", next);
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      /* private mode — the choice just won't persist */
    }
    setTheme(next);
  };

  return (
    <div
      role="group"
      aria-label="Theme"
      className="flex items-center gap-0.5 rounded-lg border border-border bg-surface-2 p-0.5"
    >
      {OPTIONS.map((option) => {
        const active = theme === option.value;
        return (
          <button
            key={option.value}
            onClick={() => apply(option.value)}
            title={option.label}
            aria-label={option.label}
            aria-pressed={active}
            className={`flex h-6 w-7 items-center justify-center rounded-md transition ${
              active
                ? "bg-surface text-ink shadow-[var(--shadow-card)]"
                : "text-muted hover:text-ink"
            }`}
          >
            <Icon name={option.icon} size={14} />
          </button>
        );
      })}
    </div>
  );
}
