import { component$, Slot } from "@builder.io/qwik";
import { Info, CheckCircle2, AlertTriangle, CircleX } from "lucide-icons-qwik";
import { cn } from "~/lib/utils";

export type CalloutTone = "info" | "success" | "warning" | "danger";

export interface CalloutProps {
  tone?: CalloutTone;
  /** Short, direct. Omit when the body is a single sentence. */
  title?: string;
  class?: string;
}

const toneMap: Record<CalloutTone, { box: string; icon: string; glyph: any }> =
  {
    info: {
      box: "bg-info-soft border-info/30",
      icon: "text-info",
      glyph: Info,
    },
    success: {
      box: "bg-success-soft border-success/30",
      icon: "text-success",
      glyph: CheckCircle2,
    },
    warning: {
      box: "bg-warning-soft border-warning/30",
      icon: "text-warning",
      glyph: AlertTriangle,
    },
    danger: {
      box: "bg-danger-soft border-danger/30",
      icon: "text-danger",
      glyph: CircleX,
    },
  };

/**
 * A note that genuinely warrants attention — a blocked account, a limit
 * reached, a failure that persists. Not a wrapper for routine explanation.
 */
export const Callout = component$<CalloutProps>(
  ({ tone = "info", title, class: className }) => {
    const t = toneMap[tone];
    const Glyph = t.glyph;
    return (
      <div
        class={cn(
          "rounded-surface flex items-start gap-2.5 border px-3 py-2.5",
          t.box,
          className,
        )}
      >
        <Glyph
          class={cn("mt-0.5 h-4 w-4 shrink-0", t.icon)}
          aria-hidden="true"
        />
        <div class="min-w-0 flex-1">
          {title && (
            <p class="text-ink text-[13px] leading-5 font-semibold">{title}</p>
          )}
          <div
            class={cn(
              "text-ink-muted text-[13px] leading-5",
              title && "mt-0.5",
            )}
          >
            <Slot />
          </div>
          <div class="mt-2 flex flex-wrap gap-2 empty:hidden">
            <Slot name="actions" />
          </div>
        </div>
      </div>
    );
  },
);
