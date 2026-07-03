import { component$, Slot } from "@builder.io/qwik";
import { DashboardSidebar } from "~/components/layout/dashboard-sidebar";

/**
 * Two-column shell for every signed-in app section (dashboard, upload, ShareX
 * setup, admin): a persistent grouped sidebar alongside the page content. The
 * site layout already provides the outer max-width gutter and top offset, so
 * this only lays out the two columns. The sidebar itself is desktop-only; on
 * mobile the same links live in the top-nav menu.
 */
export const AppShell = component$(() => {
  return (
    <div class="flex gap-8">
      <DashboardSidebar />
      <div class="min-w-0 flex-1">
        <Slot />
      </div>
    </div>
  );
});
