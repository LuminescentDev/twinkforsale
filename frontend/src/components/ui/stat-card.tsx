import { component$ } from "@builder.io/qwik";
import { cn } from "~/lib/utils";

export interface StatCardProps {
  icon: any;
  label: string;
  value: string | number;
  /** Accent index 0–3 → cycles the theme accent gradient (never hardcoded). */
  accent?: 0 | 1 | 2 | 3;
  /** Center the content (home platform stats) vs inline (dashboard). */
  layout?: "inline" | "centered";
  /** Soft pulse on the icon badge. */
  pulse?: boolean;
  class?: string;
}

// Theme-driven accent gradients — replaces hardcoded from-pink-500 etc.
const accentGradients = [
  "from-theme-accent-primary to-theme-accent-secondary",
  "from-theme-accent-secondary to-theme-accent-tertiary",
  "from-theme-accent-tertiary to-theme-accent-quaternary",
  "from-theme-accent-quaternary to-theme-accent-primary",
];

/**
 * Metric card used on home, dashboard and admin. Consolidates the ~3 copies
 * of this block and swaps hardcoded palette gradients for theme accents.
 */
export const StatCard = component$<StatCardProps>(
  ({
    icon: Icon,
    label,
    value,
    accent = 0,
    layout = "inline",
    pulse = false,
    class: className,
  }) => {
    const badge = (
      <div
        class={cn(
          "flex items-center justify-center rounded-full bg-gradient-to-br",
          accentGradients[accent],
          pulse && "pulse-soft",
          layout === "centered"
            ? "mx-auto mb-3 h-12 w-12 sm:mb-4 sm:h-16 sm:w-16"
            : "p-2 sm:p-3",
        )}
      >
        <Icon
          class={cn(
            "text-white",
            layout === "centered"
              ? "h-6 w-6 sm:h-8 sm:w-8"
              : "h-4 w-4 sm:h-6 sm:w-6",
          )}
        />
      </div>
    );

    if (layout === "centered") {
      return (
        <div class={cn("card-static rounded-2xl p-4 text-center sm:p-6", className)}>
          {badge}
          <div class="text-theme-text-primary mb-1 text-lg font-bold sm:text-2xl">
            {value}
          </div>
          <div class="text-theme-text-secondary text-xs sm:text-sm">{label}</div>
        </div>
      );
    }

    return (
      <div class={cn("card-static rounded-2xl p-4 sm:p-6", className)}>
        <div class="flex items-center">
          {badge}
          <div class="ml-3 sm:ml-4">
            <p class="text-theme-text-secondary text-xs font-medium sm:text-sm">
              {label}
            </p>
            <p class="text-theme-text-primary text-lg font-bold sm:text-2xl">
              {value}
            </p>
          </div>
        </div>
      </div>
    );
  },
);
