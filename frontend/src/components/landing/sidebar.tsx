import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { LoginButton } from "~/components/auth/login-button";
import { ThemeToggle } from "~/components/ui";
import { useCurrentUser } from "~/routes/layout";
import { Box } from "./box";

export type PublicStats = {
  totalUploads: number;
  totalViews: number;
  totalUsers: number;
};

const sections = [
  { label: "welcome", href: "#welcome" },
  { label: "how it works", href: "#how-it-works" },
  { label: "make it yours", href: "#make-it-yours" },
  { label: "extras", href: "#extras" },
  { label: "faq", href: "#faq" },
  { label: "come hang out", href: "#hang-out" },
];

const navLink =
  "lp-link lp-focus lp-pixel inline-flex min-h-9 items-center text-[15px] lg:min-h-8";

export const NavigateBox = component$(() => {
  const user = useCurrentUser();

  return (
    <nav aria-labelledby="navigate-title" class="lp-box">
      <h2
        id="navigate-title"
        class="lp-box-title lp-pixel px-3 py-1 text-base font-bold"
      >
        navigate
      </h2>
      <ul class="flex flex-wrap gap-x-4 px-4 py-2 lg:block lg:py-3">
        {sections.map((section) => (
          <li key={section.href}>
            <a href={section.href} class={navLink}>
              {section.label}
            </a>
          </li>
        ))}
        <li>
          {user.value ? (
            <Link href="/dashboard" class={`${navLink} font-bold`}>
              your dashboard
            </Link>
          ) : (
            <LoginButton
              class={`${navLink} cursor-pointer font-bold`}
              iconClass="hidden"
              label="sign in"
              loadingLabel="signing in..."
              returnTo="/dashboard"
            />
          )}
        </li>
      </ul>
    </nav>
  );
});

const updates = [
  "albums: one link for a set of files",
  "file requests from friends",
  "a 30-day trash bin",
  "bio drafts you can publish later",
  "short links you can edit",
];

const badges = [
  { label: "sharex ready", color: "#ff8cc6" },
  { label: "invite only", color: "#b8f0d4" },
  { label: "made with too much pink", color: "#fff07a" },
  { label: "five themes", color: "#c9b8ff" },
];

export const SideBoxes = component$<{ stats: PublicStats }>(({ stats }) => {
  const counts = [
    { label: "files hosted", value: stats.totalUploads },
    { label: "views served", value: stats.totalViews },
    { label: "members", value: stats.totalUsers },
  ];
  const hasStats = counts.some((count) => count.value > 0);

  return (
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
      <Box id="mood" title="mood">
        <div class="flex items-center gap-3">
          <ThemeToggle size="lg" />
          <p class="lp-muted text-sm">day, night, or one of five themes</p>
        </div>
      </Box>

      {hasStats && (
        <Box id="counter" title="hit counter">
          <dl class="space-y-2">
            {counts.map((count) => (
              <div key={count.label}>
                <dt class="lp-muted lp-pixel text-sm">{count.label}</dt>
                <dd class="lp-counter mt-0.5 inline-block px-2 py-0.5 text-lg tracking-[0.2em] tabular-nums">
                  {String(count.value).padStart(6, "0")}
                </dd>
              </div>
            ))}
          </dl>
        </Box>
      )}

      <Box id="updates" title="what's new">
        <ul class="space-y-1.5 text-sm">
          {updates.map((update) => (
            <li key={update} class="lp-ink">
              <span class="lp-new lp-pixel font-bold">new!</span> {update}
            </li>
          ))}
        </ul>
      </Box>

      <Box id="buttons" title="buttons">
        <ul class="flex flex-wrap gap-1.5" aria-label="Site badges">
          {badges.map((badge) => (
            <li
              key={badge.label}
              class="lp-88"
              style={{ background: badge.color }}
            >
              {badge.label}
            </li>
          ))}
        </ul>
      </Box>
    </div>
  );
});
