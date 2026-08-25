import { component$, Slot } from "@builder.io/qwik";
import { cn } from "~/lib/utils";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional Lucide icon shown beside the title. */
  icon?: any;
  /** Legal pages are left-aligned; retained for compatibility. */
  align?: "center" | "left";
  class?: string;
}

/** Shared heading for the long-form legal routes. */
export const PageHeader = component$<PageHeaderProps>(
  ({ title, subtitle, icon: Icon, align = "left", class: className }) => {
    const centered = align === "center";
    return (
      <div
        class={cn(
          "mb-7 sm:mb-9",
          centered
            ? "text-center"
            : "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
          className,
        )}
      >
        <div class={cn(centered && "flex flex-col items-center")}>
          <h1
            class={cn(
              "text-ink flex items-center gap-3 text-3xl leading-9 font-semibold tracking-[-0.02em]",
              centered && "justify-center",
            )}
          >
            {Icon && (
              <span class="bg-accent-soft text-accent-text rounded-surface inline-flex h-9 w-9 items-center justify-center">
                <Icon class="h-5 w-5" />
              </span>
            )}
            {title}
          </h1>
          {subtitle && (
            <p class="text-ink-muted mt-2 max-w-2xl text-sm leading-6 sm:text-base">
              {subtitle}
            </p>
          )}
        </div>
        <Slot name="actions" />
      </div>
    );
  },
);
