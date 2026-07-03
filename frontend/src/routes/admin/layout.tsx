import { component$, Slot } from "@builder.io/qwik";
import { AppShell } from "~/components/layout/app-shell";

/** Admin section shares the signed-in sidebar; the Admin group (Users, Domains,
 *  Events, Health, Bio Limits) only renders for admins, so it doubles as the
 *  admin sub-navigation. */
export default component$(() => (
  <AppShell>
    <Slot />
  </AppShell>
));
