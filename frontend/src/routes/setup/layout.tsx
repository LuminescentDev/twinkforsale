import { component$, Slot } from "@builder.io/qwik";
import { AppShell } from "~/components/layout/app-shell";

/** Give /setup/* (ShareX setup) the same signed-in sidebar shell. */
export default component$(() => (
  <AppShell>
    <Slot />
  </AppShell>
));
