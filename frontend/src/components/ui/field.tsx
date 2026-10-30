import {
  component$,
  Slot,
  useId,
  type QwikIntrinsicElements,
} from "@builder.io/qwik";
import { AlertCircle } from "lucide-icons-qwik";
import { cn } from "~/lib/utils";

const control =
  "focus-ring rounded-control border-edge-strong bg-surface text-ink placeholder:text-ink-muted w-full border-2 px-2.5 [border-style:inset] text-sm transition-colors duration-150 hover:border-edge-strong disabled:cursor-not-allowed disabled:opacity-55 aria-[invalid=true]:border-danger";

export interface FieldProps {
  /** Persistent label. Never a placeholder standing in for a label. */
  label: string;
  /** Ties label/help/error to the control. Generated when omitted. */
  for?: string;
  /** Guidance shown directly under the control. */
  help?: string;
  /** Validation message. Replaces `help` and marks the control invalid. */
  error?: string;
  required?: boolean;
  /** Hide the label visually but keep it for assistive technology. */
  hideLabel?: boolean;
  class?: string;
}

/**
 * Label + control + adjacent help/error. Pass the resolved ids through to the
 * control with `fieldIds()` so the association is real, not visual.
 */
export const Field = component$<FieldProps>(
  ({
    label,
    for: htmlFor,
    help,
    error,
    required,
    hideLabel,
    class: className,
  }) => {
    const generated = useId();
    const id = htmlFor ?? generated;
    return (
      <div class={cn("min-w-0", className)}>
        <label
          for={id}
          class={cn(
            "text-ink mb-1.5 block text-[13px] font-semibold",
            hideLabel && "sr-only",
          )}
        >
          {label}
          {required && (
            <span class="text-danger ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </label>
        <Slot />
        {error ? (
          <p
            id={`${id}-error`}
            role="alert"
            class="text-danger mt-1.5 flex items-start gap-1.5 text-xs leading-4"
          >
            <AlertCircle class="mt-px h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : (
          help && (
            <p
              id={`${id}-help`}
              class="text-ink-muted mt-1.5 text-xs leading-4"
            >
              {help}
            </p>
          )
        )}
      </div>
    );
  },
);

/** Describedby/invalid attributes matching a `Field` with the same id. */
export function fieldIds(id: string, opts: { help?: string; error?: string }) {
  return {
    id,
    "aria-invalid": opts.error ? true : undefined,
    "aria-describedby": opts.error
      ? `${id}-error`
      : opts.help
        ? `${id}-help`
        : undefined,
  };
}

type InputProps = QwikIntrinsicElements["input"] & { class?: string };
type TextareaProps = QwikIntrinsicElements["textarea"] & { class?: string };
type SelectProps = QwikIntrinsicElements["select"] & { class?: string };

export const Input = component$<InputProps>(({ class: className, ...rest }) => (
  <input {...rest} class={cn(control, "h-9", className)} />
));

export const Textarea = component$<TextareaProps>(
  ({ class: className, ...rest }) => (
    <textarea
      {...rest}
      class={cn(control, "resize-y py-2 leading-5", className)}
    />
  ),
);

export const Select = component$<SelectProps>(
  ({ class: className, ...rest }) => (
    <select {...rest} class={cn(control, "h-9 cursor-pointer pr-8", className)}>
      <Slot />
    </select>
  ),
);

/** Monospace variant for URLs, codes, keys and other technical values. */
export const CodeInput = component$<InputProps>(
  ({ class: className, ...rest }) => (
    <input
      {...rest}
      spellcheck={false}
      autoComplete="off"
      class={cn(control, "h-9 font-mono text-[13px]", className)}
    />
  ),
);

export interface FieldsetProps {
  legend: string;
  help?: string;
  class?: string;
}

/** Groups related controls without drawing another container. */
export const Fieldset = component$<FieldsetProps>(
  ({ legend, help, class: className }) => (
    <fieldset class={cn("min-w-0", className)}>
      <legend class="text-ink text-[13px] font-semibold">{legend}</legend>
      {help && <p class="text-ink-muted mt-1 text-xs leading-4">{help}</p>}
      <div class="mt-2">
        <Slot />
      </div>
    </fieldset>
  ),
);
