import { component$, Slot } from "@builder.io/qwik";
import { cn } from "~/lib/utils";

export interface CardProps {
  /** Visual style: solid gradient card or translucent glass. */
  variant?: "solid" | "glass";
  /** Lift + glow on hover (for interactive/linked cards). */
  hover?: boolean;
  /** Padding scale. */
  padding?: "none" | "sm" | "md" | "lg";
  class?: string;
}

const paddingMap: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "",
  sm: "p-4",
  md: "p-4 sm:p-6",
  lg: "p-6 sm:p-8",
};

/**
 * Standard surface used across the app. Wraps the existing `card-cute` /
 * `glass` helpers with a consistent radius and padding scale so pages stop
 * hand-rolling `card-cute rounded-3xl p-8` variations.
 */
export const Card = component$<CardProps>(
  ({ variant = "solid", hover = false, padding = "md", class: className }) => {
    return (
      <div
        class={cn(
          "rounded-2xl",
          variant === "glass"
            ? "glass"
            : hover
              ? "card-cute"
              : "card-static",
          paddingMap[padding],
          className,
        )}
      >
        <Slot />
      </div>
    );
  },
);
