import { component$, useSignal, $ } from "@builder.io/qwik";
import { Copy, Check } from "lucide-icons-qwik";
import { cn } from "~/lib/utils";

export interface CopyButtonProps {
  value: string;
  /** Visible label. Keep "Copy link" spelled out on file rows. */
  label?: string;
  /** Accessible name when there is no visible label. */
  title?: string;
  size?: "sm" | "md";
  variant?: "ghost" | "secondary";
  class?: string;
}

/**
 * Copy to clipboard with a transient confirmation. The label stays in place
 * while confirming, so the row does not reflow.
 */
export const CopyButton = component$<CopyButtonProps>(
  ({
    value,
    label,
    title,
    size = "sm",
    variant = "ghost",
    class: className,
  }) => {
    const copied = useSignal(false);
    const failed = useSignal(false);

    const copy = $(async () => {
      try {
        await navigator.clipboard.writeText(value);
        copied.value = true;
        failed.value = false;
        setTimeout(() => (copied.value = false), 1600);
      } catch {
        failed.value = true;
        setTimeout(() => (failed.value = false), 3000);
      }
    });

    const Icon = copied.value ? Check : Copy;
    const accessibleName = title ?? (label ? undefined : "Copy to clipboard");

    return (
      <button
        type="button"
        onClick$={copy}
        aria-label={accessibleName}
        title={accessibleName}
        class={cn(
          "focus-ring rounded-control inline-flex items-center justify-center gap-1.5 border font-medium whitespace-nowrap transition-colors duration-150",
          size === "sm" ? "h-8 text-[13px]" : "h-9 text-sm",
          label ? "px-2.5" : size === "sm" ? "w-8" : "w-9",
          variant === "secondary"
            ? "border-edge bg-surface text-ink hover:bg-surface-hover"
            : "text-ink-muted hover:bg-surface-hover hover:text-ink border-transparent",
          copied.value && "text-success",
          failed.value && "text-danger",
          className,
        )}
      >
        <Icon class="h-4 w-4 shrink-0" aria-hidden="true" />
        {label && (
          <span aria-live="polite">
            {copied.value ? "Copied" : failed.value ? "Copy failed" : label}
          </span>
        )}
      </button>
    );
  },
);
