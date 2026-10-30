import {
  component$,
  Slot,
  useSignal,
  useVisibleTask$,
  type QRL,
} from "@builder.io/qwik";
import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-icons-qwik";
import { cn } from "~/lib/utils";

/**
 * Thin wrappers over native table elements. Pages keep full control of their
 * markup; these only carry the shared header, row and cell rhythm, so tables
 * stay sortable, selectable and readable by assistive technology.
 */

export const Table = component$<{
  /** Announced table purpose, e.g. "Your files". */
  label: string;
  minWidth?: string;
  class?: string;
}>(({ label, minWidth = "760px", class: className }) => (
  <div class="w-full overflow-x-auto">
    <table
      aria-label={label}
      class={cn("w-full border-collapse text-left", className)}
      style={`min-width:${minWidth}`}
    >
      <Slot />
    </table>
  </div>
));

export const Thead = component$<{ class?: string }>(({ class: className }) => (
  <thead
    class={cn("bg-surface-subtle border-accent-text/45 border-b-2", className)}
  >
    <Slot />
  </thead>
));

export const Tbody = component$<{ class?: string }>(({ class: className }) => (
  <tbody class={className}>
    <Slot />
  </tbody>
));

const headCell =
  "text-ink-muted px-3 py-2 text-xs font-medium whitespace-nowrap";

export const Th = component$<{
  /** Set for a column of row headers rather than a column header. */
  scope?: "col" | "row";
  class?: string;
}>(({ scope = "col", class: className }) => (
  <th scope={scope} class={cn(headCell, className)}>
    <Slot />
  </th>
));

export interface SortHeaderProps {
  active?: boolean;
  direction?: "asc" | "desc";
  onClick$?: QRL<() => void>;
  class?: string;
}

/** Column header that sorts. Exposes the current sort via `aria-sort`. */
export const SortHeader = component$<SortHeaderProps>(
  ({ active, direction = "asc", onClick$, class: className }) => {
    const Icon = !active
      ? ChevronsUpDown
      : direction === "asc"
        ? ArrowUp
        : ArrowDown;
    return (
      <th
        scope="col"
        aria-sort={
          active ? (direction === "asc" ? "ascending" : "descending") : "none"
        }
        class={cn(headCell, "p-0", className)}
      >
        <button
          type="button"
          onClick$={onClick$}
          class={cn(
            "focus-ring hover:text-ink inline-flex w-full items-center gap-1 px-3 py-2 text-left transition-colors duration-150",
            active && "text-ink",
          )}
        >
          <Slot />
          <Icon
            aria-hidden="true"
            class={cn("h-3 w-3 shrink-0", !active && "opacity-40")}
          />
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
    aria-selected={selected}
    class={cn(
      "border-edge border-b border-dotted transition-colors duration-150 last:border-b-0",
      hover && "hover:bg-surface-hover",
      selected && "bg-accent-soft",
      className,
    )}
  >
    <Slot />
  </tr>
));

export const Td = component$<{ class?: string }>(({ class: className }) => (
  <td class={cn("text-ink px-3 py-2 align-middle text-[13px]", className)}>
    <Slot />
  </td>
));

/** Cell holding secondary metadata: smaller and quieter, but still legible. */
export const TdMeta = component$<{ title?: string; class?: string }>(
  ({ title, class: className }) => (
    <td
      title={title}
      class={cn(
        "text-ink-muted px-3 py-2 align-middle text-xs whitespace-nowrap",
        className,
      )}
    >
      <Slot />
    </td>
  ),
);

export interface CheckboxProps {
  checked: boolean;
  name?: string;
  showLabel?: boolean;
  disabled?: boolean;
  indeterminate?: boolean;
  /** Names the specific row or the whole collection. */
  label: string;
  onChange$: QRL<(checked: boolean) => void>;
  class?: string;
}

/**
 * Native checkbox styled to the token set, for row and select-all controls.
 * `indeterminate` is a DOM-only property, so it is applied after hydration
 * rather than as an attribute.
 */
export const Checkbox = component$<CheckboxProps>(
  ({
    checked,
    name,
    showLabel,
    disabled,
    indeterminate,
    label,
    onChange$,
    class: className,
  }) => {
    const ref = useSignal<HTMLInputElement>();

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ track }) => {
      const partial = track(() => indeterminate);
      if (ref.value) ref.value.indeterminate = !!partial;
    });

    const input = (
      <input
        ref={ref}
        type="checkbox"
        name={name}
        disabled={disabled}
        checked={checked}
        aria-label={label}
        onChange$={(_, el) => onChange$(el.checked)}
        class={cn(
          "focus-ring accent-accent border-edge-strong h-4 w-4 cursor-pointer rounded-[3px]",
          className,
        )}
      />
    );
    return showLabel ? (
      <label class="text-ink inline-flex items-center gap-2 text-sm">
        {input}
        <span>{label}</span>
      </label>
    ) : (
      input
    );
  },
);
