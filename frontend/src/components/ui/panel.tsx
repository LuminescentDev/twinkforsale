import { component$, Slot } from "@builder.io/qwik";
import { cn } from "~/lib/utils";

export interface PanelProps {
  title?: string;
  icon?: any;
  description?: string;
  /** Remove body padding — use for edge-to-edge tables/lists. */
  flush?: boolean;
  class?: string;
}

/**
 * Titled content surface: a static card with an optional header (icon + title
 * + description on the left, an `actions` slot on the right) and a body slot.
 * This is the standard page section wrapper so every panel across the app
 * shares the same header rhythm, borders and radius.
 */
export const Panel = component$<PanelProps>(
  ({ title, icon: Icon, description, flush, class: className }) => {
    const hasHeader = !!(title || Icon || description);
    return (
      <div
        class={cn("card-static overflow-hidden rounded-2xl", className)}
      >
        {hasHeader && (
          <div class="border-theme-card-border flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div class="flex items-center gap-3">
              {Icon && (
                <span class="from-theme-accent-primary to-theme-accent-secondary inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br">
                  <Icon class="h-5 w-5 text-white" />
                </span>
              )}
              <div class="min-w-0">
                {title && (
                  <h2 class="text-theme-text-primary truncate text-base font-bold sm:text-lg">
                    {title}
                  </h2>
                )}
                {description && (
                  <p class="text-theme-text-muted truncate text-xs sm:text-sm">
                    {description}
                  </p>
                )}
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2 empty:hidden">
              <Slot name="actions" />
            </div>
          </div>
        )}
        <div class={flush ? "" : "p-4 sm:p-6"}>
          <Slot />
        </div>
      </div>
    );
  },
);
