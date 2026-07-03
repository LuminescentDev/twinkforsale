import { component$ } from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";
import { adminNav, dashboardNav, isNavItemActive } from "~/lib/dashboard-nav";
import { useCurrentUser } from "~/routes/layout";

/**
 * Persistent, grouped dashboard sidebar (desktop only). The ~9 destinations
 * that used to be crammed into the top bar live here under labelled groups so
 * the current section is always obvious. On mobile the same links are reached
 * through the top-nav menu, so this is hidden below `lg`.
 */
export const DashboardSidebar = component$(() => {
  const location = useLocation();
  const user = useCurrentUser();
  const pathname = location.url.pathname;

  // Calmer active state: an accent-tinted pill with a left accent bar, instead
  // of a full gradient button that pops off the panel.
  const linkClass = (active: boolean) =>
    [
      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-200",
      active
        ? "text-theme-accent-primary bg-theme-accent-primary/10 border-theme-accent-primary/40 border-l-2"
        : "text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary/30",
    ].join(" ");

  return (
    <aside class="hidden w-56 shrink-0 lg:block">
      <nav class="sticky top-24 space-y-6">
        {dashboardNav.map((group) => (
          <div key={group.title}>
            <div class="text-theme-text-muted mb-2 px-3 text-xs font-semibold tracking-wider uppercase">
              {group.title}
            </div>
            <div class="space-y-1">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  class={linkClass(isNavItemActive(pathname, item))}
                >
                  <item.icon class="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}

        {user.value?.isAdmin && (
          <div>
            <div class="text-theme-text-muted mb-2 px-3 text-xs font-semibold tracking-wider uppercase">
              Admin
            </div>
            <div class="space-y-1">
              {adminNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  class={linkClass(isNavItemActive(pathname, item))}
                >
                  <item.icon class="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
});
