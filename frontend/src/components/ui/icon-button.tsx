import { component$, Slot, type QRL } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { cn } from "~/lib/utils";

type Variant = "ghost" | "glass" | "solid" | "danger";
type Size = "sm" | "md";

export interface IconButtonProps {
  variant?: Variant;
  size?: Size;
  /** Internal <Link> when a path is given, or plain <a> when external. */
  href?: string;
  external?: boolean;
  type?: "button" | "submit" | "reset";
  onClick$?: QRL<() => void>;
  title?: string;
  "aria-label"?: string;
  disabled?: boolean;
  class?: string;
}

const sizeMap: Record<Size, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
};

const variantMap: Record<Variant, string> = {
  ghost:
    "text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary/30",
  glass: "glass text-theme-text-secondary hover:text-theme-text-primary",
  solid: "btn-cute text-white",
  danger: "text-theme-error hover:bg-theme-error/10",
};

/**
 * Square icon-only button/link with consistent sizing and theme-driven
 * variants. Replaces the many hand-rolled `rounded-full p-2 hover:bg-white/10`
 * icon buttons scattered across pages.
 */
export const IconButton = component$<IconButtonProps>((props) => {
  const {
    variant = "ghost",
    size = "md",
    href,
    external,
    type = "button",
    onClick$,
    title,
    disabled,
    class: className,
  } = props;

  const classes = cn(
    "inline-flex shrink-0 items-center justify-center rounded-xl transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50",
    sizeMap[size],
    variantMap[variant],
    className,
  );
  const label = props["aria-label"] ?? title;

  if (href) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title={title}
          aria-label={label}
          class={classes}
        >
          <Slot />
        </a>
      );
    }
    return (
      <Link href={href} title={title} aria-label={label} class={classes}>
        <Slot />
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick$={onClick$}
      disabled={disabled}
      title={title}
      aria-label={label}
      class={classes}
    >
      <Slot />
    </button>
  );
});
