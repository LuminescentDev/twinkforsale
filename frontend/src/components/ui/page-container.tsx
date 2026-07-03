import { component$, Slot } from "@builder.io/qwik";
import { cn } from "~/lib/utils";

export interface PageContainerProps {
  /**
   * Content width. The site layout (routes/layout.tsx) already provides the
   * outer `max-w-7xl` gutter + padding, so pages should NOT add their own
   * `min-h-screen`/background/max-width wrappers. Use this only to constrain
   * a page to a narrower reading width (settings, legal, forms).
   */
  width?: "wide" | "narrow";
  class?: string;
}

const widthMap: Record<NonNullable<PageContainerProps["width"]>, string> = {
  wide: "",
  narrow: "mx-auto max-w-4xl",
};

/**
 * Optional inner constraint for pages that need a narrower column. Renders a
 * plain wrapper — never re-adds background or full-height, which the shared
 * layout already owns.
 */
export const PageContainer = component$<PageContainerProps>(
  ({ width = "wide", class: className }) => {
    return (
      <div class={cn(widthMap[width], className)}>
        <Slot />
      </div>
    );
  },
);
