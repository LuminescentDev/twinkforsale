import { $, component$, useSignal } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import {
  ArrowRight,
  ArrowUpRight,
  AtSign,
  Boxes,
  Check,
  CheckCircle2,
  Copy,
  FileDown,
  Globe,
  Link as LinkIcon,
  Link2,
  LogIn,
  MessageCircle,
  MonitorUp,
  Upload,
} from "lucide-icons-qwik";
import { LoginButton } from "~/components/auth/login-button";
import { cn } from "~/lib/utils";
import { useCurrentUser } from "~/routes/layout";
import { primaryButton } from "./landing-nav";

const integrations = [
  { icon: MessageCircle, label: "Discord" },
  { icon: MonitorUp, label: "ShareX" },
  { icon: Globe, label: "Any browser" },
  { icon: AtSign, label: "Your own domain" },
];

export const IntroStatement = component$(() => (
  <section id="intro" aria-labelledby="intro-title" class="px-5 py-24 text-center sm:px-6 lg:py-32">
    <p class="text-ink text-[13px] font-medium tracking-[0.24em] uppercase">
      A file host with a personality
    </p>
    <h2
      id="intro-title"
      class="text-ink mx-auto mt-10 max-w-[1100px] text-[clamp(1.5rem,3.4vw,3.25rem)] leading-[1.2] font-medium tracking-[-0.02em] lg:w-[76%]"
    >
      <span data-reveal="rise" class="block">
        Drop a file, get a link, and make it{" "}
        <span class="text-ink-muted">look like yours.</span>{" "}
      </span>
      <span data-reveal="rise" data-reveal-delay="80" class="block">
        Embeds, bio pages and themes turn a plain upload into something
        you'd actually <span class="text-ink-muted">want to share.</span>
      </span>
    </h2>
    <span aria-hidden="true" class="bg-edge mx-auto mt-14 block h-px w-[150px] sm:w-[100px]" />
    <p class="text-ink mt-14 text-xs font-semibold tracking-[0.2em] uppercase sm:mt-12">
      Works with
    </p>
    <ul class="mx-auto mt-8 grid max-w-[1000px] grid-cols-2 gap-y-8 sm:grid-cols-4">
      {integrations.map((item, index) => (
        <li
          key={item.label}
          data-reveal="rise"
          data-reveal-delay={String(index * 60)}
          class="text-ink-muted flex items-center justify-center gap-3"
        >
          <item.icon class="h-7 w-7 shrink-0" aria-hidden="true" />
          <span class="text-xs font-semibold tracking-[0.16em] uppercase sm:text-[13px]">
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  </section>
));

const steps = [
  {
    icon: LogIn,
    title: "Sign in with Discord",
    body: "Log in with your Discord account. An admin reviews new accounts, and you can upload once yours is approved.",
  },
  {
    icon: Upload,
    title: "Upload your way",
    body: "Drag files into the browser, or connect ShareX so screenshots upload the moment you take them.",
  },
  {
    icon: Link2,
    title: "Share the short link",
    body: "Every upload gets its own short URL. Copy it and paste it into Discord, a DM or anywhere else.",
  },
];

export const HowItWorks = component$(() => {
  const user = useCurrentUser();
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-title"
      class="bg-surface-subtle scroll-mt-[72px] px-5 py-20 sm:px-6 lg:py-28"
    >
      <div class="mx-auto grid grid-cols-1 max-w-[1200px] gap-12 lg:grid-cols-12 lg:gap-6">
        <div class="text-center md:text-left lg:col-span-5">
          <p class="text-ink-muted inline-flex items-center gap-2 text-[15px] font-medium">
            <Boxes class="h-5 w-5" aria-hidden="true" />
            How it works
          </p>
          <h2
            id="how-title"
            class="font-display text-ink mt-4 text-[clamp(2rem,4.5vw,4rem)] leading-[1.02] font-bold tracking-[-0.025em]"
          >
            From sign-in to shared link in three steps
          </h2>
          <div class="mt-8">
            {user.value ? (
              <Link href="/dashboard" class={cn(primaryButton, "min-h-12")}>
                Open dashboard
                <ArrowRight class="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <LoginButton
                class={cn(primaryButton, "min-h-12")}
                label="Sign in with Discord"
                returnTo="/dashboard"
              />
            )}
          </div>
        </div>
        <ol class="grid gap-4 sm:gap-6 lg:col-span-6 lg:col-start-7">
          {steps.map((step, index) => (
            <li
              key={step.title}
              data-reveal="slide"
              data-reveal-delay={String(index * 80)}
              class="bg-surface border-edge rounded-[16px] border p-7 sm:p-9"
            >
              <div class="flex items-start justify-between gap-4">
                <step.icon class="text-ink h-11 w-11 sm:h-12 sm:w-12" stroke-width={1.5} aria-hidden="true" />
                <span
                  aria-hidden="true"
                  class="font-display text-ink-muted/60 text-[44px] leading-none font-bold tabular-nums sm:text-[56px]"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 class="text-ink mt-8 text-[22px] font-semibold tracking-[-0.01em] sm:text-2xl">
                <span class="sr-only">Step {index + 1}: </span>
                {step.title}
              </h3>
              <p class="text-ink-muted mt-2 max-w-[46ch] text-base leading-6">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
});

const EXAMPLE_LINK = "twink.forsale/f/a8Kd2";

const CopyLinkChip = component$(() => {
  const copied = useSignal(false);
  const status = useSignal("");
  const textRef = useSignal<HTMLSpanElement>();

  const copy = $(async () => {
    try {
      await navigator.clipboard.writeText(`https://${EXAMPLE_LINK}`);
      copied.value = true;
      status.value = "Copied";
      setTimeout(() => {
        copied.value = false;
        status.value = "";
      }, 1500);
    } catch {
      status.value = "Couldn't copy. The link is selected so you can copy it yourself.";
      const node = textRef.value;
      if (node) {
        const range = document.createRange();
        range.selectNodeContents(node);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  });

  return (
    <div class="mt-6">
      <button
        type="button"
        onClick$={copy}
        aria-label="Copy example link"
        class="lp-press focus-ring rounded-control flex min-h-11 w-full items-center justify-between gap-3 bg-[color-mix(in_srgb,var(--ui-on-accent)_16%,transparent)] px-3 text-left text-sm font-medium tabular-nums transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--ui-on-accent)_24%,transparent)]"
      >
        <span ref={textRef} class="truncate">
          {EXAMPLE_LINK}
        </span>
        <span class="relative grid h-5 w-5 shrink-0 place-items-center" aria-hidden="true">
          <Copy class={cn("lp-swap absolute h-4 w-4", copied.value && "opacity-0")} />
          <Check class={cn("lp-swap absolute h-4 w-4", !copied.value && "opacity-0")} />
        </span>
      </button>
      <p aria-live="polite" class="mt-2 min-h-5 text-xs">
        {status.value}
      </p>
    </div>
  );
});

const uploadCards = [
  { icon: Upload, title: "Drag and drop", body: "Drop images, documents and other files straight into the browser." },
  { icon: MonitorUp, title: "ShareX uploads", body: "Screenshots upload the second you take them." },
  { icon: LinkIcon, title: "Short URLs", body: "Every file gets its own short link automatically." },
];

export const UploadSharing = component$(() => (
  <section
    id="upload-sharing"
    aria-labelledby="upload-title"
    class="scroll-mt-[72px] overflow-x-clip px-5 py-20 sm:px-6 lg:pt-32 lg:pb-40"
  >
    <div class="mx-auto max-w-[1400px] lg:px-4">
      <div class="flex flex-col items-center gap-6 text-center md:items-start md:text-left lg:flex-row lg:items-start lg:justify-between">
        <h2
          id="upload-title"
          class="font-display text-ink max-w-[16ch] text-[clamp(2.5rem,5.5vw,5rem)] leading-[0.98] font-bold tracking-[-0.03em]"
        >
          Your link, copied before you blink.
        </h2>
        <div class="max-w-[300px] lg:mt-6">
          <p class="text-ink text-[17px] leading-7">
            Uploads land, a short URL appears, and one click puts it on your clipboard.
          </p>
          <a href="#sharex" class="lp-ghost lp-press mt-5">
            How ShareX works
            <ArrowRight class="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>

      <ul class="mt-12 grid gap-5 md:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:gap-[1.5%]">
        {uploadCards.map((card, index) => (
          <li
            key={card.title}
            data-reveal="rise"
            data-reveal-delay={String(index * 80)}
            class="bg-surface border-edge flex flex-col rounded-[12px] border p-8 lg:min-h-[420px] lg:p-9"
          >
            <card.icon class="text-ink h-10 w-10" stroke-width={1.5} aria-hidden="true" />
            <h3 class="font-display text-ink mt-6 max-w-[9ch] text-[26px] leading-[1.1] font-bold tracking-[-0.015em] lg:mt-8">
              {card.title}
            </h3>
            <p class="text-ink-muted mt-4 text-base leading-6 lg:mt-auto">{card.body}</p>
          </li>
        ))}
        <li
          data-reveal="tilt"
          data-reveal-delay="240"
          class="lp-tilt bg-accent text-on-accent flex flex-col rounded-[12px] p-8 lg:min-h-[420px] lg:p-9"
        >
          <Copy class="h-10 w-10" stroke-width={1.5} aria-hidden="true" />
          <h3 class="font-display mt-6 max-w-[9ch] text-[26px] leading-[1.1] font-bold tracking-[-0.015em] lg:mt-8">
            Copy link
          </h3>
          <div class="lg:mt-auto">
            <p class="mt-4 text-base leading-6">
              One click and it's on your clipboard, ready to paste.
            </p>
            <CopyLinkChip />
          </div>
        </li>
      </ul>
    </div>
  </section>
));

const setupSteps = ["Download your config", "Double-click to open in ShareX", "Take a screenshot"];

export const ShareXSection = component$(() => (
  <section id="sharex" aria-labelledby="sharex-title" class="scroll-mt-[72px] px-[4%] py-16 lg:px-[2.7%] lg:py-28">
    <div class="rounded-surface mx-auto grid max-w-[1600px] overflow-hidden md:grid-cols-[40%_60%] lg:grid-cols-[32%_68%]">
      <div class="bg-accent-soft p-5 sm:p-6 lg:p-[26px]">
        <div class="bg-surface-subtle relative flex h-full min-h-[280px] flex-col justify-center rounded-[16px] p-6 sm:p-8">
          <span class="lp-example">Example</span>
          <div
            data-reveal="drop"
            class="bg-surface border-edge rounded-control flex items-center gap-3 border px-4 py-3"
          >
            <FileDown class="text-accent-text h-5 w-5 shrink-0" aria-hidden="true" />
            <span class="text-ink truncate text-sm font-medium tabular-nums">twink.forsale.sxcu</span>
            <span class="text-ink-muted ml-auto shrink-0 text-xs tabular-nums">2 KB</span>
          </div>
          <ol class="mt-6 space-y-4">
            {setupSteps.map((step, index) => (
              <li
                key={step}
                data-reveal="rise"
                data-reveal-delay={String(120 + index * 80)}
                class="text-ink flex items-center gap-3 text-[15px]"
              >
                <CheckCircle2 class="text-accent-text h-5 w-5 shrink-0" aria-hidden="true" />
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div class="bg-surface flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-16 lg:py-20">
        <p class="text-ink-muted text-[17px] italic">What's ShareX?</p>
        <h2
          id="sharex-title"
          class="font-display text-ink mt-3 text-[clamp(2rem,4.6vw,4.5rem)] leading-[1.02] font-bold tracking-[-0.03em]"
        >
          ShareX, set up in one click
        </h2>
        <p class="text-ink mt-6 max-w-[60ch] text-[17px] leading-7 lg:text-[19px] lg:leading-8">
          ShareX is a free Windows app that uploads your screenshots the moment
          you take them. Download your personal config, open it, and every
          capture goes straight to your twink.forsale account.
        </p>
        <Link
          href="/setup/sharex"
          class="lp-press focus-ring bg-accent text-on-accent hover:bg-accent-hover rounded-control mt-10 inline-flex min-h-14 w-full max-w-[360px] items-center justify-between gap-6 py-2 pr-2 pl-5 text-base font-medium transition-colors duration-150 sm:w-auto"
        >
          Download ShareX config
          <span
            aria-hidden="true"
            class="rounded-control grid h-10 w-10 place-items-center bg-[color-mix(in_srgb,var(--ui-on-accent)_16%,transparent)]"
          >
            <ArrowUpRight class="h-5 w-5" />
          </span>
        </Link>
      </div>
    </div>
  </section>
));
