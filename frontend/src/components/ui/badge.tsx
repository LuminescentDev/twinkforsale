import { component$, Slot } from "@builder.io/qwik";
import { cn } from "~/lib/utils";

export type BadgeTone =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "neutral"
  | "accent";

export interface BadgeProps {
  tone?: BadgeTone;
  /** Paired with the label so status is never carried by colour alone. */
  icon?: any;
  class?: string;
}

const toneMap: Record<BadgeTone, string> = {
  success: "bg-success-soft text-success border-success/35",
  error: "bg-danger-soft text-danger border-danger/35",
  warning: "bg-warning-soft text-warning border-warning/35",
  info: "bg-info-soft text-info border-info/35",
  accent: "bg-accent-soft text-accent-text border-accent/35",
  neutral: "bg-surface-subtle text-ink-muted border-edge",
};

/** Compact status tag. */
export const Badge = component$<BadgeProps>(
  ({ tone = "neutral", icon: Icon, class: className }) => (
    <span
      class={cn(
        "rounded-control inline-flex items-center gap-1 border px-1.5 py-0.5 text-xs leading-4 font-medium whitespace-nowrap",
        toneMap[tone],
        className,
      )}
    >
      {Icon && <Icon class="h-3 w-3" aria-hidden="true" />}
      <Slot />
    </span>
  ),
);
