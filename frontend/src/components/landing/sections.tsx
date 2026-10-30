import { $, component$, useSignal } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { Check, Copy, MessageCircle, Music, Palette } from "lucide-icons-qwik";
import { LoginButton } from "~/components/auth/login-button";
import { cn } from "~/lib/utils";
import { palettes, type PaletteName } from "~/lib/theme-store";
import { useCurrentUser } from "~/routes/layout";
import { Box } from "./box";

const DISCORD_INVITE = "https://discord.gg/RJ9Cedxvqe";
const EXAMPLE_LINK = "twink.forsale/f/a8Kd2";

const goButton = "lp-btn lp-btn-go lp-focus";
const plainButton = "lp-btn lp-focus";

const CopyExampleLink = component$(() => {
  const copied = useSignal(false);
  const status = useSignal("");

  const copy = $(async () => {
    try {
      await navigator.clipboard.writeText(`https://${EXAMPLE_LINK}`);
      copied.value = true;
      status.value = "Copied example link";
      setTimeout(() => {
        copied.value = false;
        status.value = "";
      }, 1500);
    } catch {
      status.value = "Couldn't copy the example link";
    }
  });

  return (
    <div class="lp-alt lp-frame mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2">
      <span class="lp-pixel lp-muted text-sm">your link:</span>
      <code class="lp-ink min-w-0 flex-1 truncate text-sm font-semibold">
        {EXAMPLE_LINK}
      </code>
      <button
        type="button"
        onClick$={copy}
        class={cn(plainButton, "min-h-9 px-3 text-sm")}
      >
        <span
          class="relative grid h-4 w-4 place-items-center"
          aria-hidden="true"
        >
          <Copy
            class={cn("lp-swap absolute h-4 w-4", copied.value && "opacity-0")}
          />
          <Check
            class={cn("lp-swap absolute h-4 w-4", !copied.value && "opacity-0")}
          />
        </span>
        {copied.value ? "copied!" : "copy"}
      </button>
      <span aria-live="polite" class="sr-only">
        {status.value}
      </span>
    </div>
  );
});

const gallery = [
  {
    src: "/landing/hero_upload_collage_01.jpg",
    w: 1704,
    h: 1278,
    name: "kitten.png",
    pos: "30% 50%",
  },
  {
    src: "/landing/embed_sample_image.jpg",
    w: 1920,
    h: 1080,
    name: "sunset.png",
    pos: "50% 50%",
  },
  {
    src: "/landing/hero_upload_collage_08.jpg",
    w: 2048,
    h: 1536,
    name: "nap-time.jpg",
    pos: "25% 50%",
  },
];

export const Welcome = component$(() => {
  const user = useCurrentUser();

  return (
    <Box id="welcome" title="welcome!!">
      <h3 class="lp-pixel lp-ink text-2xl font-bold sm:text-3xl">
        Screenshots, but make them cute.
      </h3>
      <p class="lp-ink mt-3 max-w-[62ch] text-[15px] leading-7">
        Upload from ShareX or your browser, get a short link, and make your
        Discord embeds and bio page look like you. It's invite-only, so sign in
        with Discord and an admin will let you in.
      </p>
      <div class="mt-5 flex flex-wrap gap-3">
        {user.value ? (
          <>
            <Link href="/dashboard" class={goButton}>
              enter (your dashboard)
            </Link>
            <Link href="/upload" class={plainButton}>
              upload a file
            </Link>
          </>
        ) : (
          <>
            <LoginButton
              class={goButton}
              iconClass="h-4 w-4"
              label="enter (sign in with Discord)"
              returnTo="/dashboard"
            />
            <Link href="/setup/sharex" class={plainButton}>
              get the ShareX config
            </Link>
          </>
        )}
      </div>

      <ul
        class="mt-6 grid grid-cols-3 gap-2 sm:gap-3"
        aria-label="Example uploads"
      >
        {gallery.map((item) => (
          <li key={item.name}>
            <figure class="lp-frame bg-white p-1">
              <img
                src={item.src}
                width={item.w}
                height={item.h}
                alt=""
                loading="eager"
                decoding="async"
                class="aspect-[4/3] w-full object-cover"
                style={{ objectPosition: item.pos }}
              />
              <figcaption class="lp-pixel truncate pt-1 text-center text-xs text-[#301030] sm:text-sm">
                {item.name}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <CopyExampleLink />
    </Box>
  );
});

const steps = [
  {
    title: "sign in with Discord",
    body: "An admin takes a look at new accounts. Once you're approved, you're in.",
  },
  {
    title: "upload however you like",
    body: "Drag files into the browser, paste a screenshot, or set up ShareX once and forget about it.",
  },
  {
    title: "paste the link",
    body: "Every upload gets a short link. Drop it in a DM, a server, wherever.",
  },
];

export const HowItWorks = component$(() => (
  <Box id="how-it-works" title="how it works">
    <ol class="space-y-4">
      {steps.map((step, index) => (
        <li key={step.title} class="flex gap-3">
          <span
            aria-hidden="true"
            class="lp-box-title grid h-8 w-8 shrink-0 place-items-center text-base font-bold"
          >
            {index + 1}
          </span>
          <div>
            <h3 class="lp-pixel lp-ink text-lg font-bold">
              <span class="sr-only">Step {index + 1}: </span>
              {step.title}
            </h3>
            <p class="lp-muted text-[15px] leading-6">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
    <hr class="lp-hr my-5" />
    <p class="lp-ink text-[15px]">
      On Windows?{" "}
      <Link href="/setup/sharex" class="lp-link">
        Grab the one-click ShareX config
      </Link>{" "}
      and screenshots upload the moment you take them.
    </p>
  </Box>
));

const embedColors = [
  { name: "Pink", value: "#FF3D8B" },
  { name: "Lilac", value: "#8B6BFF" },
  { name: "Sky", value: "#2E9BEA" },
  { name: "Mint", value: "#22A06B" },
  { name: "Orange", value: "#F07B1F" },
];

const themeList: { value: PaletteName; label: string }[] = [
  { value: "valentine", label: "valentine" },
  { value: "pastel", label: "pastel" },
  { value: "light", label: "light" },
  { value: "dark", label: "dark" },
  { value: "neon", label: "neon" },
];

const bioLinks = [
  { icon: Palette, label: "pixel art" },
  { icon: Music, label: "on repeat" },
  { icon: MessageCircle, label: "discord" },
];

export const MakeItYours = component$(() => {
  const color = useSignal(embedColors[0].value);

  return (
    <Box id="make-it-yours" title="make it yours">
      <div class="grid gap-6 md:grid-cols-2">
        <div>
          <h3 class="lp-pixel lp-ink text-lg font-bold">
            your own Discord embeds
          </h3>
          <p class="lp-muted mt-1 text-[15px] leading-6">
            Pick the color, title, description, author and footer people see
            when your link unfurls. Images keep their real shape, so nothing
            gets squished.
          </p>
          <fieldset class="mt-4">
            <legend class="lp-pixel lp-ink text-sm">try a color:</legend>
            <div class="mt-2 flex flex-wrap gap-2">
              {embedColors.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={color.value === option.value}
                  aria-label={`${option.name} embed color`}
                  title={option.name}
                  onClick$={() => (color.value = option.value)}
                  class={cn(
                    "lp-focus h-9 w-9 border-2 border-[var(--c-ink)]",
                    color.value === option.value &&
                      "outline-2 outline-offset-2 outline-[var(--c-ink)] outline-solid",
                  )}
                  style={{ backgroundColor: option.value }}
                />
              ))}
            </div>
          </fieldset>
        </div>

        <figure>
          <figcaption class="lp-pixel lp-muted mb-2 text-sm">
            example: how it looks in Discord
          </figcaption>
          <article
            class="flex overflow-hidden rounded-[4px] bg-[#2b2d31] text-[#dbdee1]"
            aria-label="Example Discord embed"
          >
            <span
              aria-hidden="true"
              class="lp-embed-accent w-1 shrink-0"
              style={{ backgroundColor: color.value }}
            />
            <div class="min-w-0 flex-1 p-3">
              <p class="text-xs font-semibold text-white">juniper</p>
              <p
                class="lp-embed-accent mt-1 text-[15px] font-semibold"
                style={{ color: color.value }}
              >
                sunset.png
              </p>
              <p class="mt-0.5 text-sm">golden hour from the pier, finally</p>
              <img
                src="/landing/embed_sample_image.jpg"
                width={1920}
                height={1080}
                alt="A pink and orange sunset over the sea with a stone pier"
                loading="lazy"
                decoding="async"
                class="mt-2 aspect-video w-full rounded-[3px] object-cover"
              />
              <p class="mt-2 text-[11px] text-[#b5bac1]">
                shared on twink.forsale · 2.4 MB
              </p>
            </div>
          </article>
        </figure>
      </div>

      <hr class="lp-hr my-6" />

      <div class="grid items-start gap-6 md:grid-cols-[auto_1fr]">
        <figure class="lp-alt lp-frame mx-auto w-[220px] p-3 text-center">
          <figcaption class="sr-only">Example bio page</figcaption>
          <img
            src="/landing/bio_avatar_mika.jpg"
            alt="Illustrated white bunny avatar"
            width={1024}
            height={1024}
            loading="lazy"
            class="lp-frame mx-auto h-20 w-20 object-cover"
          />
          <p class="lp-pixel lp-ink mt-2 text-lg font-bold">mika</p>
          <p class="lp-muted text-xs">twink.forsale/mika</p>
          <ul class="mt-3 space-y-1.5" aria-label="Mika's links">
            {bioLinks.map((link) => (
              <li
                key={link.label}
                class="lp-btn min-h-8 w-full justify-start px-2 text-sm"
              >
                <link.icon class="h-4 w-4 shrink-0" aria-hidden="true" />
                {link.label}
              </li>
            ))}
          </ul>
        </figure>
        <div>
          <h3 class="lp-pixel lp-ink text-lg font-bold">
            a bio page that's all you
          </h3>
          <p class="lp-muted mt-1 text-[15px] leading-6">
            Links, your Discord status, what you're listening to on Spotify and
            your albums, all on one page at{" "}
            <span class="lp-ink font-semibold">twink.forsale/yourname</span>.
            Save drafts and only publish when it's ready. The page on the left
            is an example.
          </p>
          <h3 class="lp-pixel lp-ink mt-5 text-lg font-bold">
            five themes for the dashboard
          </h3>
          <ul class="mt-2 flex flex-wrap gap-2" aria-label="Built-in themes">
            {themeList.map((theme) => (
              <li
                key={theme.value}
                class="lp-frame lp-pixel flex items-center gap-2 py-1 pr-3 pl-1 text-sm"
                style={{
                  background: palettes[theme.value].surface,
                  color: palettes[theme.value].ink,
                }}
              >
                <span
                  aria-hidden="true"
                  class="h-5 w-5"
                  style={{ background: palettes[theme.value].accent }}
                />
                {theme.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Box>
  );
});

const extras = [
  [
    "albums",
    "One link for a whole set of screenshots, and they can show up on your bio page.",
  ],
  [
    "file requests",
    "Friends upload into a collection for you. Nothing goes live until you approve it.",
  ],
  ["passwords", "Lock a file behind a password, or make it members-only."],
  [
    "crop & redact",
    "Trim a screenshot and black out the embarrassing bits before it uploads.",
  ],
  [
    "favorites & tags",
    "Pin the files you reuse and tag the rest so you can find them later.",
  ],
  ["short links", "Shorten any URL, change where it goes later, or pause it."],
  ["view limits", "Let a file disappear after a set number of views."],
  ["expiry", "Gone after a day, a week, or whenever you choose."],
  ["trash", "Deleted files wait 30 days in case you change your mind."],
  [
    "domains",
    "Pick which domain your links use, or claim a subdomain where it's allowed.",
  ],
];

export const Extras = component$(() => (
  <Box id="extras" title="extras">
    <p class="lp-muted text-[15px]">
      Everything here is already in the dashboard. No premium tier.
    </p>
    <div class="mt-4 overflow-x-auto">
      <table class="lp-table w-full border-collapse text-left text-[15px]">
        <thead>
          <tr>
            <th
              scope="col"
              class="lp-pixel lp-ink w-[34%] px-3 py-1.5 font-bold"
            >
              feature
            </th>
            <th scope="col" class="lp-pixel lp-ink px-3 py-1.5 font-bold">
              what it does
            </th>
          </tr>
        </thead>
        <tbody>
          {extras.map(([name, body], index) => (
            <tr key={name} class={cn(index % 2 === 1 && "lp-alt")}>
              <th
                scope="row"
                class="lp-pixel lp-ink px-3 py-2 align-top font-semibold"
              >
                {name}
              </th>
              <td class="lp-muted px-3 py-2 leading-6">{body}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Box>
));

const faqs = [
  {
    q: "why can't I upload yet?",
    a: (
      <>
        It's invite-only. After you sign in with Discord, an admin reviews your
        account, and you can upload as soon as it's approved.
      </>
    ),
  },
  {
    q: "do I need ShareX?",
    a: (
      <>
        Nope. ShareX is a free Windows screenshot tool that makes things faster,
        but you can always upload or paste straight into the browser.
      </>
    ),
  },
  {
    q: "what am I allowed to upload?",
    a: (
      <>
        Anything that follows the{" "}
        <Link href="/acceptable-use" class="lp-link">
          acceptable use policy
        </Link>
        . Give it a read before your first upload.
      </>
    ),
  },
  {
    q: "how do I report something?",
    a: (
      <>
        Send a notice through the{" "}
        <Link href="/dmca" class="lp-link">
          DMCA page
        </Link>{" "}
        and an admin will review it.
      </>
    ),
  },
  {
    q: "what happens to my data?",
    a: (
      <>
        The{" "}
        <Link href="/privacy" class="lp-link">
          privacy policy
        </Link>{" "}
        explains what's stored and why.
      </>
    ),
  },
  {
    q: "can I use my own domain?",
    a: (
      <>
        Uploads can use any domain an admin has added. Ask in the{" "}
        <a
          href={DISCORD_INVITE}
          target="_blank"
          rel="noopener noreferrer"
          class="lp-link"
        >
          Discord
        </a>{" "}
        if you'd like a new one.
      </>
    ),
  },
];

export const Faq = component$(() => (
  <Box id="faq" title="frequently asked questions">
    <dl class="space-y-4">
      {faqs.map((item) => (
        <div key={item.q}>
          <dt class="lp-pixel lp-ink text-[17px] font-bold">
            <span class="lp-new" aria-hidden="true">
              Q:{" "}
            </span>
            {item.q}
          </dt>
          <dd class="lp-muted mt-0.5 text-[15px] leading-6">
            <span class="lp-pixel lp-ink font-bold" aria-hidden="true">
              A:{" "}
            </span>
            {item.a}
          </dd>
        </div>
      ))}
    </dl>
  </Box>
));

export const HangOut = component$(() => {
  const user = useCurrentUser();

  return (
    <Box id="hang-out" title="come hang out">
      <div class="grid items-center gap-5 sm:grid-cols-[1fr_auto]">
        <div>
          <p class="lp-ink text-[15px] leading-7">
            {user.value
              ? "You're signed in. Your dashboard is right where you left it."
              : "Sign in with Discord, say hi in the server, and you'll be uploading once an admin approves you."}
          </p>
          <div class="mt-4 flex flex-wrap gap-3">
            {user.value ? (
              <Link href="/dashboard" class={goButton}>
                open your dashboard
              </Link>
            ) : (
              <LoginButton
                class={goButton}
                iconClass="h-4 w-4"
                label="sign in with Discord"
                returnTo="/dashboard"
              />
            )}
            <a
              href={DISCORD_INVITE}
              target="_blank"
              rel="noopener noreferrer"
              class={plainButton}
            >
              <MessageCircle class="h-4 w-4" aria-hidden="true" />
              join the Discord
            </a>
          </div>
        </div>
        <figure class="lp-frame mx-auto w-[150px] bg-white p-1">
          <img
            src="/landing/cta_community_image.jpg"
            alt="Two hands raising pink and mango bubble teas on a sunny street"
            width={1536}
            height={1920}
            loading="lazy"
            decoding="async"
            class="aspect-[4/5] w-full object-cover"
          />
          <figcaption class="lp-pixel pt-1 text-center text-sm text-[#301030]">
            cheers.jpg
          </figcaption>
        </figure>
      </div>
    </Box>
  );
});

const footerLinks = [
  { label: "terms", href: "/terms" },
  { label: "privacy", href: "/privacy" },
  { label: "acceptable use", href: "/acceptable-use" },
  { label: "dmca", href: "/dmca" },
];

export const LandingFooter = component$(() => (
  <footer class="lp-box mx-auto mt-3 max-w-[1100px] px-4 py-3 text-center text-sm">
    <nav aria-label="Legal">
      <ul class="flex flex-wrap justify-center gap-x-1">
        {footerLinks.map((link, index) => (
          <li key={link.href} class="lp-muted">
            {index > 0 && <span aria-hidden="true">| </span>}
            <Link
              href={link.href}
              class="lp-link lp-pixel inline-flex min-h-9 items-center px-1 text-[15px]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
    <p class="lp-muted mt-1">
      © {new Date().getFullYear()} twink.forsale · best viewed in any browser,
      at any size ·{" "}
      <a href="mailto:contact@bwmp.dev" class="lp-link">
        contact@bwmp.dev
      </a>
    </p>
  </footer>
));
