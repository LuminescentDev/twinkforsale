import { component$ } from "@builder.io/qwik";
import { cn } from "~/lib/utils";

type Tone = "accent" | "success" | "warning" | "danger";

export interface ProgressBarProps {
  value: number;
  max?: number;
  tone?: Tone;
  size?: "sm" | "md";
  class?: string;
}

// Gradient fills resolve from theme tokens so bars adapt to every theme.
const toneMap: Record<Tone, string> = {
  accent: "from-theme-accent-primary to-theme-accent-secondary",
  success: "from-theme-success to-theme-success",
  warning: "from-theme-warning to-theme-warning",
  danger: "from-theme-error to-theme-error",
};

/**
 * Theme-driven progress/meter bar (storage usage, quotas, view limits).
 * Clamps to 0–100% and animates width changes.
 */
export const ProgressBar = component$<ProgressBarProps>(
  ({ value, max = 100, tone = "accent", size = "md", class: className }) => {
    const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));
    return (
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        class={cn(
          "bg-theme-bg-tertiary/40 w-full overflow-hidden rounded-full",
          size === "sm" ? "h-1.5" : "h-2.5",
          className,
        )}
      >
        <div
          class={cn(
            "h-full rounded-full bg-gradient-to-r transition-all duration-500",
            toneMap[tone],
          )}
          style={`width:${pct}%`}
        />
      </div>
    );
  },
);
