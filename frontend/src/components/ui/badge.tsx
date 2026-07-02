import { component$, Slot } from "@builder.io/qwik";
import { cn } from "~/lib/utils";

type Status = "success" | "error" | "warning" | "info" | "neutral" | "accent";

export interface BadgeProps {
  status?: Status;
  icon?: any;
  class?: string;
}

// All colors resolve from theme tokens so badges adapt across all themes.
const statusMap: Record<Status, string> = {
  success: "bg-theme-success/15 text-theme-success border-theme-success/30",
  error: "bg-theme-error/15 text-theme-error border-theme-error/30",
  warning: "bg-theme-warning/15 text-theme-warning border-theme-warning/30",
  info: "bg-theme-info/15 text-theme-info border-theme-info/30",
  accent:
    "bg-theme-accent-primary/15 text-theme-accent-primary border-theme-accent-primary/30",
  neutral:
    "bg-theme-bg-tertiary/30 text-theme-text-secondary border-theme-card-border",
};

/**
 * Small status pill using semantic theme colors. Replaces inline emoji
 * statuses (❌✅⏳) and hardcoded `text-green-400`/`text-red-400` labels.
 */
export const Badge = component$<BadgeProps>(
  ({ status = "neutral", icon: Icon, class: className }) => {
    return (
      <span
        class={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
          statusMap[status],
          className,
        )}
      >
        {Icon && <Icon class="h-3.5 w-3.5" />}
        <Slot />
      </span>
    );
  },
);
