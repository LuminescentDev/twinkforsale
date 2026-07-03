import { component$, Slot } from "@builder.io/qwik";
import { AppShell } from "~/components/layout/app-shell";

/** Give /upload the same signed-in sidebar shell as the dashboard. */
export default component$(() => (
  <AppShell>
    <Slot />
  </AppShell>
));
