import { component$ } from "@builder.io/qwik";
import { Form, Link, useLocation } from "@builder.io/qwik-city";
import { useSession, useSignIn, useSignOut } from "~/routes/plugin@auth";
import {
  Home,
  Upload,
  Key,
  Sparkle,
  Settings,
  LogOut,
  User,
} from "lucide-icons-qwik";
import { Nav } from "@luminescent/ui-qwik";
import { ThemeToggle } from "~/components/theme-toggle/theme-toggle";

export default component$(() => {
  const session = useSession();
  const signIn = useSignIn();
  const signOut = useSignOut();
  const location = useLocation();
  const isCurrentPage = (path: string) => {
    return (
      location.url.pathname === path ||
      location.url.pathname.startsWith(path + "/")
    );
  };
  const isDashboardExact = () => {
    const pathname = location.url.pathname;
    return pathname === "/dashboard" || pathname === "/dashboard/";
  };
  const getNavLinkClasses = (isActive: boolean, isMobile = false) => {
    const baseClasses = `font-medium transition-all duration-300 flex items-center gap-${isMobile ? "3" : "2"} whitespace-nowrap`;
    const sizeClasses = isMobile
      ? "px-4 py-3 rounded-xl"
      : "px-4 py-2 rounded-full";
    const activeClasses = isActive
      ? "btn-cute text-white shadow-lg"
      : "text-theme-secondary hover:text-theme-primary hover:bg-theme-tertiary/20";

    return `${baseClasses} ${sizeClasses} ${activeClasses}`;
  };
  const buttonClasses =
    "w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-3";
  return (
    <Nav
      fixed
      colorClass="bg-theme-secondary/60 backdrop-blur-md !border-b border-theme-accent/30"
    >
      {/* Logo/Brand */}
      <Link
        href="/"
        q:slot="start"
        class="text-gradient-cute flex items-center gap-2 text-xl font-bold transition-transform duration-300 hover:scale-105 sm:text-2xl"
      >
        <div class="heart-gradient sm"></div>
        <span>twink.forsale</span>
      </Link>
      {/* Desktop Center Navigation */}
      {session.value && (
        <div q:slot="center" class="hidden items-center space-x-3 lg:flex">
          <Link href="/dashboard" class={getNavLinkClasses(isDashboardExact())}>
            <Home class="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/dashboard/uploads"
            class={getNavLinkClasses(isCurrentPage("/dashboard/uploads"))}
          >
            <Upload class="h-4 w-4" />
            Uploads
          </Link>
          <Link
            href="/dashboard/api-keys"
            class={getNavLinkClasses(isCurrentPage("/dashboard/api-keys"))}
          >
            <Key class="h-4 w-4" />
            API Keys
          </Link>{" "}
          <Link
            href="/dashboard/embed"
            class={getNavLinkClasses(isCurrentPage("/dashboard/embed"))}
          >
            <Sparkle class="h-4 w-4" />
            Embed
          </Link>
          <Link
            href="/dashboard/themes"
            class={getNavLinkClasses(isCurrentPage("/dashboard/themes"))}
          >
            <Settings class="h-4 w-4" />
            Themes
          </Link>
          <ThemeToggle variant="compact" class="mr-4" />
        </div>
      )}
      {/* Desktop End Navigation */}
      <div q:slot="end" class="hidden items-center space-x-3 lg:flex">
        {session.value ? (
          <>
            <Link
              href="/setup/sharex"
              class="btn-cute flex items-center gap-2 rounded-full px-5 py-2 font-medium !whitespace-nowrap text-white"
            >
              <Settings class="h-4 w-4" />
              ShareX Setup
            </Link>
            <Form action={signOut}>
              <input type="hidden" name="providerId" value="discord" />
              <input type="hidden" name="options.redirectTo" />
              <button class="text-theme-secondary hover:text-theme-primary hover:bg-theme-tertiary/20 flex items-center gap-2 rounded-full px-4 py-2 !whitespace-nowrap transition-all duration-300">
                <LogOut class="h-4 w-4" />
                Sign Out
              </button>
            </Form>
          </>
        ) : (
          <Form action={signIn}>
            <input type="hidden" name="providerId" value="discord" />
            <input type="hidden" name="options.redirectTo" />
            <button class="btn-cute flex items-center gap-2 rounded-full px-6 py-2 font-medium text-white">
              <User class="h-4 w-4" />
              Sign In
            </button>
          </Form>
        )}
      </div>
      {/* Mobile Navigation Items */}
      {session.value ? (
        <>
          <Link
            href="/dashboard"
            q:slot="mobile"
            class={getNavLinkClasses(isDashboardExact(), true)}
          >
            <Home class="h-5 w-5" />
            Dashboard
          </Link>
          <Link
            href="/dashboard/uploads"
            q:slot="mobile"
            class={getNavLinkClasses(isCurrentPage("/dashboard/uploads"), true)}
          >
            <Upload class="h-5 w-5" />
            Uploads
          </Link>
          <Link
            href="/dashboard/api-keys"
            q:slot="mobile"
            class={getNavLinkClasses(
              isCurrentPage("/dashboard/api-keys"),
              true,
            )}
          >
            <Key class="h-5 w-5" />
            API Keys
          </Link>{" "}
          <Link
            href="/dashboard/embed"
            q:slot="mobile"
            class={getNavLinkClasses(isCurrentPage("/dashboard/embed"), true)}
          >
            <Sparkle class="h-5 w-5" />
            Embed
          </Link>
          <Link
            href="/dashboard/themes"
            q:slot="mobile"
            class={getNavLinkClasses(isCurrentPage("/dashboard/themes"), true)}
          >
            <Settings class="h-5 w-5" />
            Themes
          </Link>
          <Link
            href="/setup/sharex"
            q:slot="mobile"
            class="btn-cute flex items-center gap-3 rounded-xl px-4 py-3 font-medium !whitespace-nowrap text-white transition-all duration-300"
          >
            <Settings class="h-5 w-5" />
            ShareX Setup
          </Link>
          <div q:slot="mobile" class="px-4 py-3">
            <ThemeToggle variant="dropdown" showLabel={true} />
          </div>
          <Form action={signOut} q:slot="mobile">
            <input type="hidden" name="providerId" value="discord" />
            <input type="hidden" name="options.redirectTo" />
            <button
              class={`${buttonClasses} text-theme-secondary hover:text-theme-primary hover:bg-theme-tertiary/20 !whitespace-nowrap`}
            >
              <LogOut class="h-5 w-5" />
              Sign Out
            </button>
          </Form>
        </>
      ) : (
        <>
          <div q:slot="mobile" class="px-4 py-3">
            <ThemeToggle variant="dropdown" showLabel={true} />
          </div>
          <Form action={signIn} q:slot="mobile">
            <input type="hidden" name="providerId" value="discord" />
            <input type="hidden" name="options.redirectTo" />
            <button class={`${buttonClasses} btn-cute text-white`}>
              <User class="h-5 w-5" />
              Sign In
            </button>
          </Form>
        </>
      )}
    </Nav>
  );
});
