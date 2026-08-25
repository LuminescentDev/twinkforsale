import { component$, Slot } from "@builder.io/qwik";
import { cn } from "~/lib/utils";

export interface SummaryItem {
  label: string;
  /** Exact value. Format for readability, but never round away precision. */
  value: string | number;
  /** Small qualifier under the value, e.g. "last 30 days". */
  note?: string;
}

export interface SummaryListProps {
  items: SummaryItem[];
  /** Names the group for assistive technology, e.g. "Account totals". */
  label: string;
  class?: string;
}

/**
 * Compact exact-value summary. A description list separated by dividers —
 * deliberately not a row of metric cards, which would compete with the
 * operational content it is meant to support.
 */
export const SummaryList = component$<SummaryListProps>(
  ({ items, label, class: className }) => (
    <dl
      aria-label={label}
      class={cn(
        "border-edge divide-edge rounded-surface bg-surface grid max-w-4xl divide-y border sm:auto-cols-fr sm:grid-flow-col sm:divide-x sm:divide-y-0",
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} class="min-w-0 px-3.5 py-2.5">
          <dt class="text-ink-muted truncate text-xs">{item.label}</dt>
          <dd class="text-ink mt-0.5 text-lg leading-6 font-semibold tabular-nums">
            {item.value}
          </dd>
          {item.note && (
            <p class="text-ink-muted mt-0.5 truncate text-xs">{item.note}</p>
          )}
        </div>
      ))}
    </dl>
  ),
);

export interface MeterProps {
  label: string;
  /** Left side of the value line, e.g. "1.2 GB". */
  used: string;
  /** Right side, e.g. "of 5 GB". */
  total: string;
  percent: number;
  class?: string;
}

/**
 * Storage/quota meter: label, exact values and a bar. Turns warning at 80%
 * and danger at 95%, with the state also stated in the caption.
 */
export const Meter = component$<MeterProps>(
  ({ label, used, total, percent, class: className }) => {
    const pct = Math.max(0, Math.min(100, percent));
    const tone =
      pct >= 95 ? "bg-danger" : pct >= 80 ? "bg-warning" : "bg-accent";
    const state = pct >= 95 ? "Almost full" : pct >= 80 ? "Filling up" : null;
    return (
      <div class={cn("min-w-0", className)}>
        <div class="mb-1 flex items-baseline justify-between gap-2">
          <span class="text-ink-muted text-xs">{label}</span>
          <span class="text-ink text-xs tabular-nums">
            {used} <span class="text-ink-muted">/ {total}</span>
          </span>
        </div>
        <div
          role="progressbar"
          aria-label={label}
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${used} of ${total}`}
          class="bg-surface-subtle border-edge h-1.5 w-full overflow-hidden rounded-full border"
        >
          <div
            class={cn("h-full rounded-full", tone)}
            style={`width:${pct}%`}
          />
        </div>
        {state && (
          <p
            class={cn(
              "mt-1 text-xs",
              pct >= 95 ? "text-danger" : "text-warning",
            )}
          >
            {state}
          </p>
        )}
      </div>
    );
  },
);

export interface DefinitionRowProps {
  term: string;
  class?: string;
}

/** A label/value pair inside a details panel. Value goes in the default slot. */
export const DefinitionRow = component$<DefinitionRowProps>(
  ({ term, class: className }) => (
    <div
      class={cn(
        "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-1.5",
        className,
      )}
    >
      <dt class="text-ink-muted text-[13px]">{term}</dt>
      <dd class="text-ink min-w-0 text-[13px]">
        <Slot />
      </dd>
    </div>
  ),
);
