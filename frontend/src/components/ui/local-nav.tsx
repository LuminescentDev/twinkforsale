import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { cn } from "~/lib/utils";

export interface LocalNavItem {
  /** A route path, or a `#section` anchor within the current page. */
  href: string;
  label: string;
  icon?: any;
  /** Small trailing count, e.g. pending users. */
  count?: number;
}

export interface LocalNavProps {
  /** Names the group, e.g. "Admin sections". */
  label: string;
  items: LocalNavItem[];
  /** Href of the current section. */
  current: string;
  /** Width at which the rail becomes vertical. Below it, a scrolling row. */
  stackAt?: "md" | "xl";
  class?: string;
}

/**
 * Section navigation inside a route group (admin, settings). A vertical rail
 * on wide screens; a horizontally scrollable row below `md`, where a second
 * vertical rail would eat the working width.
 */
export const LocalNav = component$<LocalNavProps>(
  ({ label, items, current, stackAt = "md", class: className }) => (
    <nav aria-label={label} class={cn("min-w-0", className)}>
      <ul
        class={cn(
          "border-edge -mx-4 flex gap-1 overflow-x-auto border-b px-4 pb-2",
          stackAt === "md"
            ? "md:mx-0 md:flex-col md:border-b-0 md:px-0 md:pb-0"
            : "xl:mx-0 xl:flex-col xl:border-b-0 xl:px-0 xl:pb-0",
        )}
      >
        {items.map((item) => {
          const active = item.href === current;
          const isAnchor = item.href.startsWith("#");
          const Anchor: any = isAnchor ? "a" : Link;
          return (
            <li
              key={item.href}
              class={cn(
                "shrink-0",
                stackAt === "md" ? "md:shrink" : "xl:shrink",
              )}
            >
              <Anchor
                href={item.href}
                aria-current={active ? "page" : undefined}
                class={cn(
                  "focus-ring rounded-control flex items-center gap-2 px-2.5 py-1.5 text-[13px] transition-colors duration-150",
                  active
                    ? "bg-accent-soft text-accent-text font-medium"
                    : "text-ink-muted hover:bg-surface-hover hover:text-ink",
                )}
              >
                {item.icon && (
                  <item.icon class="h-4 w-4 shrink-0" aria-hidden="true" />
                )}
                <span class="truncate">{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span class="bg-surface-subtle text-ink-muted border-edge ml-auto rounded-full border px-1.5 text-[11px] leading-4">
                    {item.count}
                  </span>
                )}
              </Anchor>
            </li>
          );
        })}
      </ul>
    </nav>
  ),
);
