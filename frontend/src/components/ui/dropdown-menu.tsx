import { component$, Slot, useSignal, type QRL } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { cn } from "~/lib/utils";

export interface DropdownMenuProps {
  align?: "left" | "right";
  class?: string;
}

/**
 * Lightweight popover menu. Put the trigger in the `trigger` slot and the menu
 * body (usually <MenuItem>s) in the default slot. Opens on trigger click,
 * closes on outside click or when any item is selected.
 */
export const DropdownMenu = component$<DropdownMenuProps>(
  ({ align = "right", class: className }) => {
    const open = useSignal(false);
    return (
      <div class={cn("relative", className)}>
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open.value}
          onClick$={() => (open.value = !open.value)}
          class="flex items-center"
        >
          <Slot name="trigger" />
        </button>
        {open.value && (
          <>
            <div
              class="fixed inset-0 z-40"
              onClick$={() => (open.value = false)}
            />
            <div
              role="menu"
              onClick$={() => (open.value = false)}
              class={cn(
                "glass border-theme-card-border absolute z-50 mt-2 min-w-48 rounded-2xl border p-1.5 shadow-xl",
                align === "right" ? "right-0" : "left-0",
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
  class?: string;
}

export const MenuItem = component$<MenuItemProps>(
  ({ href, external, onClick$, tone = "default", icon: Icon, class: className }) => {
    const classes = cn(
      "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors",
      tone === "danger"
        ? "text-theme-error hover:bg-theme-error/10"
        : "text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary/30",
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
            {Icon && <Icon class="h-4 w-4 shrink-0" />}
            <span class="truncate">
              <Slot />
            </span>
          </a>
        );
      }
      return (
        <Link href={href} class={classes}>
          {Icon && <Icon class="h-4 w-4 shrink-0" />}
          <span class="truncate">
            <Slot />
          </span>
        </Link>
      );
    }
    return (
      <button type="button" onClick$={onClick$} class={classes}>
        {Icon && <Icon class="h-4 w-4 shrink-0" />}
        <span class="truncate">
          <Slot />
        </span>
      </button>
    );
  },
);
