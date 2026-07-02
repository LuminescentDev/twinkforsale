import { component$ } from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";
import { Shield } from "lucide-icons-qwik";
import { dashboardNav, isNavItemActive } from "~/lib/dashboard-nav";
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

  return (
    <aside class="hidden w-56 shrink-0 lg:block">
      <nav class="sticky top-24 space-y-6">
        {dashboardNav.map((group) => (
          <div key={group.title}>
            <div class="text-theme-text-muted mb-2 px-3 text-xs font-semibold tracking-wider uppercase">
              {group.title}
            </div>
            <div class="space-y-1">
              {group.items.map((item) => {
                const active = isNavItemActive(pathname, item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    class={[
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-300",
                      active
                        ? "btn-cute text-white shadow-lg"
                        : "text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary/30",
                    ]}
                  >
                    <item.icon class="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {user.value?.isAdmin && (
          <div>
            <div class="text-theme-text-muted mb-2 px-3 text-xs font-semibold tracking-wider uppercase">
              Admin
            </div>
            <Link
              href="/admin"
              class={[
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-300",
                pathname.startsWith("/admin")
                  ? "btn-cute text-white shadow-lg"
                  : "text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary/30",
              ]}
            >
              <Shield class="h-4 w-4 shrink-0" />
              Admin Panel
            </Link>
          </div>
        )}
      </nav>
    </aside>
  );
});
