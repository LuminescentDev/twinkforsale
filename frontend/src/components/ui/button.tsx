import { component$, Slot, type QRL } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { cn } from "~/lib/utils";

type Variant = "primary" | "ghost" | "confirm" | "danger" | "glass";
type Size = "sm" | "md" | "lg";

export interface ButtonProps {
  variant?: Variant;
  size?: Size;
  /** Fully rounded pill shape (default true for primary CTAs). */
  pill?: boolean;
  /** Renders an internal <Link> when set to an app path, else a plain <a>. */
  href?: string;
  /** External link target. */
  external?: boolean;
  type?: "button" | "submit" | "reset";
  onClick$?: QRL<() => void>;
  disabled?: boolean;
  block?: boolean;
  class?: string;
}

const base =
  "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50";

const sizeMap: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm sm:text-base",
  lg: "px-6 py-3 text-base sm:px-8 sm:py-4 sm:text-lg",
};

const variantMap: Record<Variant, string> = {
  primary: "btn-cute text-white",
  glass:
    "glass text-theme-text-primary hover:bg-theme-bg-tertiary/20",
  ghost:
    "text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary/20",
  confirm:
    "text-white bg-theme-confirm hover:bg-theme-confirm-hover shadow-sm",
  danger: "text-white bg-theme-deny hover:bg-theme-deny-hover shadow-sm",
};

/**
 * Unified button/link. Standardizes the `btn-cute` usage, radius, sizing and
 * disabled states that were previously copy-pasted with inconsistent values
 * (rounded-full vs rounded-lg vs rounded-xl) across every page.
 */
export const Button = component$<ButtonProps>((props) => {
  const {
    variant = "primary",
    size = "md",
    pill = true,
    href,
    external,
    type = "button",
    onClick$,
    disabled,
    block,
    class: className,
  } = props;

  const classes = cn(
    base,
    sizeMap[size],
    variantMap[variant],
    pill ? "rounded-full" : "rounded-xl",
    block && "w-full",
    className,
  );

  if (href) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          class={classes}
        >
          <Slot />
        </a>
      );
    }
    return (
      <Link href={href} class={classes}>
        <Slot />
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick$={onClick$}
      disabled={disabled}
      class={classes}
    >
      <Slot />
    </button>
  );
});
