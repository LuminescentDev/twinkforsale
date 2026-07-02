import { component$, Slot } from "@builder.io/qwik";
import { cn } from "~/lib/utils";

export interface EmptyStateProps {
  /** Lucide icon component (preferred). */
  icon?: any;
  /** Or a decorative emoji when an icon doesn't fit the vibe. */
  emoji?: string;
  title: string;
  description?: string;
  class?: string;
}

/**
 * Consistent empty/zero-state block with optional action (via default slot).
 * Replaces ad-hoc "no files yet" centered blocks.
 */
export const EmptyState = component$<EmptyStateProps>(
  ({ icon: Icon, emoji, title, description, class: className }) => {
    return (
      <div class={cn("flex flex-col items-center py-12 text-center", className)}>
        {emoji ? (
          <div class="mb-4 text-5xl sm:text-6xl">{emoji}</div>
        ) : (
          Icon && (
            <div class="from-theme-accent-primary/20 to-theme-accent-secondary/20 mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br">
              <Icon class="text-theme-accent-primary h-8 w-8" />
            </div>
          )
        )}
        <h3 class="text-theme-text-primary text-lg font-semibold">{title}</h3>
        {description && (
          <p class="text-theme-text-secondary mt-2 max-w-md text-sm">
            {description}
          </p>
        )}
        <div class="mt-6 empty:hidden">
          <Slot />
        </div>
      </div>
    );
  },
);
