import {
  component$,
  Slot,
  useId,
  useSignal,
  $,
  type QRL,
} from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { cn } from "~/lib/utils";

export interface DropdownMenuProps {
  align?: "left" | "right";
  class?: string;
  /** Extra classes for the popup itself (width, max-height). */
  menuClass?: string;
  /** Extra classes for the trigger button. The `trigger` slot holds its content. */
  triggerClass?: string;
  /** Accessible name when the trigger slot is icon-only. */
  triggerLabel?: string;
}

/**
 * Compact popover menu anchored to its trigger. Put the trigger in the
 * `trigger` slot and `MenuItem`s in the default slot. Escape closes and
 * returns focus to the trigger; an outside click dismisses.
 */
export const DropdownMenu = component$<DropdownMenuProps>(
  ({
    align = "right",
    class: className,
    menuClass,
    triggerClass,
    triggerLabel,
  }) => {
    const open = useSignal(false);
    const triggerRef = useSignal<HTMLButtonElement>();
    const id = useId();

    const close = $(() => {
      open.value = false;
      triggerRef.value?.focus();
    });

    return (
      <div
        class={cn("relative", className)}
        onKeyDown$={(event) => {
          if (event.key === "Escape" && open.value) {
            event.stopPropagation();
            close();
          }
        }}
      >
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={open.value}
          aria-controls={open.value ? id : undefined}
          aria-label={triggerLabel}
          title={triggerLabel}
          onClick$={() => (open.value = !open.value)}
          class={cn(
            "focus-ring rounded-control flex items-center transition-colors duration-150",
            triggerClass,
          )}
        >
          <Slot name="trigger" />
        </button>
        {open.value && (
          <>
            <div class="fixed inset-0 z-40" onClick$={close} />
            <div
              id={id}
              role="menu"
              onClick$={() => (open.value = false)}
              class={cn(
                "rounded-surface border-edge bg-surface shadow-pop absolute z-50 mt-1 min-w-52 border p-1",
                align === "right" ? "right-0" : "left-0",
                menuClass,
              )}
            >
              <Slot />
            </div>
          </>
        )}
      </div>
    );
  },
);

export interface MenuItemProps {
  href?: string;
  external?: boolean;
  onClick$?: QRL<() => void>;
  tone?: "default" | "danger";
  icon?: any;
  disabled?: boolean;
  class?: string;
}

export const MenuItem = component$<MenuItemProps>(
  ({
    href,
    external,
    onClick$,
    tone = "default",
    icon: Icon,
    disabled,
    class: className,
  }) => {
    const classes = cn(
      "focus-ring rounded-control flex w-full items-center gap-2.5 px-2.5 py-1.5 text-left text-[13px] transition-colors duration-150",
      tone === "danger"
        ? "text-danger hover:bg-danger-soft"
        : "text-ink hover:bg-surface-hover",
      disabled && "pointer-events-none opacity-55",
      className,
    );
    const body = (
      <>
        {Icon && <Icon class="h-4 w-4 shrink-0" aria-hidden="true" />}
        <span class="truncate">
          <Slot />
        </span>
      </>
    );

    if (href && !disabled) {
      if (external) {
        return (
          <a
            role="menuitem"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            class={classes}
          >
            {body}
          </a>
        );
      }
      return (
        <Link role="menuitem" href={href} class={classes}>
          {body}
        </Link>
      );
    }
    return (
      <button
        role="menuitem"
        type="button"
        onClick$={onClick$}
        disabled={disabled}
        class={classes}
      >
        {body}
      </button>
    );
  },
);

/** Separates an action group — in particular, destructive actions. */
export const MenuSeparator = component$(() => (
  <hr class="border-edge my-1 border-t" role="separator" />
));

/** Non-interactive label above a group of items. */
export const MenuLabel = component$(() => (
  <div class="text-ink-muted px-2.5 pt-1.5 pb-1 text-[11px] font-medium tracking-wide uppercase">
    <Slot />
  </div>
));
