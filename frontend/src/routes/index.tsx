import { component$, useStyles$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { api } from "~/lib/api-client";
import { NavigateBox, SideBoxes } from "~/components/landing/sidebar";
import {
  Extras,
  Faq,
  HangOut,
  HowItWorks,
  LandingFooter,
  MakeItYours,
  Welcome,
} from "~/components/landing/sections";
import landingStyles from "~/components/landing/landing.css?inline";

export const usePublicStats = routeLoader$(async (requestEvent) => {
  const stats = await api.stats
    .public({ cookie: requestEvent.request.headers.get("cookie") })
    .catch(() => null);
  return {
    totalUploads: stats?.totalUploads ?? 0,
    totalViews: stats?.totalViews ?? 0,
    totalUsers: stats?.totalUsers ?? 0,
  };
});

export default component$(() => {
  useStyles$(landingStyles);
  const publicStats = usePublicStats();

  return (
    <div class="lp-root min-h-screen px-3 py-6 sm:px-5 sm:py-8">
      <a
        href="#main-content"
        class="lp-btn lp-focus fixed top-2 left-2 z-50 -translate-y-20 focus:translate-y-0"
      >
        Skip to content
      </a>
      <header class="mx-auto max-w-[1100px] text-center">
        <h1 class="lp-pixel lp-banner text-[clamp(2.5rem,9vw,4.5rem)] leading-none font-bold">
          twink.forsale
        </h1>
        <p class="lp-pixel lp-ink mt-2 text-base sm:text-lg">
          cute file hosting for the group chat
        </p>
      </header>
      <div class="mx-auto mt-6 grid max-w-[1100px] gap-3 lg:grid-cols-[220px_1fr] lg:grid-rows-[auto_1fr]">
        <div class="lg:col-start-1 lg:row-start-1">
          <NavigateBox />
        </div>
        <main
          id="main-content"
          class="grid gap-3 lg:col-start-2 lg:row-span-2 lg:row-start-1"
        >
          <Welcome />
          <HowItWorks />
          <MakeItYours />
          <Extras />
          <Faq />
          <HangOut />
        </main>
        <aside
          aria-label="Sidebar"
          class="lg:col-start-1 lg:row-start-2 lg:self-start"
        >
          <SideBoxes stats={publicStats.value} />
        </aside>
      </div>
      <LandingFooter />
    </div>
  );
});

export const head: DocumentHead = {
  title: "twink.forsale: cute file hosting for the community",
  meta: [
    {
      name: "description",
      content:
        "Invite-only file hosting with ShareX uploads, short links, custom Discord embeds, public bio pages and themes. Sign in with Discord to get started.",
    },
    {
      property: "og:title",
      content: "twink.forsale: cute file hosting for the community",
    },
    {
      property: "og:description",
      content:
        "Upload from ShareX or your browser, get a short link, and make it look like yours.",
    },
  ],
};
