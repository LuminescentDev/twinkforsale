import { component$, Slot, type QRL } from "@builder.io/qwik";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-icons-qwik";
import { cn } from "~/lib/utils";

/**
 * Styled table primitives. Rather than a render-prop DataTable (awkward to
 * serialize in Qwik), these are thin wrappers around native table elements so
 * every table shares the same header treatment, row hover/selection states and
 * cell rhythm while pages keep full control of their markup.
 */

export const Table = component$<{ minWidth?: string; class?: string }>(
  ({ minWidth = "640px", class: className }) => (
    <div class="overflow-x-auto">
      <table
        class={cn("w-full text-left", className)}
        style={`min-width:${minWidth}`}
      >
        <Slot />
      </table>
    </div>
  ),
);

export const Thead = component$<{ class?: string }>(
  ({ class: className }) => (
    <thead
      class={cn(
        "border-theme-card-border bg-theme-bg-secondary/30 border-b",
        className,
      )}
    >
      <Slot />
    </thead>
  ),
);

export const Th = component$<{ class?: string }>(({ class: className }) => (
  <th
    class={cn(
      "text-theme-text-muted px-4 py-3 text-xs font-semibold tracking-wider uppercase whitespace-nowrap",
      className,
    )}
  >
    <Slot />
  </th>
));

export interface SortHeaderProps {
  active?: boolean;
  direction?: "asc" | "desc";
  onClick$?: QRL<() => void>;
  class?: string;
}

/** Clickable column header showing sort state. */
export const SortHeader = component$<SortHeaderProps>(
  ({ active, direction, onClick$, class: className }) => {
    const Icon = !active ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown;
    return (
      <th
        class={cn(
          "text-theme-text-muted px-4 py-3 text-xs font-semibold tracking-wider uppercase whitespace-nowrap",
          className,
        )}
      >
        <button
          type="button"
          onClick$={onClick$}
          class={cn(
            "hover:text-theme-text-secondary inline-flex items-center gap-1.5 transition-colors",
            active && "text-theme-text-secondary",
          )}
        >
          <Slot />
          <Icon class={cn("h-3 w-3", !active && "opacity-50")} />
        </button>
      </th>
    );
  },
);

export const Tr = component$<{
  hover?: boolean;
  selected?: boolean;
  class?: string;
}>(({ hover = true, selected, class: className }) => (
  <tr
    class={cn(
      "border-theme-card-border/60 border-b transition-colors last:border-b-0",
      hover && "hover:bg-theme-bg-tertiary/20",
      selected && "bg-theme-accent-primary/10",
      className,
    )}
  >
    <Slot />
  </tr>
));

export const Td = component$<{ class?: string }>(({ class: className }) => (
  <td class={cn("text-theme-text-secondary px-4 py-3 text-sm", className)}>
    <Slot />
  </td>
));
