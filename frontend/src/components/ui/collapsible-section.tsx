import { component$, Slot, type Signal } from "@builder.io/qwik";
import { ChevronDown, ChevronUp } from "lucide-icons-qwik";
import { cn } from "~/lib/utils";

export interface CollapsibleSectionProps {
  title: string;
  icon?: any;
  /** Bound open/closed state (true = collapsed). */
  collapsed: Signal<boolean>;
  /** Optional trailing meta text next to the title (e.g. "3/10"). */
  meta?: string;
  class?: string;
}

/**
 * Card surface with a clickable header that expands/collapses its body.
 * Standardizes the repeated "glass panel + toggle button + chevron" pattern
 * into one theme-driven component.
 */
export const CollapsibleSection = component$<CollapsibleSectionProps>(
  ({ title, icon: Icon, collapsed, meta, class: className }) => {
    return (
      <div class={cn("card-static overflow-hidden rounded-2xl", className)}>
        <button
          type="button"
          onClick$={() => (collapsed.value = !collapsed.value)}
          class="hover:bg-theme-bg-tertiary/20 flex w-full items-center justify-between px-4 py-4 text-left transition-colors sm:px-6"
        >
          <h2 class="text-theme-text-primary flex items-center gap-2 text-base font-bold sm:text-lg">
            {Icon && <Icon class="text-theme-accent-primary h-5 w-5" />}
            {title}
            {meta && (
              <span class="text-theme-text-muted ml-1 text-sm font-normal">
                {meta}
              </span>
            )}
          </h2>
          {collapsed.value ? (
            <ChevronDown class="text-theme-text-muted h-5 w-5 shrink-0" />
          ) : (
            <ChevronUp class="text-theme-text-muted h-5 w-5 shrink-0" />
          )}
        </button>
        {!collapsed.value && (
          <div class="px-4 pb-5 sm:px-6">
            <Slot />
          </div>
        )}
      </div>
    );
  },
);
