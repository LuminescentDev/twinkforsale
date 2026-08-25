import { component$ } from "@builder.io/qwik";
import { cn } from "~/lib/utils";

type Tone = "accent" | "success" | "warning" | "danger";

export interface ProgressBarProps {
  value: number;
  max?: number;
  tone?: Tone;
  size?: "sm" | "md";
  /** Accessible name, e.g. "Storage used" or "Uploading photo.png". */
  label: string;
  /** Exact value read out instead of the percentage, e.g. "1.2 GB of 5 GB". */
  valueText?: string;
  /** Unknown duration: renders the track without a determinate fill. */
  indeterminate?: boolean;
  class?: string;
}

const toneMap: Record<Tone, string> = {
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

/** Progress and quota meter. Tracks are one of the few fully rounded shapes. */
export const ProgressBar = component$<ProgressBarProps>(
  ({
    value,
    max = 100,
    tone = "accent",
    size = "md",
    label,
    valueText,
    indeterminate,
    class: className,
  }) => {
    const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));
    return (
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={indeterminate ? undefined : Math.round(pct)}
        aria-valuemin={indeterminate ? undefined : 0}
        aria-valuemax={indeterminate ? undefined : 100}
        aria-valuetext={valueText}
        class={cn(
          "bg-surface-subtle border-edge w-full overflow-hidden rounded-full border",
          size === "sm" ? "h-1.5" : "h-2",
          className,
        )}
      >
        <div
          class={cn(
            "h-full rounded-full transition-[width] duration-200",
            toneMap[tone],
            indeterminate && "w-1/3 animate-pulse",
          )}
          style={indeterminate ? undefined : `width:${pct}%`}
        />
      </div>
    );
  },
);
