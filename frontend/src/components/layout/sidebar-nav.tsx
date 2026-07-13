import { component$, type QRL } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { adminNav, dashboardNav, isNavItemActive } from "~/lib/dashboard-nav";
import { cn } from "~/lib/utils";

export interface SidebarNavProps {
  /** Icon-rail mode: hide labels + group titles. */
  collapsed?: boolean;
  pathname: string;
  isAdmin?: boolean;
  /** Called after a link is followed (used to close the mobile drawer). */
  onNavigate$?: QRL<() => void>;
}

/**
 * The grouped destination list shared by the desktop sidebar and the mobile
 * drawer, driven by the single `dashboard-nav` source of truth. Active items
 * get an accent-tinted pill (plus a gradient bar when expanded); collapsed
 * mode centers icons and swaps group titles for divider rules.
 */
export const SidebarNav = component$<SidebarNavProps>(
  ({ collapsed, pathname, isAdmin, onNavigate$ }) => {
    const groups = [
      ...dashboardNav,
      ...(isAdmin ? [{ title: "Admin", items: adminNav }] : []),
    ];

    const linkClass = (active: boolean) =>
      cn(
        "relative flex items-center rounded-xl text-sm font-medium transition-colors duration-200",
        collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2",
        active
          ? "text-theme-accent-primary bg-theme-accent-primary/10"
          : "text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary/30",
      );

    return (
      <nav class="space-y-6">
        {groups.map((group) => (
          <div key={group.title}>
            {collapsed ? (
              <div class="bg-theme-card-border/60 mx-2 mb-2 h-px" />
            ) : (
              <div class="text-theme-text-muted mb-2 px-3 text-xs font-semibold tracking-wider uppercase">
                {group.title}
              </div>
            )}
            <div class="space-y-1">
              {group.items.map((item) => {
                const active = isNavItemActive(pathname, item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick$={onNavigate$}
                    title={collapsed ? item.label : undefined}
                    class={linkClass(active)}
                  >
                    {active && !collapsed && (
                      <span class="from-theme-accent-primary to-theme-accent-secondary absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-gradient-to-b" />
                    )}
                    <item.icon class="h-5 w-5 shrink-0" />
                    {!collapsed && <span class="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    );
  },
);
