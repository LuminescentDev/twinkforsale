import { component$, Slot } from "@builder.io/qwik";
import { cn } from "~/lib/utils";

type Tone = "info" | "success" | "warning" | "danger" | "accent";

export interface CalloutProps {
  tone?: Tone;
  title?: string;
  icon?: any;
  class?: string;
}

// Theme-driven note boxes — replaces bg-{blue,yellow,red,green}-500/10 blocks.
const toneMap: Record<Tone, string> = {
  info: "bg-theme-info/10 border-theme-info/30",
  success: "bg-theme-success/10 border-theme-success/30",
  warning: "bg-theme-warning/10 border-theme-warning/30",
  danger: "bg-theme-error/10 border-theme-error/30",
  accent: "bg-theme-accent-primary/10 border-theme-accent-primary/30",
};

const titleToneMap: Record<Tone, string> = {
  info: "text-theme-info",
  success: "text-theme-success",
  warning: "text-theme-warning",
  danger: "text-theme-error",
  accent: "text-theme-accent-primary",
};

/**
 * Highlighted note/alert box. Consolidates the many themed info panels in the
 * legal pages, upload "Pro Tip", and admin notices into one theme-aware
 * component.
 */
export const Callout = component$<CalloutProps>(
  ({ tone = "info", title, icon: Icon, class: className }) => {
    return (
      <div class={cn("rounded-xl border p-4", toneMap[tone], className)}>
        {(title || Icon) && (
          <div
            class={cn(
              "mb-1 flex items-center gap-2 font-semibold",
              titleToneMap[tone],
            )}
          >
            {Icon && <Icon class="h-4 w-4" />}
            {title}
          </div>
        )}
        <div class="text-theme-text-secondary text-sm leading-relaxed">
          <Slot />
        </div>
      </div>
    );
  },
);
