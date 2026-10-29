import { component$, useVisibleTask$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { api } from "~/lib/api-client";
import { LandingNav } from "~/components/landing/landing-nav";
import { Hero } from "~/components/landing/hero";
import {
  HowItWorks,
  IntroStatement,
  ShareXSection,
  UploadSharing,
} from "~/components/landing/flow-sections";
import {
  BioPagesSection,
  EmbedsSection,
  ThemesSection,
} from "~/components/landing/showcase-sections";
import {
  AnalyticsSection,
  ClosingCta,
  FaqSection,
  LandingFooter,
  LinksDomainsSection,
} from "~/components/landing/closing-sections";
import { installReveals } from "~/components/landing/reveal";
import "~/components/landing/landing.css";

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
  const publicStats = usePublicStats();

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    cleanup(installReveals(document));
  });

  return (
    <div class="lp-root">
      <a
        href="#main-content"
        class="focus-ring bg-surface text-ink rounded-control border-edge fixed top-2 left-2 z-50 inline-flex min-h-11 -translate-y-20 items-center border px-3 text-sm focus:translate-y-0"
      >
        Skip to content
      </a>
      <LandingNav />
      <main id="main-content">
        <Hero />
        <IntroStatement />
        <HowItWorks />
        <UploadSharing />
        <ShareXSection />
        <EmbedsSection />
        <BioPagesSection />
        <ThemesSection />
        <LinksDomainsSection />
        <AnalyticsSection stats={publicStats.value} />
        <FaqSection />
        <ClosingCta />
      </main>
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
