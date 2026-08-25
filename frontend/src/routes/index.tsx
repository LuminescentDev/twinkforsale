import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import {
  ArrowRight,
  BarChart3,
  Check,
  FileSearch,
  Gauge,
  Heart,
  IdCard,
  Link2,
  Palette,
  Settings2,
  Upload,
} from "lucide-icons-qwik";
import { LoginButton } from "~/components/auth/login-button";
import { Button, Surface, ThemeToggle } from "~/components/ui";
import { api } from "~/lib/api-client";
import { useCurrentUser } from "~/routes/layout";

export const usePublicStats = routeLoader$(async (requestEvent) => {
  const empty = {
    totalUploads: 0,
    totalViews: 0,
    totalUsers: 0,
    weeklyStats: { views: 0, uploads: 0, users: 0 },
    analyticsData: [],
    recentUploads: [],
  };
  const stats = await api.stats
    .public({ cookie: requestEvent.request.headers.get("cookie") })
    .catch(() => null);
  return stats ?? empty;
});

const capabilities = [
  {
    icon: FileSearch,
    title: "Find files quickly",
    body: "Search, sort, filter, and switch between practical list and visual grid views.",
  },
  {
    icon: Gauge,
    title: "Set sensible limits",
    body: "Choose expiration dates and maximum views before a file leaves your device.",
  },
  {
    icon: BarChart3,
    title: "See what gets opened",
    body: "Use exact file analytics and a focused 30-day activity view without dashboard clutter.",
  },
  {
    icon: Link2,
    title: "Make short links",
    body: "Create memorable links with optional expiration and click limits.",
  },
  {
    icon: IdCard,
    title: "Build your public page",
    body: "Publish a personal bio with links, Discord presence, Spotify, colors, and effects.",
  },
  {
    icon: Settings2,
    title: "Connect ShareX",
    body: "Download a personal configuration and send screenshots straight to your account.",
  },
];

export default component$(() => {
  const user = useCurrentUser();
  const publicStats = usePublicStats();

  return (
    <div class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <section class="grid gap-10 py-14 sm:py-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:items-center lg:gap-16 lg:py-24">
        <div class="max-w-2xl">
          <div class="text-accent-text mb-5 inline-flex items-center gap-2 text-sm font-medium">
            <Heart class="h-4 w-4 fill-current" aria-hidden="true" />
            Invite-only community file sharing
          </div>
          <h1 class="text-ink text-4xl leading-[1.08] font-semibold tracking-[-0.035em] sm:text-5xl lg:text-[56px]">
            Share files without turning it into a whole thing.
          </h1>
          <p class="text-ink-muted mt-6 max-w-xl text-base leading-7 sm:text-lg">
            twink.forsale keeps uploads, links, analytics, and your public bio
            in one friendly place. Quick when you need it, expressive where it
            counts.
          </p>
          <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            {user.value ? (
              <>
                <Button href="/dashboard" variant="primary" size="lg">
                  Open Files
                  <ArrowRight class="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button href="/upload" size="lg">
                  <Upload class="h-4 w-4" aria-hidden="true" />
                  Upload a file
                </Button>
              </>
            ) : (
              <LoginButton
                class="focus-ring bg-accent text-on-accent hover:bg-accent-hover rounded-control inline-flex h-11 items-center justify-center gap-2 border border-transparent px-5 text-[15px] font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55"
                label="Sign in with Discord"
              />
            )}
          </div>
          {!user.value && (
            <p class="text-ink-muted mt-3 text-[13px] leading-5">
              New accounts need approval before uploading. Ask in the community
              Discord for an invite.
            </p>
          )}
        </div>

        <Surface class="overflow-hidden" padding="lg">
          <div class="border-edge flex items-center justify-between border-b pb-4">
            <div>
              <p class="text-ink text-sm font-semibold">From file to link</p>
              <p class="text-ink-muted mt-0.5 text-xs">
                A deliberately short workflow
              </p>
            </div>
            <Upload class="text-accent-text h-5 w-5" aria-hidden="true" />
          </div>
          <ol class="divide-edge divide-y">
            {[
              [
                "1",
                "Choose your files",
                "Drop them in or use the file picker.",
              ],
              [
                "2",
                "Add limits if needed",
                "Expiration and view limits stay optional.",
              ],
              [
                "3",
                "Copy and share",
                "Each completed upload gets a ready-to-use link.",
              ],
            ].map(([number, title, body]) => (
              <li key={number} class="grid grid-cols-[32px_1fr] gap-3 py-4">
                <span class="bg-accent-soft text-accent-text flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold">
                  {number}
                </span>
                <div>
                  <p class="text-ink text-sm font-medium">{title}</p>
                  <p class="text-ink-muted mt-1 text-[13px] leading-5">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <div class="bg-surface-subtle border-edge -mx-5 -mb-5 flex items-center gap-2 border-t px-5 py-3 text-[13px]">
            <Check class="text-success h-4 w-4" aria-hidden="true" />
            <span class="text-ink-muted">
              Sequential uploads keep progress clear and reliable.
            </span>
          </div>
        </Surface>
      </section>

      <section
        aria-labelledby="activity-title"
        class="border-edge border-y py-7"
      >
        <div class="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <h2 id="activity-title" class="text-ink text-lg font-semibold">
              Small community, real activity
            </h2>
            <p class="text-ink-muted mt-1 max-w-xl text-sm leading-6">
              These are live service totals, not launch-day vanity numbers.
            </p>
          </div>
          <dl class="grid grid-cols-3 gap-x-7 sm:gap-x-10">
            {[
              ["Files", publicStats.value.totalUploads],
              ["Views", publicStats.value.totalViews],
              ["Members", publicStats.value.totalUsers],
            ].map(([label, value]) => (
              <div key={label as string}>
                <dt class="text-ink-muted text-xs">{label}</dt>
                <dd class="text-ink mt-1 text-xl font-semibold tabular-nums">
                  {(value as number).toLocaleString()}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section class="py-16 sm:py-20" aria-labelledby="capabilities-title">
        <div class="max-w-2xl">
          <h2
            id="capabilities-title"
            class="text-ink text-2xl leading-8 font-semibold tracking-[-0.015em]"
          >
            The useful parts stay close
          </h2>
          <p class="text-ink-muted mt-2 text-sm leading-6 sm:text-base">
            It is a file tool first. The extra pieces support sharing instead of
            competing with it.
          </p>
        </div>
        <div class="border-edge mt-9 grid border-t md:grid-cols-2 md:gap-x-12">
          {capabilities.map((item) => (
            <div key={item.title} class="border-edge flex gap-4 border-b py-6">
              <item.icon
                class="text-accent-text mt-0.5 h-5 w-5 shrink-0"
                aria-hidden="true"
              />
              <div>
                <h3 class="text-ink text-sm font-semibold">{item.title}</h3>
                <p class="text-ink-muted mt-1 max-w-md text-[13px] leading-5">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        class="border-edge grid gap-10 border-y py-12 sm:py-16 lg:grid-cols-2 lg:items-start lg:gap-16"
        aria-labelledby="sharex-title"
      >
        <div>
          <p class="text-accent-text text-sm font-medium">
            For screenshot regulars
          </p>
          <h2
            id="sharex-title"
            class="text-ink mt-2 text-2xl leading-8 font-semibold tracking-[-0.015em]"
          >
            ShareX setup, explained like a human
          </h2>
          <p class="text-ink-muted mt-3 max-w-xl text-sm leading-6 sm:text-base">
            Create or choose an API key, download your personal{" "}
            <code class="text-ink text-sm">.sxcu</code> file, then import it
            into ShareX. The setup screen walks through each step.
          </p>
          {user.value && (
            <Button href="/setup/sharex" class="mt-6">
              Open ShareX setup
              <ArrowRight class="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
        <ol class="space-y-5">
          {[
            [
              "Choose a key",
              "Use an existing API key or create one for ShareX.",
            ],
            [
              "Download the config",
              "The generated file already knows where to upload.",
            ],
            [
              "Import and share",
              "Open the file in ShareX and your next capture is ready.",
            ],
          ].map(([title, body], index) => (
            <li key={title} class="grid grid-cols-[28px_1fr] gap-3">
              <span class="border-edge text-ink-muted flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold">
                {index + 1}
              </span>
              <div>
                <p class="text-ink text-sm font-medium">{title}</p>
                <p class="text-ink-muted mt-1 text-[13px] leading-5">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section
        class="grid gap-8 py-16 sm:py-20 lg:grid-cols-[minmax(0,0.8fr)_minmax(360px,1.2fr)] lg:items-start lg:gap-16"
        aria-labelledby="themes-title"
      >
        <div>
          <Palette class="text-accent-text h-5 w-5" aria-hidden="true" />
          <h2
            id="themes-title"
            class="text-ink mt-3 text-2xl leading-8 font-semibold tracking-[-0.015em]"
          >
            Same tool, your atmosphere
          </h2>
          <p class="text-ink-muted mt-3 max-w-lg text-sm leading-6 sm:text-base">
            Dark, Light, Pastel, Neon, Valentine, and Auto change the palette,
            not where things move or how they work. Pick one here and it is
            saved automatically.
          </p>
        </div>
        <ThemeToggle variant="list" />
      </section>

      <section class="bg-surface-subtle border-edge rounded-surface mb-16 flex flex-col gap-6 border px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <h2 class="text-ink text-xl font-semibold">
            Ready when your next file is.
          </h2>
          <p class="text-ink-muted mt-1 text-sm leading-6">
            Sign in with Discord, then head straight to Files.
          </p>
        </div>
        {user.value ? (
          <Button href="/dashboard" variant="primary">
            Open Files
            <ArrowRight class="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : (
          <LoginButton
            class="focus-ring bg-accent text-on-accent hover:bg-accent-hover rounded-control inline-flex h-9 items-center justify-center gap-2 border border-transparent px-3.5 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55"
            label="Sign in with Discord"
          />
        )}
      </section>
    </div>
  );
});

export const head: DocumentHead = {
  title: "twink.forsale — Community file sharing",
  meta: [
    {
      name: "description",
      content:
        "Invite-only community file sharing with uploads, short links, analytics, ShareX integration, and customizable bio pages.",
    },
    {
      property: "og:title",
      content: "twink.forsale — Community file sharing",
    },
    {
      property: "og:description",
      content:
        "Quick uploads, clean links, useful analytics, and a public page that still feels like yours.",
    },
  ],
};
