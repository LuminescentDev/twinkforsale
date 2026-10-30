import { component$, Slot, type QRL } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { Loader2 } from "lucide-icons-qwik";
import { cn } from "~/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Internal <Link> for app paths; set `external` for a plain <a>. */
  href?: string;
  external?: boolean;
  download?: string | boolean;
  type?: "button" | "submit" | "reset";
  onClick$?: QRL<() => void>;
  disabled?: boolean;
  /** Shows a spinner and blocks interaction; keeps the label so width is stable. */
  loading?: boolean;
  block?: boolean;
  title?: string;
  "aria-label"?: string;
  "aria-expanded"?: boolean;
  "aria-controls"?: string;
  class?: string;
}

const base =
  "focus-ring rounded-control inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55";

const sizeMap: Record<ButtonSize, string> = {
  sm: "h-8 px-2.5 text-[13px]",
  md: "h-9 px-3.5 text-sm",
  lg: "h-11 px-5 text-[15px]",
};

const variantMap: Record<ButtonVariant, string> = {
  primary:
    "retro-bevel border-accent bg-accent text-on-accent hover:bg-accent-hover",
  secondary:
    "retro-bevel border-edge-strong bg-surface-subtle text-ink hover:bg-surface-hover",
  ghost:
    "border-2 border-transparent text-ink-muted hover:bg-surface-hover hover:text-ink",
  danger:
    "retro-bevel border-danger-fill bg-danger-fill text-white hover:bg-danger-fill-hover",
};

/**
 * The application's one button: a bevelled rectangle that presses in when
 * clicked. Hierarchy comes from the variant, never from size or decoration.
 */
export const Button = component$<ButtonProps>((props) => {
  const {
    variant = "secondary",
    size = "md",
    href,
    external,
    download,
    type = "button",
    onClick$,
    disabled,
    loading,
    block,
    title,
    class: className,
  } = props;

  const classes = cn(
    base,
    sizeMap[size],
    variantMap[variant],
    block && "w-full",
    className,
  );

  const iconSize = size === "lg" ? "h-4.5 w-4.5" : "h-4 w-4";

  if (href && !disabled && !loading) {
    const shared = {
      class: classes,
      title,
      "aria-label": props["aria-label"],
    };
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          download={download}
          {...shared}
        >
          <Slot />
        </a>
      );
    }
    return (
      <Link href={href} {...shared}>
        <Slot />
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick$={onClick$}
      disabled={disabled || loading}
      title={title}
      aria-label={props["aria-label"]}
      aria-expanded={props["aria-expanded"]}
      aria-controls={props["aria-controls"]}
      aria-busy={loading}
      class={classes}
    >
      {loading && <Loader2 class={cn(iconSize, "animate-spin")} />}
      <Slot />
    </button>
  );
});
