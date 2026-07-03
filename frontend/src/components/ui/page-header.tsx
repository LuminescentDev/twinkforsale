import { component$, Slot } from "@builder.io/qwik";
import { cn } from "~/lib/utils";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional Lucide icon component rendered in a gradient badge. */
  icon?: any;
  /** Left-align instead of the default centered header. */
  align?: "center" | "left";
  class?: string;
}

/**
 * Consistent page header used across every route. Replaces the many
 * hand-rolled `<h1 class="text-gradient-cute ...">` blocks. Decorative emoji
 * are intentionally kept out of the heading (refined-kawaii); use the `icon`
 * prop for a themed badge instead. An optional `actions` slot renders on the
 * right for buttons.
 */
export const PageHeader = component$<PageHeaderProps>(
  ({ title, subtitle, icon: Icon, align = "center", class: className }) => {
    const centered = align === "center";
    return (
      <div
        class={cn(
          "mb-6 sm:mb-8",
          centered
            ? "text-center"
            : "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
          className,
        )}
      >
        <div class={cn(centered && "flex flex-col items-center")}>
          <h1
            class={cn(
              "text-gradient-cute flex items-center gap-3 text-3xl font-bold sm:text-4xl",
              centered && "justify-center",
            )}
          >
            {Icon && (
              <span class="from-theme-accent-primary to-theme-accent-secondary inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br">
                <Icon class="h-5 w-5 text-white" />
              </span>
            )}
            {title}
          </h1>
          {subtitle && (
            <p class="text-theme-text-secondary mt-2 max-w-2xl px-2 text-base sm:text-lg">
              {subtitle}
            </p>
          )}
        </div>
        <Slot name="actions" />
      </div>
    );
  },
);
