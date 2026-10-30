import { component$, Slot, type QRL } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { cn } from "~/lib/utils";

type Variant = "ghost" | "outline" | "danger";
type Size = "sm" | "md";

export interface IconButtonProps {
  variant?: Variant;
  size?: Size;
  href?: string;
  external?: boolean;
  type?: "button" | "submit" | "reset";
  onClick$?: QRL<() => void>;
  /** Required: icon-only controls must carry an accessible name. */
  label: string;
  /** Show `label` as a native tooltip too. Defaults to true. */
  tooltip?: boolean;
  disabled?: boolean;
  pressed?: boolean;
  "aria-expanded"?: boolean;
  "aria-controls"?: string;
  "aria-haspopup"?: "menu" | "dialog" | "true";
  class?: string;
}

const sizeMap: Record<Size, string> = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
};

const variantMap: Record<Variant, string> = {
  ghost:
    "border-transparent text-ink-muted hover:bg-surface-hover hover:text-ink",
  outline:
    "retro-bevel border-edge-strong bg-surface-subtle text-ink hover:bg-surface-hover",
  danger: "border-transparent text-danger hover:bg-danger-soft",
};

/** Square icon-only control. The accessible name is mandatory, not optional. */
export const IconButton = component$<IconButtonProps>((props) => {
  const {
    variant = "ghost",
    size = "md",
    href,
    external,
    type = "button",
    onClick$,
    label,
    tooltip = true,
    disabled,
    pressed,
    class: className,
  } = props;

  const classes = cn(
    "focus-ring rounded-control inline-flex shrink-0 items-center justify-center border-2 transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55",
    sizeMap[size],
    variantMap[variant],
    pressed && "bg-accent-soft text-accent-text",
    className,
  );
  const title = tooltip ? label : undefined;

  if (href && !disabled) {
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
      aria-pressed={pressed}
      aria-expanded={props["aria-expanded"]}
      aria-controls={props["aria-controls"]}
      aria-haspopup={props["aria-haspopup"]}
      class={classes}
    >
      <Slot />
    </button>
  );
});
