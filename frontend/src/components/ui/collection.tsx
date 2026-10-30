import {
  component$,
  Slot,
  useSignal,
  type QRL,
  type Signal,
} from "@builder.io/qwik";
import { Search, X, Loader2, Check, AlertCircle } from "lucide-icons-qwik";
import { cn } from "~/lib/utils";

export interface SearchFieldProps {
  value: Signal<string>;
  /** Accessible name for the field. Shown visually unless `hideLabel`. */
  label: string;
  placeholder?: string;
  hideLabel?: boolean;
  /** Announced result count, e.g. "12 of 84 files". */
  resultSummary?: string;
  class?: string;
}

/**
 * The collection search field. Grows to fill the toolbar so the most common
 * action on a Files-style page is the widest target in the row.
 */
export const SearchField = component$<SearchFieldProps>(
  ({
    value,
    label,
    placeholder = "Search",
    hideLabel = true,
    resultSummary,
    class: className,
  }) => {
    const id = useSignal(`search-${label.replace(/\W+/g, "-").toLowerCase()}`);
    return (
      <div class={cn("min-w-0", className)}>
        <label
          for={id.value}
          class={cn(
            "text-ink mb-1.5 block text-[13px] font-medium",
            hideLabel && "sr-only",
          )}
        >
          {label}
        </label>
        <div class="relative">
          <Search
            aria-hidden="true"
            class="text-ink-muted pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2"
          />
          <input
            id={id.value}
            type="search"
            value={value.value}
            placeholder={placeholder}
            aria-describedby={resultSummary ? `${id.value}-count` : undefined}
            onInput$={(_, el) => (value.value = el.value)}
            class="focus-ring rounded-control border-edge bg-surface text-ink placeholder:text-ink-muted hover:border-edge-strong h-9 w-full border pr-8 pl-8 text-sm transition-colors duration-150 [&::-webkit-search-cancel-button]:hidden"
          />
          {value.value && (
            <button
              type="button"
              aria-label="Clear search"
              onClick$={() => (value.value = "")}
              class="focus-ring text-ink-muted hover:text-ink absolute top-1/2 right-1.5 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-[4px]"
            >
              <X class="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {resultSummary && (
          <span id={`${id.value}-count`} class="sr-only" aria-live="polite">
            {resultSummary}
          </span>
        )}
      </div>
    );
  },
);

/**
 * The row above a collection: search, filters, sort and view controls. Wraps
 * onto multiple lines rather than overflowing, and keeps search first.
 */
export const CollectionToolbar = component$<{ class?: string }>(
  ({ class: className }) => (
    <div class={cn("flex flex-wrap items-center gap-2", className)}>
      <Slot />
    </div>
  ),
);

export interface SelectionBarProps {
  count: number;
  /** Total selectable items, for the Select all affordance. */
  total: number;
  allSelected: boolean;
  onSelectAll$: QRL<() => void>;
  onClear$: QRL<() => void>;
  class?: string;
}

/**
 * Replaces the collection toolbar while a selection exists. Sticks below the
 * page header on desktop and above the mobile bottom bar, so it never covers
 * the navigation. Actions go in the default slot.
 */
export const SelectionBar = component$<SelectionBarProps>(
  ({ count, total, allSelected, onSelectAll$, onClear$, class: className }) => (
    <div
      role="region"
      aria-label="Selection actions"
      class={cn(
        "retro-frame bg-surface rounded-surface shadow-pop flex flex-wrap items-center gap-x-2 gap-y-2 px-3 py-2",
        className,
      )}
    >
      <span class="text-ink mr-1 text-[13px] font-medium" aria-live="polite">
        {count} selected
      </span>
      <button
        type="button"
        onClick$={onSelectAll$}
        class="focus-ring rounded-control text-accent-text hover:bg-accent-soft px-2 py-1 text-[13px] font-medium"
      >
        {allSelected ? "Deselect all" : `Select all ${total}`}
      </button>
      <div class="bg-edge mx-1 hidden h-5 w-px sm:block" />
      <div class="flex flex-1 flex-wrap items-center gap-2">
        <Slot />
      </div>
      <button
        type="button"
        onClick$={onClear$}
        class="focus-ring rounded-control text-ink-muted hover:text-ink hover:bg-surface-hover px-2 py-1 text-[13px]"
      >
        Clear
      </button>
    </div>
  ),
);

export type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

export interface SaveIndicatorProps {
  state: SaveState;
  /** Shown instead of the generic message when the state is `error`. */
  errorMessage?: string;
  class?: string;
}

/**
 * Editor save state. Text plus icon — never colour alone — and announced
 * politely so a change is heard as well as seen.
 */
export const SaveIndicator = component$<SaveIndicatorProps>(
  ({ state, errorMessage, class: className }) => {
    if (state === "idle") return null;

    const map = {
      dirty: {
        icon: AlertCircle,
        text: "Unsaved changes",
        tone: "text-warning",
      },
      saving: { icon: Loader2, text: "Saving…", tone: "text-ink-muted" },
      saved: { icon: Check, text: "Saved", tone: "text-success" },
      error: {
        icon: AlertCircle,
        text: errorMessage || "Could not save",
        tone: "text-danger",
      },
    }[state];
    const Icon = map.icon;

    return (
      <span
        aria-live="polite"
        class={cn(
          "inline-flex items-center gap-1.5 text-[13px] whitespace-nowrap",
          map.tone,
          className,
        )}
      >
        <Icon class={cn("h-3.5 w-3.5", state === "saving" && "animate-spin")} />
        {map.text}
      </span>
    );
  },
);
