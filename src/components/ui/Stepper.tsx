"use client";

import Icon from "./Icon";

export interface Step {
  id: string;
  label: string;
  hint?: string;
}

/**
 * Horizontal step indicator for the upload wizard. Completed steps are
 * clickable so the admin can jump back without losing the draft.
 */
export default function Stepper({
  steps, current, onSelect, furthest,
}: {
  steps: Step[];
  /** Index of the active step. */
  current: number;
  onSelect?: (index: number) => void;
  /** Highest index reached so far — everything up to it stays clickable. */
  furthest?: number;
}) {
  const reachable = furthest ?? current;

  return (
    <ol className="flex w-full items-center gap-2 overflow-x-auto pb-1">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const clickable = onSelect && i <= reachable;

        return (
          <li key={step.id} className="flex min-w-0 flex-1 items-center gap-2">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onSelect(i)}
              className={`flex min-w-0 flex-1 items-center gap-3 rounded-full py-2 pl-2 pr-4 text-left transition ${
                active
                  ? "bg-ink text-on-ink"
                  : clickable
                    ? "bg-surface text-muted-strong hover:bg-surface-2 hover:text-ink"
                    : "bg-surface text-muted"
              } ${clickable ? "cursor-pointer" : "cursor-default"}`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
                  active
                    ? "bg-on-ink/15 text-on-ink"
                    : done
                      ? "bg-ok/15 text-ok"
                      : "bg-surface-2 text-muted"
                }`}
              >
                {done ? <Icon name="check" size={14} /> : i + 1}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold">{step.label}</span>
                {step.hint ? (
                  <span className={`block truncate text-[11px] ${active ? "opacity-70" : "text-muted"}`}>
                    {step.hint}
                  </span>
                ) : null}
              </span>
            </button>

            {i < steps.length - 1 ? (
              <span className={`hidden h-px w-4 shrink-0 sm:block ${done ? "bg-ok/40" : "bg-border"}`} />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
