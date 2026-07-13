import { component$, type Signal } from "@builder.io/qwik";
import { Search, X } from "lucide-icons-qwik";
import { cn } from "~/lib/utils";

export interface SearchInputProps {
  value: Signal<string>;
  placeholder?: string;
  class?: string;
}

/**
 * Rounded search field with a leading icon and a clear button. Standardizes
 * the several bespoke search inputs across the app onto one control.
 */
export const SearchInput = component$<SearchInputProps>(
  ({ value, placeholder = "Search…", class: className }) => {
    return (
      <div class={cn("relative", className)}>
        <Search class="text-theme-text-muted pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <input
          type="text"
          value={value.value}
          placeholder={placeholder}
          onInput$={(e) => (value.value = (e.target as HTMLInputElement).value)}
          class="border-theme-card-border bg-theme-bg-secondary/50 text-theme-text-primary placeholder:text-theme-text-muted focus:border-theme-accent-primary focus:ring-theme-accent-primary/30 w-full rounded-full border py-2 pr-9 pl-9 text-sm transition-colors focus:ring-2 focus:outline-none"
        />
        {value.value && (
          <button
            type="button"
            aria-label="Clear search"
            onClick$={() => (value.value = "")}
            class="text-theme-text-muted hover:text-theme-text-primary absolute top-1/2 right-3 -translate-y-1/2"
          >
            <X class="h-4 w-4" />
          </button>
        )}
      </div>
    );
  },
);
