import { component$, useSignal, $ } from "@builder.io/qwik";
import { Copy, Check } from "lucide-icons-qwik";
import { cn } from "~/lib/utils";

export interface CopyButtonProps {
  /** Text copied to the clipboard on click. */
  value: string;
  /** Optional visible label; icon-only when omitted. */
  label?: string;
  size?: "sm" | "md";
  class?: string;
}

/**
 * Copy-to-clipboard button with a transient "Copied!" confirmation. Used
 * everywhere a short URL / key / snippet needs copying, so the interaction
 * is consistent instead of every page rolling its own.
 */
export const CopyButton = component$<CopyButtonProps>(
  ({ value, label, size = "sm", class: className }) => {
    const copied = useSignal(false);
    const copy = $(async () => {
      try {
        await navigator.clipboard.writeText(value);
        copied.value = true;
        setTimeout(() => (copied.value = false), 1500);
      } catch {
        /* clipboard unavailable — ignore */
      }
    });
    const Icon = copied.value ? Check : Copy;
    return (
      <button
        type="button"
        onClick$={copy}
        class={cn(
          "inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors duration-200",
          size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm",
          copied.value
            ? "text-theme-success"
            : "text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary/30",
          className,
        )}
      >
        <Icon class={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
        {label && <span>{copied.value ? "Copied!" : label}</span>}
      </button>
    );
  },
);
