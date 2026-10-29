import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { ArrowRight, Menu, X } from "lucide-icons-qwik";
import { LoginButton } from "~/components/auth/login-button";
import { ThemeToggle } from "~/components/ui";
import { cn } from "~/lib/utils";
import { useCurrentUser } from "~/routes/layout";

const links = [
  { label: "How it works", href: "#how-it-works", medium: true },
  { label: "Features", href: "#upload-sharing", medium: true },
  { label: "Bio pages", href: "#bio-pages", medium: false },
  { label: "Themes", href: "#themes", medium: false },
  { label: "FAQ", href: "#faq", medium: true },
];

export const primaryButton =
  "lp-press focus-ring bg-accent text-on-accent hover:bg-accent-hover rounded-control inline-flex min-h-11 items-center justify-center gap-2 border border-transparent px-5 text-[15px] font-medium transition-colors duration-150";

export const LandingNav = component$(() => {
  const user = useCurrentUser();
  const scrolled = useSignal(false);
  const menuOpen = useSignal(false);
  const active = useSignal("");
  const toggleRef = useSignal<HTMLButtonElement>();
  const panelRef = useSignal<HTMLDivElement>();

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    const onScroll = () => {
      scrolled.value = window.scrollY > 64;
      // Back in the hero: no section link is current.
      if (window.scrollY < window.innerHeight * 0.5) active.value = "";
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const sections = links
      .map((link) => document.querySelector<HTMLElement>(link.href))
      .filter((el): el is HTMLElement => !!el);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && window.scrollY >= window.innerHeight * 0.5) {
            active.value = `#${entry.target.id}`;
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    sections.forEach((section) => observer.observe(section));

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menuOpen.value) {
        menuOpen.value = false;
        toggleRef.value?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        menuOpen.value &&
        !panelRef.value?.contains(target) &&
        !toggleRef.value?.contains(target)
      ) {
        menuOpen.value = false;
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);

    cleanup(() => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    });
  });

  // Move focus into the menu once it has rendered open.
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    if (track(() => menuOpen.value)) {
      panelRef.value?.querySelector<HTMLElement>("a,button")?.focus();
    }
  });

  const toggleMenu = $(() => {
    menuOpen.value = !menuOpen.value;
  });

  const closeMenu = $(() => {
    menuOpen.value = false;
  });

  const solid = scrolled.value || menuOpen.value;

  return (
    <header
      class={cn(
        "fixed inset-x-0 top-0 z-40 border-b transition-colors duration-150",
        solid
          ? "border-edge bg-[color-mix(in_srgb,var(--ui-canvas)_92%,transparent)]"
          : "border-transparent bg-transparent",
      )}
    >
      <div class="mx-auto flex h-[72px] max-w-[1400px] items-center gap-4 px-4 sm:px-6 lg:px-10">
        <Link
          href="/"
          class="focus-ring rounded-control font-display text-ink inline-flex min-h-11 items-center text-xl font-bold tracking-[-0.02em] sm:text-[22px]"
        >
          twink.forsale
        </Link>

        <nav
          aria-label="Landing page sections"
          class="hidden flex-1 items-center justify-center gap-1 md:flex lg:gap-4"
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={active.value === link.href ? "true" : undefined}
              class={cn(
                "focus-ring rounded-control relative inline-flex min-h-11 min-w-11 items-center justify-center px-3 text-[15px] font-medium transition-colors duration-150",
                !link.medium && "md:hidden lg:inline-flex",
                active.value === link.href
                  ? "text-ink after:bg-accent-text after:absolute after:inset-x-3 after:bottom-2 after:h-0.5"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div class="ml-auto flex items-center gap-2 md:ml-0">
          <ThemeToggle size="lg" />
          <div class="hidden sm:block">
            {user.value ? (
              <Link href="/dashboard" class={primaryButton}>
                Open dashboard
                <ArrowRight class="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <LoginButton
                class={primaryButton}
                label="Sign in with Discord"
                returnTo="/dashboard"
              />
            )}
          </div>
          <button
            ref={toggleRef}
            type="button"
            class="focus-ring rounded-control text-ink hover:bg-surface-hover inline-flex h-11 w-11 items-center justify-center transition-colors duration-150 md:hidden"
            aria-label={menuOpen.value ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen.value}
            aria-controls="landing-menu"
            onClick$={toggleMenu}
          >
            {menuOpen.value ? (
              <X class="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu class="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <div
        id="landing-menu"
        ref={panelRef}
        hidden={!menuOpen.value}
        class="bg-surface border-edge border-t px-4 pt-2 pb-5 md:hidden"
      >
        <ul>
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick$={closeMenu}
                class="focus-ring rounded-control text-ink hover:bg-surface-hover flex min-h-12 items-center px-2 text-base font-medium"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <div class="mt-3">
          {user.value ? (
            <Link href="/dashboard" class={cn(primaryButton, "w-full")}>
              Open dashboard
              <ArrowRight class="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : (
            <LoginButton
              class={cn(primaryButton, "w-full")}
              label="Sign in with Discord"
              returnTo="/dashboard"
            />
          )}
        </div>
      </div>
    </header>
  );
});
