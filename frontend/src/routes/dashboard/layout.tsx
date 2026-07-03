import { component$, Slot } from "@builder.io/qwik";
import { AppShell } from "~/components/layout/app-shell";

/** Shell for every /dashboard route: persistent grouped sidebar + content. */
export default component$(() => (
  <AppShell>
    <Slot />
  </AppShell>
));
