import {
  component$,
  Slot,
  type QwikIntrinsicElements,
} from "@builder.io/qwik";
import { cn } from "~/lib/utils";

const fieldBase =
  "w-full rounded-xl border border-theme-card-border bg-theme-bg-secondary/50 px-3 py-2 text-theme-text-primary placeholder:text-theme-text-muted transition-colors focus:border-theme-accent-primary focus:outline-none focus:ring-2 focus:ring-theme-accent-primary/30";

type InputProps = QwikIntrinsicElements["input"] & { class?: string };
type TextareaProps = QwikIntrinsicElements["textarea"] & { class?: string };
type SelectProps = QwikIntrinsicElements["select"] & { class?: string };

/** Theme-aware text input. Standardizes the focus/border/background styling
 *  that was previously copy-pasted per page. Forwards all native attributes. */
export const Input = component$<InputProps>(({ class: className, ...rest }) => {
  return <input {...rest} class={cn(fieldBase, className)} />;
});

export const Textarea = component$<TextareaProps>(
  ({ class: className, ...rest }) => {
    return <textarea {...rest} class={cn(fieldBase, "resize-y", className)} />;
  },
);

export const Select = component$<SelectProps>(
  ({ class: className, ...rest }) => {
    return (
      <select {...rest} class={cn(fieldBase, "cursor-pointer", className)}>
        <Slot />
      </select>
    );
  },
);

export interface FieldLabelProps {
  for?: string;
  class?: string;
}

/** Consistent form label. */
export const FieldLabel = component$<FieldLabelProps>(
  ({ for: htmlFor, class: className }) => {
    return (
      <label
        for={htmlFor}
        class={cn(
          "text-theme-text-primary mb-2 block text-sm font-medium",
          className,
        )}
      >
        <Slot />
      </label>
    );
  },
);
