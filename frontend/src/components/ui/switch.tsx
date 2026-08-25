import { component$, useId, type QRL } from "@builder.io/qwik";
import { cn } from "~/lib/utils";

export interface SwitchProps {
  checked: boolean;
  onChange$: QRL<(checked: boolean) => void>;
  /** Always visible — a switch without a label is not identifiable. */
  label: string;
  /** Short explanation of what turning it on does. */
  help?: string;
  disabled?: boolean;
  class?: string;
}

/**
 * Labelled on/off control. Built on a native checkbox so keyboard, form and
 * screen-reader behaviour come for free; the track is one of the few places
 * full rounding is correct.
 */
export const Switch = component$<SwitchProps>(
  ({ checked, onChange$, label, help, disabled, class: className }) => {
    const id = useId();
    return (
      <div class={cn("flex items-start gap-3", className)}>
        <label
          class={cn(
            "relative mt-0.5 inline-flex shrink-0 cursor-pointer",
            disabled && "cursor-not-allowed opacity-55",
          )}
        >
          <input
            id={id}
            type="checkbox"
            role="switch"
            class="peer sr-only"
            checked={checked}
            disabled={disabled}
            aria-describedby={help ? `${id}-help` : undefined}
            onChange$={(_, el) => onChange$(el.checked)}
          />
          <span
            aria-hidden="true"
            class="border-edge-strong bg-surface-subtle peer-checked:bg-accent peer-checked:border-accent peer-focus-visible:outline-accent-text block h-5 w-9 rounded-full border transition-colors duration-150 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2"
          />
          <span
            aria-hidden="true"
            class="bg-ink-muted peer-checked:bg-on-accent pointer-events-none absolute top-[3px] left-[3px] h-3.5 w-3.5 rounded-full transition-transform duration-150 peer-checked:translate-x-4"
          />
        </label>
        <div class="min-w-0">
          <label
            for={id}
            class={cn(
              "text-ink block cursor-pointer text-[13px] leading-5 font-medium",
              disabled && "cursor-not-allowed opacity-55",
            )}
          >
            {label}
          </label>
          {help && (
            <p
              id={`${id}-help`}
              class="text-ink-muted mt-0.5 text-xs leading-4"
            >
              {help}
            </p>
          )}
        </div>
      </div>
    );
  },
);
