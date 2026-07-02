import { component$, Slot } from "@builder.io/qwik";
import { DashboardSidebar } from "~/components/layout/dashboard-sidebar";

/**
 * Shell for every /dashboard route: a persistent grouped sidebar alongside the
 * page content. The site layout already provides the outer max-width gutter and
 * top offset, so this only lays out the two columns.
 */
export default component$(() => {
  return (
    <div class="flex gap-8">
      <DashboardSidebar />
      <div class="min-w-0 flex-1">
        <Slot />
      </div>
    </div>
  );
});
