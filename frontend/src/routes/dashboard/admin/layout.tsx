import { component$, Slot } from "@builder.io/qwik";
import { routeLoader$, useLocation } from "@builder.io/qwik-city";
import { getCurrentUser } from "~/lib/auth-client";
import { serverAuth } from "~/lib/api-client";
import { adminNav } from "~/lib/dashboard-nav";
import { LocalNav, Page } from "~/components/ui";

/** Every admin route requires an administrator; enforced once, here. */
export const useAdminGuard = routeLoader$(async (requestEvent) => {
  const user = await getCurrentUser(serverAuth(requestEvent));
  if (!user) throw requestEvent.redirect(302, "/");
  if (!user.isAdmin) throw requestEvent.redirect(302, "/dashboard");
  return { name: user.name };
});

/**
 * Admin shell: one global Admin entry in the application rail, and the
 * individual sections in local navigation here.
 */
export default component$(() => {
  const location = useLocation();
  const current =
    adminNav
      .map((item) => item.href)
      .filter(
        (href) =>
          location.url.pathname === href ||
          location.url.pathname === `${href}/` ||
          location.url.pathname.startsWith(`${href}/`),
      )
      .sort((a, b) => b.length - a.length)[0] ?? adminNav[0].href;

  return (
    <Page>
      <div class="flex flex-col gap-6 md:flex-row md:gap-8">
        <div class="shrink-0 md:w-44">
          <LocalNav label="Admin sections" items={adminNav} current={current} />
        </div>
        <div class="min-w-0 flex-1">
          <Slot />
        </div>
      </div>
    </Page>
  );
});
