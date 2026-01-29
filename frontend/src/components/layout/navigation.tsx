import { component$, useComputed$ } from "@builder.io/qwik";
import { Form, Link, useLocation } from "@builder.io/qwik-city";
import { useSession, useSignOut } from "~/routes/plugin@auth";
import {
  Home,
  Upload,
  Key,
  Sparkle,
  Settings,
  LogOut,
  User,
  Link as LinkIcon,
  Plus,
} from "lucide-icons-qwik";
import { Nav } from "@luminescent/ui-qwik";
import { ThemeToggle } from "~/components/ui/theme-toggle";

export default component$(() => {
  const user = useSession();
  const signOutAction = useSignOut();
  const location = useLocation();
  
  // Get API URL from environment - client side only for OAuth redirect
  const getAuthUrl = () => {
    if (typeof window !== 'undefined') {
      // Client-side: use VITE_API_URL from build-time env
      const apiUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000';
      return apiUrl.replace(/\/+$/, '').replace(/\/api$/, '') + '/auth/discord';
    }
    // Server-side: return relative URL (will work since it's a link)
    return '#';
  };
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
      : "text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary/20";

    return `${baseClasses} ${sizeClasses} ${activeClasses}`;
  };
  const buttonClasses =
    "w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-3";
  return (
    <Nav
      fixed
      colorClass="bg-theme-secondary/60 backdrop-blur-md !border-b border-theme-card-border"
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
      {/* Desktop Center Navigation */}      {user.value && (
        <div q:slot="center" class="hidden items-center space-x-3 lg:flex">          <Link href="/dashboard" class={getNavLinkClasses(isDashboardExact())}>
            <Home class="h-4 w-4" />
            Dashboard
          </Link>          <Link
            href="/dashboard/uploads"
            class={getNavLinkClasses(isCurrentPage("/dashboard/uploads"))}
          >
            <Upload class="h-4 w-4" />
            Files
          </Link>
          <Link
            href="/upload"
            class={getNavLinkClasses(isCurrentPage("/upload"))}
          >
            <Plus class="h-4 w-4" />
            Upload
          </Link>
          <Link
            href="/dashboard/api-keys"
            class={getNavLinkClasses(isCurrentPage("/dashboard/api-keys"))}
          >
            <Key class="h-4 w-4" />
            API Keys
          </Link>{" "}          <Link
            href="/dashboard/embed"
            class={getNavLinkClasses(isCurrentPage("/dashboard/embed"))}
          >
            <Sparkle class="h-4 w-4" />
            Embed
          </Link>          <Link
            href="/dashboard/bio"
            class={getNavLinkClasses(isCurrentPage("/dashboard/bio"))}
          >
            <LinkIcon class="h-4 w-4" />
            Bio
          </Link>
          <Link
            href="/dashboard/settings"
            class={getNavLinkClasses(isCurrentPage("/dashboard/settings"))}
          >
            <Settings class="h-4 w-4" />
            Settings
          </Link>
          <ThemeToggle variant="compact" class="mr-4" />
        </div>
      )}
      {/* Desktop End Navigation */}
      <div q:slot="end" class="hidden items-center space-x-3 lg:flex">
        {user.value ? (
          <>
            <Link
              href="/setup/sharex"
              class="btn-cute flex items-center gap-2 rounded-full px-5 py-2 font-medium !whitespace-nowrap text-white"
            >
              <Settings class="h-4 w-4" />
              ShareX Setup
            </Link>
            <Form action={signOutAction}>
              <input type="hidden" name="providerId" value="discord" />
              <input type="hidden" name="options.redirectTo" />
              <button class="text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary/20 flex items-center gap-2 rounded-full px-4 py-2 !whitespace-nowrap transition-all duration-300">
                <LogOut class="h-4 w-4" />
                Sign Out
              </button>
            </Form>
          </>
        ) : (
          <a
            href={getAuthUrl()}
            class="btn-cute flex items-center gap-2 rounded-full px-6 py-2 font-medium text-white"
          >
            <User class="h-4 w-4" />
            Sign In
          </a>
        )}
      </div>
      {/* Mobile Navigation Items */}
      {user.value ? (
        <>
          <Link
            href="/dashboard"
            q:slot="mobile"
            class={getNavLinkClasses(isDashboardExact(), true)}
          >
            <Home class="h-5 w-5" />
            Dashboard
          </Link>          <Link
            href="/dashboard/uploads"
            q:slot="mobile"
            class={getNavLinkClasses(isCurrentPage("/dashboard/uploads"), true)}
          >
            <Upload class="h-5 w-5" />
            Files
          </Link>
          <Link
            href="/upload"
            q:slot="mobile"
            class={getNavLinkClasses(isCurrentPage("/upload"), true)}
          >
            <Plus class="h-5 w-5" />
            Upload
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
          </Link>{" "}          <Link
            href="/dashboard/embed"
            q:slot="mobile"
            class={getNavLinkClasses(isCurrentPage("/dashboard/embed"), true)}
          >
            <Sparkle class="h-5 w-5" />
            Embed
          </Link>          <Link
            href="/dashboard/bio"
            q:slot="mobile"
            class={getNavLinkClasses(isCurrentPage("/dashboard/bio"), true)}
          >
            <LinkIcon class="h-5 w-5" />
            Bio
          </Link>
          <Link
            href="/dashboard/settings"
            q:slot="mobile"
            class={getNavLinkClasses(isCurrentPage("/dashboard/settings"), true)}
          >
            <Settings class="h-5 w-5" />
            Settings
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
          <Form action={signOutAction} q:slot="mobile">
            <input type="hidden" name="providerId" value="discord" />
            <input type="hidden" name="options.redirectTo" />
            <button
              class={`${buttonClasses} text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary/20 !whitespace-nowrap`}
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
          <a
            href={getAuthUrl()}
            q:slot="mobile"
            class={`${buttonClasses} btn-cute text-white`}
          >
            <User class="h-5 w-5" />
            Sign In
          </a>
        </>
      )}
    </Nav>
  );
});
