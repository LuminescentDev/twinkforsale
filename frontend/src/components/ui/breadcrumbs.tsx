import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { ChevronRight } from "lucide-icons-qwik";
import type { Crumb } from "~/lib/dashboard-nav";
import { cn } from "~/lib/utils";

export interface BreadcrumbsProps {
  crumbs: Crumb[];
  class?: string;
}

/**
 * Top-bar breadcrumb trail. The final crumb (no href) is styled as the
 * current page. Built from `resolveBreadcrumbs(pathname)`.
 */
export const Breadcrumbs = component$<BreadcrumbsProps>(
  ({ crumbs, class: className }) => {
    return (
      <nav
        aria-label="Breadcrumb"
        class={cn("flex min-w-0 items-center gap-1.5 text-sm", className)}
      >
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <span key={i} class="flex min-w-0 items-center gap-1.5">
              {i > 0 && (
                <ChevronRight class="text-theme-text-muted h-3.5 w-3.5 shrink-0" />
              )}
              {c.href && !last ? (
                <Link
                  href={c.href}
                  class="text-theme-text-muted hover:text-theme-text-primary truncate transition-colors"
                >
                  {c.label}
                </Link>
              ) : (
                <span class="text-theme-text-primary truncate font-semibold">
                  {c.label}
                </span>
              )}
            </span>
          );
        })}
      </nav>
    );
  },
);
