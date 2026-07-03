import { component$, Slot } from "@builder.io/qwik";
import { cn } from "~/lib/utils";

export interface SectionProps {
  /** Optional section heading. */
  title?: string;
  icon?: any;
  align?: "center" | "left";
  class?: string;
}

/**
 * A titled content section with consistent vertical rhythm. Replaces the
 * repeated `<h2 class="text-gradient-cute ...">` + ad-hoc margins pattern.
 */
export const Section = component$<SectionProps>(
  ({ title, icon: Icon, align = "left", class: className }) => {
    return (
      <section class={cn("mb-6 sm:mb-8", className)}>
        {title && (
          <h2
            class={cn(
              "text-gradient-cute mb-4 flex items-center gap-2 text-xl font-bold sm:mb-6 sm:text-2xl",
              align === "center" && "justify-center text-center",
            )}
          >
            {Icon && <Icon class="text-theme-accent-primary h-5 w-5" />}
            {title}
          </h2>
        )}
        <Slot />
      </section>
    );
  },
);
