import { $, component$ } from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";
import { Folder, LogOut, Upload } from "lucide-icons-qwik";
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
        ? "bg-accent-soft text-accent-text font-semibold"
        : "text-ink-muted hover:bg-surface-hover hover:text-ink"
    }`;

  return (
    <header class="bg-nav border-accent-text relative z-30 border-b-[3px] border-double">
      <div class="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          class="focus-ring retro-banner mr-auto text-xl font-bold sm:text-2xl"
        >
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
              class="focus-ring retro-bevel border-accent bg-accent text-on-accent hover:bg-accent-hover inline-flex h-8 items-center justify-center gap-2 px-2.5 text-[13px] font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55"
              label="Sign in"
            />
          </>
        )}
      </div>
    </header>
  );
});
