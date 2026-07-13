import { component$, $, type Signal, type QRL } from "@builder.io/qwik";
import { cn } from "~/lib/utils";

export interface SegmentedOption {
  value: string;
  label?: string;
  icon?: any;
}

export interface SegmentedControlProps {
  options: SegmentedOption[];
  /** Bound signal holding the active value. */
  value: Signal<string>;
  /** Optional side effect (e.g. persist to a cookie) after selection. */
  onChange$?: QRL<(value: string) => void>;
  size?: "sm" | "md";
  class?: string;
}

/**
 * Pill segmented control for view toggles and small tab switches (list/grid,
 * analytics period, etc.). Consolidates the several hand-built toggle groups
 * into one theme-driven control.
 */
export const SegmentedControl = component$<SegmentedControlProps>(
  ({ options, value, onChange$, size = "md", class: className }) => {
    return (
      <div
        class={cn(
          "border-theme-card-border bg-theme-bg-secondary/40 inline-flex rounded-full border p-1",
          className,
        )}
      >
        {options.map((opt) => {
          const active = value.value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick$={$(async () => {
                value.value = opt.value;
                if (onChange$) await onChange$(opt.value);
              })}
              class={cn(
                "inline-flex items-center gap-2 rounded-full font-medium whitespace-nowrap transition-colors duration-200",
                size === "sm" ? "px-3 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
                active
                  ? "from-theme-accent-primary to-theme-accent-secondary bg-gradient-to-br text-white shadow-sm"
                  : "text-theme-text-muted hover:text-theme-text-primary",
              )}
            >
              {opt.icon && <opt.icon class="h-4 w-4" />}
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  },
);
