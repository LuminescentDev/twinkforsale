import { component$, Slot, useSignal, $ } from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";
import { PanelLeft, PanelLeftClose, X } from "lucide-icons-qwik";
import { useCurrentUser, useSidebarState } from "~/routes/layout";
import { SidebarNav } from "./sidebar-nav";
import { AppTopbar } from "./app-topbar";
import { IconButton } from "~/components/ui";
import { setSidebarCollapsed } from "~/lib/cookie-utils";
import { cn } from "~/lib/utils";

/** Brand lockup used at the top of both the desktop rail and mobile drawer. */
const Brand = component$<{ collapsed?: boolean }>(({ collapsed }) => (
  <Link
    href="/dashboard"
    class="flex items-center gap-2 transition-transform duration-200 hover:scale-105"
  >
    <div class="heart-gradient sm"></div>
    {!collapsed && (
      <span class="text-gradient-cute text-lg font-bold whitespace-nowrap">
        twink.forsale
      </span>
    )}
  </Link>
));

/**
 * The signed-in application frame: a persistent, collapsible left sidebar plus
 * a sticky top bar and the scrolling content column. Used by every app section
 * (dashboard, upload, ShareX setup, admin). The collapsed width is restored
 * from a cookie on the server so there's no first-paint flash, and on mobile
 * the sidebar becomes an off-canvas drawer opened from the top bar.
 */
export const AppShell = component$(() => {
  const user = useCurrentUser();
  const sidebarState = useSidebarState();
  const location = useLocation();
  const collapsed = useSignal(sidebarState.value.collapsed);
  const mobileOpen = useSignal(false);

  const toggleCollapse = $(() => {
    collapsed.value = !collapsed.value;
    setSidebarCollapsed(collapsed.value);
  });
  const closeMobile = $(() => (mobileOpen.value = false));
  const openMobile = $(() => (mobileOpen.value = true));

  return (
    <div class="flex min-h-screen">
      {/* Desktop sidebar (icon-rail when collapsed) */}
      <aside
        class={cn(
          "border-theme-card-border bg-theme-bg-primary/40 sticky top-0 hidden h-screen shrink-0 flex-col border-r backdrop-blur-xl transition-[width] duration-300 lg:flex",
          collapsed.value ? "w-16" : "w-64",
        )}
      >
        <div
          class={cn(
            "border-theme-card-border flex h-16 shrink-0 items-center border-b",
            collapsed.value ? "justify-center px-0" : "px-4",
          )}
        >
          <Brand collapsed={collapsed.value} />
        </div>
        <div class="flex-1 overflow-y-auto px-3 py-4">
          <SidebarNav
            collapsed={collapsed.value}
            pathname={location.url.pathname}
            isAdmin={user.value?.isAdmin}
          />
        </div>
        <div class="border-theme-card-border border-t p-3">
          <button
            type="button"
            onClick$={toggleCollapse}
            title={collapsed.value ? "Expand sidebar" : "Collapse sidebar"}
            class={cn(
              "text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-bg-tertiary/30 flex w-full items-center rounded-xl py-2 text-sm font-medium transition-colors",
              collapsed.value ? "justify-center px-0" : "gap-3 px-3",
            )}
          >
            {collapsed.value ? (
              <PanelLeft class="h-5 w-5 shrink-0" />
            ) : (
              <>
                <PanelLeftClose class="h-5 w-5 shrink-0" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile off-canvas drawer */}
      {mobileOpen.value && (
        <div class="fixed inset-0 z-50 lg:hidden">
          <div
            class="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick$={closeMobile}
          />
          <aside class="border-theme-card-border bg-theme-bg-primary/95 relative flex h-full w-72 max-w-[80%] flex-col border-r backdrop-blur-xl">
            <div class="border-theme-card-border flex h-16 shrink-0 items-center justify-between border-b px-4">
              <Brand />
              <IconButton onClick$={closeMobile} title="Close menu">
                <X class="h-5 w-5" />
              </IconButton>
            </div>
            <div class="flex-1 overflow-y-auto px-3 py-4">
              <SidebarNav
                pathname={location.url.pathname}
                isAdmin={user.value?.isAdmin}
                onNavigate$={closeMobile}
              />
            </div>
          </aside>
        </div>
      )}

      {/* Content column */}
      <div class="flex min-w-0 flex-1 flex-col">
        <AppTopbar user={user.value} onMenu$={openMobile} />
        <main class="mx-auto w-full max-w-[100rem] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Slot />
        </main>
      </div>
    </div>
  );
});
