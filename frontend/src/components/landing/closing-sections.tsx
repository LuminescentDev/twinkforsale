import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import {
  ArrowRight,
  ChevronDown,
  Clock,
  Eye,
  LogIn,
  MessageCircle,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Timer,
  Upload,
} from "lucide-icons-qwik";
import { LoginButton } from "~/components/auth/login-button";
import { cn } from "~/lib/utils";
import { useCurrentUser } from "~/routes/layout";
import { primaryButton } from "./landing-nav";

const DISCORD_INVITE = "https://discord.gg/RJ9Cedxvqe";

const linkFeatures = [
  {
    title: "Short links",
    body: "Paste a long URL and get a short one back, with an optional expiry.",
  },
  {
    title: "Upload domains",
    body: "Pick which domain your uploads use from the ones your admin has added.",
  },
  {
    title: "Subdomains",
    body: "Put your own name in front of a domain that allows it.",
  },
  {
    title: "View limits",
    body: "Let a file disappear after a set number of views.",
  },
];

const LinkPreview = component$<{ index: number }>(({ index }) => (
  <div class="bg-surface-subtle relative flex h-full flex-col justify-center rounded-[16px] p-6 sm:p-8">
    <span class="lp-example">Example</span>
    {index === 0 && (
      <div class="bg-canvas border-edge rounded-surface border p-5">
        <p class="text-ink-muted text-xs">Short link</p>
        <p class="text-ink mt-1 text-lg font-semibold tabular-nums">twink.forsale/l/k3p9</p>
        <p class="text-ink-muted mt-1 truncate text-sm">
          → https://example.com/a/very/long/playlist?share=weekend
        </p>
        <p class="text-accent-text mt-4 inline-flex items-center gap-2 text-sm font-medium">
          <Timer class="h-4 w-4" aria-hidden="true" /> Expires in 7 days
        </p>
      </div>
    )}
    {index === 1 && (
      <div class="bg-canvas border-edge rounded-surface border p-5">
        <p class="text-ink-muted text-xs">Upload domain</p>
        <div class="lp-control mt-2 flex items-center justify-between px-3 py-2.5 text-sm">
          <span class="text-ink tabular-nums">twink.forsale</span>
          <ChevronDown class="text-ink-muted h-4 w-4" aria-hidden="true" />
        </div>
        <ul class="mt-2 space-y-1 text-sm tabular-nums">
          <li class="text-ink bg-accent-soft rounded-control px-3 py-2">twink.forsale</li>
          <li class="text-ink-muted px-3 py-2">cute.example</li>
          <li class="text-ink-muted px-3 py-2">files.example</li>
        </ul>
      </div>
    )}
    {index === 2 && (
      <div class="bg-canvas border-edge rounded-surface border p-5">
        <p class="text-ink-muted text-xs">Your subdomain</p>
        <div class="lp-control mt-2 flex items-center text-sm tabular-nums">
          <span class="text-ink px-3 py-2.5 font-medium">juniper</span>
          <span class="text-ink-muted border-l-edge border-l px-3 py-2.5">.cute.example</span>
        </div>
        <p class="text-ink-muted mt-4 text-sm">
          Links look like <span class="text-accent-text tabular-nums">juniper.cute.example/f/a8Kd2</span>
        </p>
      </div>
    )}
    {index === 3 && (
      <div class="bg-canvas border-edge rounded-surface border p-5">
        <p class="text-ink-muted text-xs">View limit</p>
        <p class="text-ink mt-1 inline-flex items-center gap-2 text-lg font-semibold tabular-nums">
          <Eye class="h-5 w-5" aria-hidden="true" /> 3 of 10 views
        </p>
        <div class="bg-surface-subtle mt-4 h-2 overflow-hidden rounded-full">
          <div class="bg-accent h-full w-[30%] rounded-full" />
        </div>
        <p class="text-ink-muted mt-3 text-sm">The file is removed after the tenth view.</p>
      </div>
    )}
  </div>
));

export const LinksDomainsSection = component$(() => {
  const active = useSignal(0);
  // Below 768px every row is expanded inline, so nothing depends on hover.
  const compact = useSignal(false);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    const query = matchMedia("(max-width: 767px)");
    const update = () => {
      compact.value = query.matches;
    };
    update();
    query.addEventListener("change", update);
    cleanup(() => query.removeEventListener("change", update));
  });

  return (
    <section id="links-domains" aria-labelledby="links-title" class="scroll-mt-[72px] px-[2%] py-10 lg:px-[1%] lg:py-16">
      <div class="bg-surface mx-auto max-w-[1600px] rounded-[24px] px-5 py-10 sm:px-8 lg:px-[4%] lg:py-16">
        <div class="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-12">
          <div>
            <p class="bg-surface-subtle text-ink rounded-control inline-flex items-center gap-2 px-2.5 py-1 text-[13px] font-medium">
              <span aria-hidden="true" class="bg-accent h-1.5 w-1.5" />
              Links and domains
            </p>
            <h2
              id="links-title"
              class="font-display text-ink mt-4 max-w-[16ch] text-[clamp(2.25rem,4vw,3.75rem)] leading-[1.05] font-semibold tracking-[-0.025em]"
            >
              Links that go{" "}
              <img
                src="/landing/links_inline_sticker.jpg"
                alt=""
                width={1280}
                height={1280}
                loading="lazy"
                class="inline-block h-[1em] w-[1em] -translate-y-[0.06em] rounded-[0.22em] object-cover align-middle lg:h-[1.1em] lg:w-[1.1em]"
              />{" "}
              where you want
            </h2>
          </div>
          <p class="text-ink-muted max-w-[34ch] text-[17px] leading-7 lg:mb-2">
            Shorten any URL, upload to the domain you like, and decide how long things stay up.
          </p>
        </div>

        <div class="bg-edge mt-8 h-px lg:mt-12" aria-hidden="true" />

        <div class="mt-4 grid gap-8 lg:mt-8 lg:grid-cols-[50%_1fr] lg:gap-[5%]">
          <ul>
            {linkFeatures.map((feature, index) => {
              const open = compact.value || active.value === index;
              const activate = $(() => {
                active.value = index;
              });
              return (
                <li key={feature.title} class="border-edge border-b border-dotted last:border-b-0">
                  <h3>
                    <button
                      type="button"
                      id={`link-feature-${index}`}
                      aria-expanded={open}
                      aria-controls={`link-feature-panel-${index}`}
                      onClick$={activate}
                      onFocusIn$={activate}
                      onPointerEnter$={(event) => {
                        if (event.pointerType === "mouse") active.value = index;
                      }}
                      class={cn(
                        "focus-ring rounded-control font-display flex min-h-11 w-full items-start gap-2 py-5 text-left text-[clamp(1.75rem,4.4vw,4.25rem)] leading-[1.05] font-semibold tracking-[-0.025em] transition-colors duration-200",
                        open ? "text-ink" : "text-ink-muted hover:text-ink max-md:text-ink",
                      )}
                    >
                      {feature.title}
                      <sup class="font-sans text-ink-muted mt-2 text-sm font-medium tracking-normal tabular-nums">
                        [{String(index + 1).padStart(2, "0")}]
                      </sup>
                    </button>
                  </h3>
                  <div
                    id={`link-feature-panel-${index}`}
                    role="region"
                    aria-labelledby={`link-feature-${index}`}
                    class="lp-disclosure lp-disclosure-compact-open"
                    data-open={open ? "true" : "false"}
                  >
                    <div class="overflow-hidden">
                      <p class="text-ink-muted max-w-[46ch] pb-5 text-base leading-6">{feature.body}</p>
                      <div class="pb-6 lg:hidden">
                        <LinkPreview index={index} />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <div class="relative hidden min-h-[360px] lg:block" aria-hidden="true">
            {linkFeatures.map((feature, index) => (
              <div
                key={feature.title}
                class={cn(
                  "lp-swap absolute inset-0",
                  active.value === index ? "opacity-100" : "pointer-events-none opacity-0",
                )}
              >
                <LinkPreview index={index} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

// Truthful example series, clearly labelled on the chart.
const exampleViews = [12, 18, 15, 26, 22, 34, 41];

const ViewsChart = component$(() => {
  const width = 280;
  const height = 88;
  const max = Math.max(...exampleViews);
  const points = exampleViews.map((value, index) => [
    (index / (exampleViews.length - 1)) * width,
    height - 6 - (value / max) * (height - 16),
  ]);
  const path = points.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} class="h-auto w-full" role="img" aria-label="Example views over 7 days, rising from 12 to 41">
      <path d={`${path} L${width} ${height} L0 ${height} Z`} class="fill-accent-soft" />
      <path data-reveal="draw" d={path} fill="none" class="stroke-accent-text" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  );
});

export const AnalyticsSection = component$<{ stats: { totalUploads: number; totalViews: number; totalUsers: number } }>(
  ({ stats }) => {
    const format = new Intl.NumberFormat("en");
    const items = [
      { label: "Files hosted", value: stats.totalUploads },
      { label: "Views served", value: stats.totalViews },
      { label: "Members", value: stats.totalUsers },
    ];
    const hasStats = items.some((item) => item.value > 0);

    return (
      <section id="analytics-files" aria-labelledby="analytics-title" class="bg-surface-subtle scroll-mt-[72px] px-5 py-20 sm:px-6 lg:py-28">
        <div class="mx-auto max-w-[1440px]">
          <p class="text-ink inline-flex items-center gap-2.5 text-sm font-medium tracking-[0.06em] uppercase">
            <span aria-hidden="true" class="bg-accent h-2.5 w-2.5 rounded-full" />
            Your files
          </p>
          <div class="mt-8 grid grid-cols-1 gap-10 md:grid-cols-[55fr_45fr] lg:grid-cols-[58%_1fr] lg:gap-[14%]">
            <h2
              id="analytics-title"
              class="font-display text-ink text-[clamp(1.75rem,3.5vw,3.5rem)] leading-[1.08] font-bold tracking-[-0.025em] md:col-span-2 lg:col-span-1"
            >
              See what got opened, find anything you uploaded, and keep an eye on how much space you've used.
            </h2>
            <div class="md:col-span-2 md:grid md:grid-cols-[55fr_45fr] md:gap-8 lg:col-span-1 lg:block">
              <figure class="bg-surface border-edge relative overflow-hidden rounded-[16px] border p-5" data-reveal="media">
                <span class="lp-example">Example</span>
                <figcaption class="text-ink-muted mt-7 text-xs">Views, last 7 days</figcaption>
                <div class="mt-3">
                  <ViewsChart />
                </div>
                <div class="lp-control text-ink-muted mt-4 flex items-center gap-2 px-3 py-2 text-xs">
                  <Search class="h-3.5 w-3.5" aria-hidden="true" /> Search uploads
                </div>
                <div class="mt-4">
                  <div class="text-ink-muted flex justify-between text-xs tabular-nums">
                    <span>Storage</span>
                    <span>1.2 GB of 5 GB</span>
                  </div>
                  <div class="bg-surface-subtle mt-2 h-2 overflow-hidden rounded-full">
                    <div data-reveal="fill" class="bg-accent h-full w-[24%] origin-left rounded-full" />
                  </div>
                </div>
              </figure>
              <p class="text-ink-muted mt-6 text-base leading-7 md:mt-0 lg:mt-6">
                Views and downloads over time, search and filters for every
                upload, and a storage bar that shows your limit before you hit it.
              </p>
            </div>
          </div>

          {hasStats && (
            <dl class="mt-16 grid grid-cols-2 gap-y-8 sm:grid-cols-3 lg:mt-24">
              {items.map((item, index) => (
                <div
                  key={item.label}
                  data-reveal="rise"
                  data-reveal-delay={String(index * 80)}
                  class={cn("flex flex-col px-4 sm:px-8", index > 0 && "border-l-accent border-l", index === 2 && "max-sm:border-l-0")}
                >
                  <dt class="text-ink-muted text-base font-medium">{item.label}</dt>
                  <dd class="font-display text-ink-muted order-first text-[32px] font-bold tabular-nums sm:text-5xl">
                    {format.format(item.value)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>
    );
  },
);

const faqs = [
  {
    q: "Why can't I upload yet?",
    a: (
      <>
        twink.forsale is invite-only. After you sign in with Discord, an admin
        reviews your account, and you can upload as soon as it's approved.
      </>
    ),
  },
  {
    q: "What is ShareX, and do I need it?",
    a: (
      <>
        ShareX is a free Windows screenshot tool. It's optional, so you can
        always upload from the browser instead.
      </>
    ),
  },
  {
    q: "What am I allowed to upload?",
    a: (
      <>
        Anything that follows the{" "}
        <Link href="/acceptable-use" class="lp-inline-link">
          acceptable use policy
        </Link>
        . Give it a read before your first upload.
      </>
    ),
  },
  {
    q: "How do I report something?",
    a: (
      <>
        Send a notice through the{" "}
        <Link href="/dmca" class="lp-inline-link">
          DMCA page
        </Link>{" "}
        and an admin will review it.
      </>
    ),
  },
  {
    q: "What happens to my data?",
    a: (
      <>
        The{" "}
        <Link href="/privacy" class="lp-inline-link">
          privacy policy
        </Link>{" "}
        explains what's stored and why.
      </>
    ),
  },
  {
    q: "Can I use my own domain?",
    a: (
      <>
        Uploads can use any domain your admin has added. Ask in the{" "}
        <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" class="lp-inline-link">
          Discord
        </a>{" "}
        if you'd like a new one.
      </>
    ),
  },
];

export const FaqSection = component$(() => {
  const open = useSignal<number[]>([0]);

  return (
    <section id="faq" aria-labelledby="faq-title" class="scroll-mt-[72px] px-5 py-20 sm:px-6 lg:py-32">
      <div class="mx-auto grid grid-cols-1 max-w-[1560px] gap-10 lg:grid-cols-[47%_1fr] lg:gap-[3%]">
        <div>
          <h2
            id="faq-title"
            class="font-display text-ink text-[clamp(4rem,22vw,6rem)] leading-[0.9] font-extrabold tracking-[-0.04em] sm:text-[clamp(4.5rem,9vw,9rem)]"
          >
            FAQ.
          </h2>
          <p class="text-ink-muted mt-8 max-w-[44ch] text-[17px] leading-7">
            Straight answers about access, rules and your files.
          </p>
        </div>
        <ul class="space-y-1.5">
          {faqs.map((item, index) => {
            const isOpen = open.value.includes(index);
            return (
              <li key={item.q} class="bg-surface border-edge rounded-[16px] border">
                <h3>
                  <button
                    type="button"
                    id={`faq-${index}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${index}`}
                    onClick$={() => {
                      open.value = isOpen ? open.value.filter((i) => i !== index) : [...open.value, index];
                    }}
                    class="focus-ring text-ink flex min-h-11 w-full items-center justify-between gap-4 rounded-[16px] px-5 py-5 text-left text-lg font-medium sm:px-[26px] sm:py-6 sm:text-xl"
                  >
                    {item.q}
                    <span aria-hidden="true" class="bg-ink text-canvas grid h-7 w-7 shrink-0 place-items-center rounded-full">
                      <Plus class={cn("lp-plus h-4 w-4", isOpen && "rotate-45")} />
                    </span>
                  </button>
                </h3>
                <div
                  id={`faq-panel-${index}`}
                  role="region"
                  aria-labelledby={`faq-${index}`}
                  class="lp-disclosure"
                  data-open={isOpen ? "true" : "false"}
                >
                  <div class="overflow-hidden">
                    <p class="text-ink-muted px-5 pb-6 text-base leading-7 sm:px-[26px]">{item.a}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
});

export const DiscordMark = component$<{ class?: string }>((props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" class={props.class} fill="currentColor">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
  </svg>
));

const perks = [
  "Browser and ShareX uploads",
  "Short links",
  "Custom Discord embeds",
  "A public bio page",
  "Five themes",
];

const statusRows = [
  { icon: LogIn, label: "Sign in", detail: "With your Discord account" },
  { icon: Clock, label: "Admin approval", detail: "An admin reviews new accounts" },
  { icon: Upload, label: "Start uploading", detail: "Browser or ShareX" },
];

export const ClosingCta = component$(() => {
  const user = useCurrentUser();

  return (
    <section id="get-started" aria-labelledby="cta-title" class="scroll-mt-[72px] px-[4%] py-20 lg:px-[3%] lg:py-28">
      <div class="mx-auto max-w-[1600px]">
        <h2
          id="cta-title"
          class="font-display text-ink max-w-[10ch] text-[clamp(2.5rem,4.6vw,4.25rem)] leading-[1.02] font-bold tracking-[-0.025em] md:mx-auto md:max-w-none md:text-center"
        >
          Let's get you uploading
        </h2>
        <div class="bg-edge mt-10 hidden h-px md:block" aria-hidden="true" />
        <div class="bg-surface-subtle rounded-surface mt-10 grid md:mt-14 md:grid-cols-[45fr_55fr] lg:grid-cols-2">
          <div class="p-6 sm:p-8">
            <div class="flex items-center justify-between gap-4">
              <h3 class="text-ink text-[22px] font-semibold">Join the community</h3>
              <a
                href={DISCORD_INVITE}
                target="_blank"
                rel="noopener noreferrer"
                class="lp-press focus-ring bg-surface text-ink hover:bg-surface-hover rounded-control inline-flex min-h-12 items-center gap-2.5 px-4 text-sm font-medium transition-colors duration-150"
              >
                <DiscordMark class="h-5 w-5" />
                Join the Discord
              </a>
            </div>
            <div class="bg-edge my-7 h-px" aria-hidden="true" />
            <div class="grid gap-6 sm:grid-cols-[30%_1fr] lg:grid-cols-[34%_1fr] lg:gap-8">
              <img
                src="/landing/cta_community_image.jpg"
                alt="Two hands raising pink and mango bubble teas on a sunny street"
                width={1536}
                height={1920}
                loading="lazy"
                decoding="async"
                class="rounded-surface aspect-[1.4/1] w-full object-cover object-[50%_60%] sm:aspect-[4/5]"
              />
              <div>
                <h3 class="text-ink text-[22px] font-semibold">What you get</h3>
                <ul class="mt-4 space-y-3">
                  {perks.map((perk) => (
                    <li key={perk} class="text-ink-muted flex items-center gap-3 text-[17px]">
                      <span aria-hidden="true" class="bg-accent h-2 w-2 shrink-0" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div class="bg-edge my-7 h-px" aria-hidden="true" />
            <dl class="grid gap-6 sm:grid-cols-2">
              <div>
                <dt class="text-ink text-lg font-semibold">Access</dt>
                <dd class="text-ink-muted mt-1 text-base">Invite-only, approved by an admin.</dd>
              </div>
              <div>
                <dt class="text-ink text-lg font-semibold">Rules</dt>
                <dd class="mt-1 text-base">
                  <Link href="/acceptable-use" class="lp-inline-link">
                    Read the acceptable use policy
                  </Link>
                </dd>
              </div>
            </dl>
          </div>

          <div class="border-edge flex flex-col border-t p-6 sm:p-8 md:border-t-0 md:border-l lg:p-10">
            <h3 class="text-ink text-[26px] font-semibold">Ready when you are</h3>
            <p class="text-ink-muted mt-2 text-[17px] leading-7">
              {user.value
                ? "You're signed in. Head to your dashboard or upload something new."
                : "Sign in with Discord, then check back once an admin approves your account."}
            </p>
            <ol class="mt-8 space-y-3">
              {statusRows.map((row, index) => (
                <li key={row.label} class="lp-control bg-canvas flex min-h-14 items-center gap-4 px-4">
                  <row.icon class="text-accent-text h-5 w-5 shrink-0" aria-hidden="true" />
                  <span class="text-ink text-base font-medium">
                    <span class="sr-only">Step {index + 1}: </span>
                    {row.label}
                  </span>
                  <span class="text-ink-muted ml-auto hidden text-sm sm:inline">{row.detail}</span>
                </li>
              ))}
            </ol>
            <div class="mt-6 flex flex-col gap-3 md:mt-auto md:pt-6">
              {user.value ? (
                <>
                  <Link href="/dashboard" class={cn(primaryButton, "min-h-14 w-full")}>
                    Open dashboard
                    <ArrowRight class="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link href="/upload" class="lp-ghost lp-press min-h-12 w-full">
                    <Upload class="h-4 w-4" aria-hidden="true" />
                    Upload a file
                  </Link>
                </>
              ) : (
                <LoginButton class={cn(primaryButton, "min-h-14 w-full")} label="Sign in with Discord" returnTo="/dashboard" />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Upload", href: "/upload" },
      { label: "ShareX setup", href: "/setup/sharex" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "How it works", href: "#how-it-works" },
      { label: "Bio pages", href: "#bio-pages" },
      { label: "Themes", href: "#themes" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
      { label: "Acceptable use", href: "/acceptable-use" },
      { label: "DMCA", href: "/dmca" },
    ],
  },
];

const footerLink =
  "focus-ring rounded-control text-ink/85 hover:text-accent-text inline-flex min-h-11 min-w-11 items-center text-base transition-colors duration-150 sm:text-lg";

export const LandingFooter = component$(() => (
  <footer class="bg-surface overflow-hidden px-5 pt-16 sm:px-8 lg:px-[72px] lg:pt-24">
    <div class="mx-auto max-w-[1440px]">
      <div class="grid gap-8 lg:grid-cols-[45%_1fr] lg:gap-[5%]">
        <p class="text-ink max-w-[20ch] text-[28px] leading-[1.2] font-medium sm:text-[34px]">
          Come say hi in the Discord.
        </p>
        <a
          href={DISCORD_INVITE}
          target="_blank"
          rel="noopener noreferrer"
          class="lp-footer-cta focus-ring rounded-control group flex min-h-14 items-center justify-between gap-4 self-center border-b pb-3"
        >
          <span class="text-ink-muted truncate text-lg tabular-nums sm:text-xl">discord.gg/RJ9Cedxvqe</span>
          <span class="text-ink group-hover:text-accent-text inline-flex shrink-0 items-center gap-2 text-base font-medium transition-colors duration-150">
            Join the Discord
            <Send class="h-5 w-5" aria-hidden="true" />
          </span>
        </a>
      </div>

      <div class="mt-16 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        {footerColumns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 class="text-ink text-lg font-semibold sm:text-[22px]">{column.title}</h2>
            <ul class="mt-4">
              {column.links.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith("#") ? (
                    <a href={link.href} class={footerLink}>
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} class={footerLink}>
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <div class="col-span-2 sm:col-span-3 lg:col-span-1">
          <h2 class="text-ink text-lg font-semibold sm:text-[22px]">Say hi</h2>
          <ul class="mt-4 space-y-1">
            <li>
              <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" class={cn(footerLink, "gap-3")}>
                <MessageCircle class="h-5 w-5" aria-hidden="true" />
                Join the Discord
              </a>
            </li>
            <li class="text-ink/85 flex min-h-11 items-center gap-3 text-base sm:text-lg">
              <ShieldCheck class="h-5 w-5 shrink-0" aria-hidden="true" />
              Invite-only, approved by admins
            </li>
            <li>
              <a href="mailto:contact@bwmp.dev" class={cn(footerLink, "gap-3")}>
                <Send class="h-5 w-5" aria-hidden="true" />
                contact@bwmp.dev
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div class="bg-edge mt-14 h-px" aria-hidden="true" />
      <div class="text-ink-muted flex flex-col items-center gap-3 py-6 text-sm sm:flex-row sm:justify-between">
        <span>© {new Date().getFullYear()} twink.forsale</span>
        <a
          href={DISCORD_INVITE}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="twink.forsale on Discord"
          class="focus-ring rounded-control text-ink hover:text-accent-text grid h-11 w-11 place-items-center transition-colors duration-150"
        >
          <DiscordMark class="h-6 w-6" />
        </a>
      </div>

      <div class="lp-wordmark-fit overflow-hidden pb-2" aria-hidden="true">
        <p data-reveal="wordmark" class="lp-wordmark font-display text-center leading-[0.9] font-extrabold tracking-[-0.04em] whitespace-nowrap">
          twink.forsale
        </p>
      </div>
    </div>
  </footer>
));
