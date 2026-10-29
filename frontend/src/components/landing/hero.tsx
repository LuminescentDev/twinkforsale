import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { ArrowRight, Link2, MonitorUp, Palette, Upload } from "lucide-icons-qwik";
import { LoginButton } from "~/components/auth/login-button";
import { cn } from "~/lib/utils";
import { useCurrentUser } from "~/routes/layout";
import { primaryButton } from "./landing-nav";

// Grid placement mirrors the reference's full-bleed photo: tiles run past
// every edge so the collage reads as a surface, not a gallery.
const tiles = [
  { src: "/landing/hero_upload_collage_01.jpg", w: 1704, h: 1278, place: "lg:col-start-1 lg:row-start-1 lg:row-span-2", chip: null, pos: "30% 50%" },
  { src: "/landing/hero_upload_collage_02.jpg", w: 1332, h: 999, place: "lg:col-start-2 lg:row-start-1", chip: null, pos: "50% 40%" },
  { src: "/landing/hero_upload_collage_04.jpg", w: 1432, h: 1074, place: "lg:col-start-4 lg:row-start-1", chip: null, pos: "50% 50%" },
  { src: "/landing/hero_upload_collage_05.jpg", w: 1704, h: 1278, place: "lg:col-start-4 lg:row-start-2 lg:row-span-2", chip: { text: "sunset.png", at: "bottom-6 left-6" }, pos: "40% 50%" },
  { src: "/landing/hero_upload_collage_06.jpg", w: 1280, h: 1280, place: "lg:col-start-1 lg:row-start-3", chip: { text: "twink.forsale/f/a8Kd2", at: "bottom-6 right-6" }, pos: "50% 50%" },
  { src: "/landing/hero_upload_collage_03.jpg", w: 1280, h: 1280, place: "lg:col-start-3 lg:row-start-1 lg:row-span-2", chip: null, pos: "50% 40%" },
  { src: "/landing/hero_upload_collage_07.jpg", w: 1920, h: 1440, place: "hidden lg:block lg:col-start-3 lg:row-start-3", chip: null, pos: "50% 50%" },
  { src: "/landing/hero_upload_collage_08.jpg", w: 2048, h: 1536, place: "hidden lg:block lg:col-start-2 lg:row-start-2 lg:row-span-2", chip: null, pos: "25% 50%" },
];

const features = [
  { icon: MonitorUp, title: "ShareX in one click", body: "Screenshots upload as you take them" },
  { icon: Link2, title: "Short links", body: "Copy, paste, done" },
  { icon: Palette, title: "Your own embeds", body: "Colors and titles on Discord" },
];

export const Hero = component$(() => {
  const user = useCurrentUser();

  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      class="relative isolate flex min-h-[100svh] flex-col overflow-hidden sm:min-h-[max(100svh,720px)]"
    >
      <div
        aria-hidden="true"
        class="absolute -inset-[3%] -z-20 grid grid-cols-2 grid-rows-3 gap-3 lg:grid-cols-4"
      >
        {tiles.map((tile, index) => (
          <div
            key={tile.src}
            class={cn("lp-hero-tile relative overflow-hidden rounded-surface", tile.place)}
            style={{ "--d": `${Math.min(Math.floor(index / 2) * 60, 240)}ms` }}
          >
            <img
              src={tile.src}
              alt=""
              width={tile.w}
              height={tile.h}
              loading="eager"
              decoding="async"
              class="h-full w-full object-cover saturate-[0.85]"
              style={{ objectPosition: tile.pos }}
            />
            {tile.chip && (
              <span
                class={cn(
                  "bg-surface text-ink rounded-control absolute hidden px-2 py-1 text-xs font-medium tabular-nums lg:block",
                  tile.chip.at,
                )}
              >
                {tile.chip.text}
              </span>
            )}
          </div>
        ))}
      </div>
      <div aria-hidden="true" class="lp-hero-scrim absolute inset-0 -z-10" />

      <div class="mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center justify-center px-5 pt-[88px] pb-10 text-center sm:px-6">
        <p
          class="lp-hero-in text-ink text-[13px] font-medium tracking-[0.2em] uppercase"
          style={{ "--d": "120ms" }}
        >
          Upload <span class="text-accent-text" aria-hidden="true">•</span> Shorten{" "}
          <span class="text-accent-text" aria-hidden="true">•</span> Share
        </p>
        <span
          aria-hidden="true"
          class="lp-hero-in bg-ink/40 mt-5 block h-px w-16"
          style={{ "--d": "160ms" }}
        />
        <h1
          id="hero-title"
          class="lp-hero-in font-display text-ink mt-6 text-[clamp(2.5rem,12vw,3.25rem)] leading-[0.95] font-bold tracking-[-0.03em] sm:text-[clamp(3rem,6.4vw,6rem)]"
          style={{ "--d": "190ms" }}
        >
          twink.forsale
        </h1>
        <p
          class="lp-hero-in font-display text-ink mt-5 max-w-[16ch] text-[clamp(1.75rem,3.4vw,3rem)] leading-[1.08] font-semibold tracking-[-0.015em] sm:max-w-none"
          style={{ "--d": "260ms" }}
        >
          Screenshots, but make them cute.
        </p>
        <p
          class="lp-hero-in text-ink/85 mt-6 max-w-[56ch] text-[17px] leading-7"
          style={{ "--d": "330ms" }}
        >
          Upload from ShareX or your browser and get a short link you can paste
          anywhere. It's invite-only, so sign in with Discord and an admin will
          approve your account.
        </p>
        <div
          class="lp-hero-in mt-9 flex w-full max-w-[320px] flex-col items-stretch justify-center gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center"
          style={{ "--d": "400ms" }}
        >
          {user.value ? (
            <>
              <Link href="/dashboard" class={cn(primaryButton, "min-h-12")}>
                Open dashboard
                <ArrowRight class="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/upload" class="lp-ghost lp-press min-h-12">
                <Upload class="h-4 w-4" aria-hidden="true" />
                Upload a file
              </Link>
            </>
          ) : (
            <LoginButton
              class={cn(primaryButton, "min-h-12")}
              label="Sign in with Discord"
              returnTo="/dashboard"
            />
          )}
        </div>
      </div>

      <ul
        class="lp-hero-in mx-auto grid w-full max-w-[860px] grid-cols-3 gap-2 px-4 pb-8 sm:px-6 lg:pb-10"
        style={{ "--d": "460ms" }}
        aria-label="Highlights"
      >
        {features.map((feature, index) => (
          <li
            key={feature.title}
            class={cn(
              "flex flex-col items-center gap-2 text-center sm:flex-row sm:items-start sm:gap-3 sm:px-4 sm:text-left",
              index > 0 && "sm:border-ink/30 sm:border-l",
            )}
          >
            <feature.icon class="text-ink h-7 w-7 shrink-0" aria-hidden="true" />
            <span>
              <span class="text-ink block text-[12px] font-semibold tracking-[0.08em] uppercase sm:text-[13px]">
                {feature.title}
              </span>
              <span class="text-ink/75 mt-0.5 hidden text-[13px] leading-5 sm:block">
                {feature.body}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
});
