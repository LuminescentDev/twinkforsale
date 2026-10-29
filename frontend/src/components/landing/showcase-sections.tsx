import { $, component$, useSignal, type QRL } from "@builder.io/qwik";
import {
  ArrowRight,
  FileText,
  Folder,
  Image as ImageIcon,
  Info,
  MessageCircle,
  Music,
  Palette,
  Search,
  Type,
  User,
} from "lucide-icons-qwik";
import { LoginButton } from "~/components/auth/login-button";
import { Link } from "@builder.io/qwik-city";
import { cn } from "~/lib/utils";
import { palettes, type PaletteName } from "~/lib/theme-store";
import { useCurrentUser } from "~/routes/layout";

const embedColors = [
  { name: "Pink", value: "#DB2777" },
  { name: "Violet", value: "#7C3AED" },
  { name: "Sky", value: "#0EA5E9" },
  { name: "Green", value: "#16A34A" },
];

const embedFacts = [
  { icon: Palette, label: "Your color", value: "Any hex color for the side bar" },
  { icon: Type, label: "Title and text", value: "Custom title and description" },
  { icon: User, label: "Author line", value: "Your name above the title" },
  { icon: Info, label: "File info and date", value: "Size and upload date, if you want" },
];

const embedSpec = [
  ["Color", "#DB2777"],
  ["Title", "sunset.png"],
  ["Author", "juniper"],
  ["Footer", "shared on twink.forsale"],
  ["File info", "2.4 MB, uploaded today"],
  ["Image", "Original 16:9 ratio"],
];

export const EmbedsSection = component$(() => {
  const color = useSignal(embedColors[0].value);

  return (
    <section id="embeds" aria-labelledby="embeds-title" class="scroll-mt-[72px] px-5 py-20 sm:px-6 lg:py-28">
      <div class="mx-auto grid grid-cols-1 max-w-[1440px] gap-12 lg:grid-cols-[45fr_47fr] lg:gap-[5%]">
        <div>
          <p class="text-ink inline-flex items-center gap-2.5 text-sm font-medium">
            <span aria-hidden="true" class="bg-accent h-2.5 w-2.5 rounded-full" />
            Discord embeds
          </p>
          <h2
            id="embeds-title"
            class="font-display text-ink mt-5 text-[clamp(2.25rem,5.4vw,5.25rem)] leading-[0.98] font-bold tracking-[-0.03em]"
          >
            Embeds that <span class="text-accent-text block">look like you.</span>
          </h2>
          <p class="text-ink-muted mt-6 max-w-[52ch] text-[17px] leading-7">
            Choose the title, description, color, author and footer Discord
            shows when someone opens your link. Images keep their real
            proportions, so nothing gets squished.
          </p>

          <ul class="mt-10 grid gap-0 sm:grid-cols-4 sm:gap-4">
            {embedFacts.map((fact) => (
              <li
                key={fact.label}
                class="border-edge flex items-center gap-4 border-b py-4 sm:flex-col sm:border-0 sm:py-0 sm:text-center"
              >
                <span class="bg-surface-subtle grid h-[72px] w-[72px] shrink-0 place-items-center rounded-full">
                  <fact.icon class="text-ink h-6 w-6" aria-hidden="true" />
                </span>
                <span>
                  <span class="text-ink block text-xs font-medium tracking-[0.1em] uppercase">
                    {fact.label}
                  </span>
                  <span class="text-ink-muted mt-1 block text-sm sm:hidden">{fact.value}</span>
                </span>
              </li>
            ))}
          </ul>

          <dl class="border-edge mt-12 hidden border-t sm:block">
            {embedSpec.map(([label, value]) => (
              <div key={label} class="border-edge grid grid-cols-[22%_1fr] gap-4 border-b py-3.5">
                <dt class="text-ink-muted text-[13px] font-medium tracking-[0.08em] uppercase">{label}</dt>
                <dd class="text-ink text-sm font-medium tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div class="lg:pt-[3%]">
          <div class="bg-surface-subtle relative overflow-hidden rounded-[16px] p-5 sm:p-8">
            <span class="lp-example">Example</span>
            <div data-reveal="media" class="mx-auto mt-6 max-w-[520px]">
              <article
                class="bg-canvas border-edge rounded-control flex overflow-hidden border"
                aria-label="Example Discord embed"
              >
                <span
                  aria-hidden="true"
                  class="lp-embed-bar w-1 shrink-0"
                  style={{ backgroundColor: color.value }}
                />
                <div class="min-w-0 flex-1 p-4">
                  <p class="text-ink text-[13px] font-semibold">juniper</p>
                  <p class="lp-embed-title mt-1 text-base font-semibold" style={{ color: color.value }}>
                    sunset.png
                  </p>
                  <p class="text-ink-muted mt-1 text-sm">Golden hour from the pier, finally.</p>
                  <img
                    src="/landing/embed_sample_image.jpg"
                    width={1920}
                    height={1080}
                    alt="Example upload: a pink and orange sunset over the sea with a stone pier"
                    loading="lazy"
                    decoding="async"
                    class="rounded-control mt-3 aspect-video w-full object-cover"
                  />
                  <p class="text-ink-muted mt-3 text-xs tabular-nums">
                    shared on twink.forsale · 2.4 MB · today
                  </p>
                </div>
              </article>
            </div>
          </div>

          <div role="group" aria-label="Embed color" class="mt-3 grid grid-cols-4 gap-2 sm:gap-3">
            {embedColors.map((option, index) => (
              <button
                key={option.value}
                type="button"
                data-reveal="rise"
                data-reveal-delay={String(index * 60)}
                aria-pressed={color.value === option.value}
                aria-label={`${option.name} embed color`}
                onClick$={() => (color.value = option.value)}
                class={cn(
                  "lp-press focus-ring bg-surface-subtle rounded-surface flex min-h-16 items-stretch gap-2 overflow-hidden border-2 p-2 text-left transition-colors duration-150",
                  color.value === option.value ? "border-accent-text" : "border-transparent hover:border-edge",
                )}
              >
                <span aria-hidden="true" class="w-1 shrink-0 rounded-full" style={{ backgroundColor: option.value }} />
                <span class="min-w-0">
                  <span class="text-ink block truncate text-xs font-semibold">{option.name}</span>
                  <span class="text-ink-muted block truncate text-[11px] tabular-nums">{option.value}</span>
                </span>
              </button>
            ))}
          </div>
          <p class="text-ink-muted mt-5 max-w-[48ch] text-base leading-6">
            Example embed. Your settings apply the next time a link is shared.
          </p>
        </div>
      </div>
    </section>
  );
});

const bios = [
  {
    name: "Juniper",
    handle: "twink.forsale/juniper",
    avatar: "/landing/bio_avatar_juniper.jpg",
    alt: "Illustrated grey cat avatar",
    pos: "50% 50%",
    body: "Shares sketches, playlists and a very serious cat.",
    links: ["Sketchbook", "Playlists", "Discord"],
  },
  {
    name: "Rook",
    handle: "twink.forsale/rook",
    avatar: "/landing/bio_avatar_rook.jpg",
    alt: "Hand-colored raven engraving avatar",
    pos: "50% 35%",
    body: "Streams on weekends, posts clips everywhere else.",
    links: ["Clips", "Stream schedule", "Discord"],
  },
  {
    name: "Mika",
    handle: "twink.forsale/mika",
    avatar: "/landing/bio_avatar_mika.jpg",
    alt: "Illustrated white bunny avatar",
    pos: "50% 50%",
    body: "Pixel art, pronouns, and a link to the good Discord.",
    links: ["Pixel art", "Commissions", "Discord"],
  },
];

const linkIcons = [Palette, Music, MessageCircle];

export const BioPagesSection = component$(() => (
  <section id="bio-pages" aria-labelledby="bio-title" class="scroll-mt-[72px] px-5 py-20 sm:px-6 lg:py-28">
    <div class="mx-auto max-w-[1440px]">
      <div class="grid gap-6 lg:grid-cols-[52%_1fr] lg:gap-[5%]">
        <div>
          <p class="text-accent-text text-sm font-medium">/ Bio pages</p>
          <h2
            id="bio-title"
            class="font-display text-ink mt-3 max-w-[12ch] text-[clamp(2.5rem,5vw,4.75rem)] leading-[1] font-bold tracking-[-0.03em]"
          >
            A page that's all you
          </h2>
        </div>
        <p class="text-ink-muted max-w-[52ch] text-[17px] leading-7 lg:border-edge lg:self-end lg:border-l lg:pl-8">
          Put your links, Discord presence, Spotify and colors on one public
          page at twink.forsale/yourname. The three below are examples, not
          real members.
        </p>
      </div>

      <ul class="border-edge mt-12 grid overflow-hidden rounded-surface border md:gap-[2.3%] md:overflow-visible md:border-0 md:rounded-none md:grid-cols-3">
        {bios.map((bio, index) => (
          <li
            key={bio.name}
            data-reveal="media"
            data-reveal-delay={String(index * 80)}
            class="border-edge grid grid-cols-[40%_1fr] gap-4 border-b p-4 last:border-b-0 md:flex md:flex-col md:rounded-surface md:border md:last:border-b"
          >
            <div class="border-edge rounded-surface relative aspect-square overflow-hidden border">
              <span class="lp-example">Example</span>
              <img
                src={bio.avatar}
                alt={bio.alt}
                width={1024}
                height={1024}
                loading="lazy"
                decoding="async"
                class="h-full w-full object-cover"
                style={{ objectPosition: bio.pos }}
              />
            </div>
            <div class="min-w-0 md:mt-2">
              <h3 class="font-display text-ink text-2xl font-bold tracking-[-0.015em] md:text-[32px]">
                {bio.name}
              </h3>
              <p class="text-accent-text mt-1 truncate text-sm font-medium tabular-nums">{bio.handle}</p>
              <span aria-hidden="true" class="bg-accent mt-4 block h-[3px] w-12" />
              <p class="text-ink-muted mt-4 text-[15px] leading-6">{bio.body}</p>
              <ul class="mt-5 hidden space-y-2 lg:block" aria-label={`${bio.name}'s links`}>
                {bio.links.map((label, linkIndex) => {
                  const Icon = linkIcons[linkIndex];
                  return (
                    <li
                      key={label}
                      class="bg-surface-subtle rounded-control text-ink flex items-center gap-3 px-3 py-2 text-sm"
                    >
                      <Icon class="text-ink-muted h-4 w-4" aria-hidden="true" />
                      {label}
                    </li>
                  );
                })}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </section>
));

const themeOrder: { value: PaletteName; label: string }[] = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "pastel", label: "Pastel" },
  { value: "neon", label: "Neon" },
  { value: "valentine", label: "Valentine" },
];

const previewStyle = (name: PaletteName) => {
  const p = palettes[name];
  return {
    "--p-canvas": p.canvas,
    "--p-surface": p.surface,
    "--p-subtle": p.surfaceSubtle,
    "--p-edge": p.edge,
    "--p-ink": p.ink,
    "--p-muted": p.inkMuted,
    "--p-accent": p.accent,
    "--p-on-accent": p.onAccent,
    "--p-accent-text": p.accentText,
  };
};

const ThemeRadio = component$<{
  selected: PaletteName;
  onSelect$: QRL<(name: PaletteName) => void>;
}>(({ selected, onSelect$ }) => {
  const onKey = $((event: KeyboardEvent, current: number) => {
    const delta =
      event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;
    const next = (current + delta + themeOrder.length) % themeOrder.length;
    onSelect$(themeOrder[next].value);
    const group = (event.target as HTMLElement).closest("[role=radiogroup]");
    requestAnimationFrame(() => group?.querySelectorAll<HTMLElement>("[role=radio]")[next]?.focus());
  });

  return (
    <div
      role="radiogroup"
      aria-label="Preview a theme"
      class="lp-scroll-x -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:justify-between sm:px-0"
    >
      {themeOrder.map((theme, index) => {
        const checked = selected === theme.value;
        return (
          <button
            key={theme.value}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            onClick$={() => onSelect$(theme.value)}
            onKeyDown$={(event) => onKey(event, index)}
            class={cn(
              "focus-ring rounded-control relative flex min-h-11 shrink-0 items-center gap-2.5 px-3 text-lg font-medium transition-colors duration-200 sm:text-xl",
              checked ? "text-ink" : "text-ink-muted hover:text-ink",
            )}
          >
            <span
              aria-hidden="true"
              class="border-edge h-5 w-5 rounded-full border"
              style={{
                background: `linear-gradient(135deg, ${palettes[theme.value].canvas} 50%, ${palettes[theme.value].accent} 50%)`,
              }}
            />
            {theme.label}
            <span
              aria-hidden="true"
              class={cn(
                "bg-accent-text absolute inset-x-3 bottom-1 h-0.5 origin-left transition-transform duration-200",
                checked ? "scale-x-100" : "scale-x-0",
              )}
            />
          </button>
        );
      })}
    </div>
  );
});

export const ThemesSection = component$(() => {
  const user = useCurrentUser();
  const selected = useSignal<PaletteName>("dark");
  const select = $((name: PaletteName) => {
    selected.value = name;
  });

  return (
    <section id="themes" aria-labelledby="themes-title" class="scroll-mt-[72px] px-5 py-20 sm:px-6 lg:py-28">
      <div class="mx-auto grid grid-cols-1 max-w-[1560px] gap-10 lg:grid-cols-[19%_1fr] lg:gap-[1.5%]">
        <div class="flex flex-col gap-10 lg:justify-between lg:pb-[18%]">
          <p class="text-ink inline-flex items-center gap-2.5 text-[15px] font-medium">
            <span aria-hidden="true" class="bg-accent h-2 w-2" />
            Themes
          </p>
          <div class="order-last lg:order-none">
            <p class="font-display text-ink text-[64px] leading-none font-bold tabular-nums lg:text-[80px]">5</p>
            <div class="mt-3 flex gap-1.5" aria-hidden="true">
              {themeOrder.map((theme) => (
                <span
                  key={theme.value}
                  class="border-edge h-4 w-4 rounded-full border"
                  style={{
                    background: `linear-gradient(135deg, ${palettes[theme.value].canvas} 50%, ${palettes[theme.value].accent} 50%)`,
                  }}
                />
              ))}
            </div>
            <p class="text-ink-muted mt-3 text-base">Built-in themes</p>
          </div>
        </div>

        <div>
          <h2
            id="themes-title"
            class="font-display text-ink text-[clamp(2.25rem,4.6vw,4.5rem)] leading-[1.02] font-bold tracking-[-0.03em]"
          >
            Five themes. <span class="text-accent-text block">Same easy layout.</span>
          </h2>

          <div class="mt-10 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 lg:grid-cols-[1fr_1fr_1.35fr] lg:gap-6">
            <div
              class="lp-theme-preview contents"
              style={previewStyle(selected.value)}
            >
              <figure class="lp-preview-card relative flex aspect-[3/4] flex-col overflow-hidden rounded-[20px] border p-4">
                <span class="lp-example">Example</span>
                <figcaption class="sr-only">Files view in the {selected.value} theme</figcaption>
                <div class="lp-p-ink mt-8 flex items-center gap-2 text-sm font-semibold">
                  <Folder class="h-4 w-4" aria-hidden="true" /> Files
                </div>
                <div class="lp-p-subtle lp-p-muted mt-3 flex items-center gap-2 rounded-md px-2.5 py-2 text-xs">
                  <Search class="h-3.5 w-3.5" aria-hidden="true" /> Search uploads
                </div>
                <ul class="mt-3 space-y-2">
                  {[
                    [ImageIcon, "sunset.png", "2.4 MB"],
                    [ImageIcon, "cat-nap.jpg", "1.1 MB"],
                    [FileText, "notes.pdf", "86 KB"],
                    [ImageIcon, "tulips.jpg", "3.0 MB"],
                  ].map(([Icon, name, size], row) => {
                    const RowIcon = Icon as typeof ImageIcon;
                    return (
                      <li
                        key={name as string}
                        class={cn(
                          "lp-p-row flex items-center gap-2 rounded-md px-2.5 py-2 text-xs",
                          row === 0 && "lp-p-selected",
                        )}
                      >
                        <RowIcon class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span class="lp-p-ink min-w-0 flex-1 truncate">{name as string}</span>
                        <span class="lp-p-muted tabular-nums">{size as string}</span>
                      </li>
                    );
                  })}
                </ul>
                <span class="lp-p-button mt-auto rounded-md px-3 py-2 text-center text-xs font-semibold">
                  Upload
                </span>
              </figure>

              <figure class="lp-preview-card relative flex aspect-[3/4] flex-col items-center overflow-hidden rounded-[20px] border p-4 text-center">
                <span class="lp-example">Example</span>
                <figcaption class="sr-only">Bio page in the {selected.value} theme</figcaption>
                <img
                  src="/landing/bio_avatar_mika.jpg"
                  alt=""
                  width={1024}
                  height={1024}
                  loading="lazy"
                  class="mt-9 h-16 w-16 rounded-full object-cover"
                />
                <p class="lp-p-ink mt-3 text-sm font-semibold">Mika</p>
                <p class="lp-p-accent text-xs tabular-nums">twink.forsale/mika</p>
                <ul class="mt-4 w-full space-y-2">
                  {["Pixel art", "Commissions", "Discord"].map((label) => (
                    <li key={label} class="lp-p-row lp-p-ink rounded-md px-2.5 py-2 text-xs">
                      {label}
                    </li>
                  ))}
                </ul>
              </figure>
            </div>

            <div class="col-span-2 lg:col-span-1 lg:pt-4">
              <p class="text-ink max-w-[46ch] text-[17px] leading-7 lg:text-lg">
                Switch between dark, light, pastel, neon and valentine in your
                settings. Colors and mood change, but buttons, menus and your
                files stay exactly where you left them.
              </p>
              <div class="mt-8">
                {user.value ? (
                  <Link href="/dashboard/settings" class="lp-ghost lp-press min-h-12">
                    Open settings
                    <ArrowRight class="h-4 w-4" aria-hidden="true" />
                  </Link>
                ) : (
                  <LoginButton class="lp-ghost lp-press min-h-12" label="Sign in with Discord" returnTo="/dashboard" />
                )}
              </div>
            </div>
          </div>

          <div class="border-edge mt-12 border-t pt-6">
            <ThemeRadio selected={selected.value} onSelect$={select} />
          </div>
        </div>
      </div>
    </section>
  );
});
