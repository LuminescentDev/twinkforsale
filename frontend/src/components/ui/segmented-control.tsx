import { component$, $, type Signal, type QRL } from "@builder.io/qwik";
import { cn } from "~/lib/utils";

export interface SegmentedOption {
  value: string;
  label: string;
  icon?: any;
  /** Show only the icon; `label` still provides the accessible name. */
  iconOnly?: boolean;
}

export interface SegmentedControlProps {
  /** Names the group, e.g. "File view". Required for the radio group. */
  label: string;
  options: SegmentedOption[];
  value: Signal<string>;
  onChange$?: QRL<(value: string) => void>;
  size?: "sm" | "md";
  class?: string;
}

/**
 * Small set of mutually exclusive views (list/grid, edit/preview). Rectangular
 * segments in a bordered track — selection is carried by fill, text weight and
 * `aria-checked`, not by colour alone.
 */
export const SegmentedControl = component$<SegmentedControlProps>(
  ({ label, options, value, onChange$, size = "md", class: className }) => (
    <div
      role="radiogroup"
      aria-label={label}
      class={cn(
        "border-edge-strong bg-surface-subtle rounded-control inline-flex border-2 [border-style:inset] p-0.5",
        className,
      )}
    >
      {options.map((opt) => {
        const active = value.value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={opt.iconOnly ? opt.label : undefined}
            title={opt.iconOnly ? opt.label : undefined}
            onClick$={$(async () => {
              value.value = opt.value;
              if (onChange$) await onChange$(opt.value);
            })}
            class={cn(
              "focus-ring rounded-control inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap transition-colors duration-150",
              size === "sm" ? "h-6 text-xs" : "h-7 text-[13px]",
              opt.iconOnly ? (size === "sm" ? "w-6" : "w-7") : "px-2.5",
              active
                ? "bg-accent text-on-accent"
                : "text-ink-muted hover:text-ink hover:bg-surface-hover",
            )}
          >
            {opt.icon && <opt.icon class="h-4 w-4" aria-hidden="true" />}
            {!opt.iconOnly && opt.label}
          </button>
        );
      })}
    </div>
  ),
);
