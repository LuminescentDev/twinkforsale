import { $, component$ } from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";
import { Folder, Heart, LogOut, Upload } from "lucide-icons-qwik";
import { LoginButton } from "~/components/auth/login-button";
import { Button, ThemeToggle } from "~/components/ui";
import { logout } from "~/lib/auth-client";
import { useCurrentUser } from "~/routes/layout";

export default component$(() => {
  const user = useCurrentUser();
  const location = useLocation();
  const signOut = $(() => logout());

  const linkClass = (active: boolean) =>
    `focus-ring rounded-control hidden h-8 items-center gap-2 px-2.5 text-[13px] font-medium transition-colors duration-150 sm:inline-flex ${
      active
        ? "bg-accent-soft text-accent-text"
        : "text-ink-muted hover:bg-surface-hover hover:text-ink"
    }`;

  return (
    <header class="bg-nav border-edge relative z-30 border-b">
      <div class="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          class="focus-ring rounded-control text-ink mr-auto inline-flex items-center gap-2 text-base font-semibold tracking-[-0.01em] sm:text-lg"
        >
          <Heart
            class="text-accent-text h-5 w-5 fill-current"
            aria-hidden="true"
          />
          twink.forsale
        </Link>

        {user.value ? (
          <>
            <nav aria-label="Public navigation" class="flex items-center gap-1">
              <Link
                href="/dashboard"
                class={linkClass(location.url.pathname === "/dashboard")}
              >
                <Folder class="h-4 w-4" aria-hidden="true" />
                Files
              </Link>
              <Link href="/upload" class={linkClass(false)}>
                <Upload class="h-4 w-4" aria-hidden="true" />
                Upload
              </Link>
            </nav>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick$={signOut}
              aria-label="Sign out"
              title="Sign out"
              class="px-2"
            >
              <LogOut class="h-4 w-4" aria-hidden="true" />
              <span class="hidden lg:inline">Sign out</span>
            </Button>
          </>
        ) : (
          <>
            <ThemeToggle />
            <LoginButton
              class="focus-ring bg-accent text-on-accent hover:bg-accent-hover rounded-control inline-flex h-8 items-center justify-center gap-2 border border-transparent px-2.5 text-[13px] font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55"
              label="Sign in"
            />
          </>
        )}
      </div>
    </header>
  );
});
