import { component$, Slot } from "@builder.io/qwik";
import { cn } from "~/lib/utils";

export interface EmptyStateProps {
  icon?: any;
  /** Says which of the empty cases this is — nothing yet, or nothing matching. */
  title: string;
  description?: string;
  /** `inline` for an empty region inside a surface; `page` for a whole view. */
  size?: "inline" | "page";
  class?: string;
}

/**
 * Distinguishes an empty collection from a filter with no matches, a load
 * failure, or an unavailable feature. Actions go in the default slot.
 */
export const EmptyState = component$<EmptyStateProps>(
  ({ icon: Icon, title, description, size = "page", class: className }) => (
    <div
      class={cn(
        "flex flex-col items-center px-4 text-center",
        size === "page" ? "py-14" : "py-9",
        className,
      )}
    >
      {Icon && (
        <Icon
          aria-hidden="true"
          class={cn(
            "text-ink-muted mb-3",
            size === "page" ? "h-7 w-7" : "h-6 w-6",
          )}
        />
      )}
      <p class="text-ink text-[15px] font-semibold">{title}</p>
      {description && (
        <p class="text-ink-muted mt-1.5 max-w-sm text-[13px] leading-5">
          {description}
        </p>
      )}
      <div class="mt-4 flex flex-wrap justify-center gap-2 empty:hidden">
        <Slot />
      </div>
    </div>
  ),
);
