import { component$, $ } from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";
import { useCurrentUser } from "~/routes/layout";
import { logout } from "~/lib/auth-client";
import { Home, Folder, Upload, Wrench, LogOut } from "lucide-icons-qwik";
import { Nav } from "@luminescent/ui-qwik";
import { ThemeToggle } from "~/components/ui/theme-toggle";
import { LoginButton } from "~/components/auth/login-button";
import { adminNav, dashboardNav, isNavItemActive } from "~/lib/dashboard-nav";

// Primary links shown inline on desktop. Everything else moved into the
// dashboard sidebar (desktop) and the grouped mobile menu, so the top bar
// stays uncluttered instead of jamming in every destination.
const primaryLinks = [
  { href: "/dashboard", label: "Dashboard", icon: Home, exact: true },
  { href: "/dashboard/uploads", label: "Files", icon: Folder },
  { href: "/upload", label: "Upload", icon: Upload },
];

export default component$(() => {
  const user = useCurrentUser();
  const signOut = $(() => logout());
  const location = useLocation();
  const pathname = location.url.pathname;

  // Calmer active state: accent text + a subtle tinted pill instead of a full
  // gradient button that "pops" out of the bar.
  const desktopLink = (active: boolean) =>
    `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
      active
        ? "text-theme-accent-primary bg-theme-accent-primary/10"
        : "text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary/20"
    }`;

  const mobileLink = (active: boolean) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
      active
        ? "text-theme-accent-primary bg-theme-accent-primary/10"
        : "text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary/20"
    }`;

  return (
    <Nav
      fixed
      colorClass="bg-theme-bg-primary/80 backdrop-blur-md !border-b border-theme-card-border"
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

      {/* Desktop primary links */}
      {user.value && (
        <div q:slot="center" class="hidden items-center gap-2 lg:flex">
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              class={desktopLink(
                link.exact
                  ? pathname === link.href || pathname === link.href + "/"
                  : pathname.startsWith(link.href),
              )}
            >
              <link.icon class="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </div>
      )}

      {/* Desktop right side */}
      <div q:slot="end" class="hidden items-center gap-3 lg:flex">
        {user.value ? (
          <>
            <ThemeToggle variant="compact" />
            <Link
              href="/setup/sharex"
              class="btn-cute flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium !whitespace-nowrap text-white"
            >
              <Wrench class="h-4 w-4" />
              ShareX Setup
            </Link>
            <button
              onClick$={signOut}
              class="text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary/20 flex items-center gap-2 rounded-full px-4 py-2 text-sm !whitespace-nowrap transition-all duration-300"
            >
              <LogOut class="h-4 w-4" />
              Sign Out
            </button>
          </>
        ) : (
          <>
            <ThemeToggle variant="compact" />
            <LoginButton class="btn-cute flex items-center gap-2 rounded-full px-6 py-2 text-sm font-medium text-white" />
          </>
        )}
      </div>

      {/* Mobile menu — full grouped navigation (sidebar is desktop-only) */}
      {user.value ? (
        <>
          {dashboardNav.map((group) => (
            <div key={group.title} q:slot="mobile" class="px-2 pt-2">
              <div class="text-theme-text-muted mb-1 px-2 text-xs font-semibold tracking-wider uppercase">
                {group.title}
              </div>
              <div class="space-y-1">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    class={mobileLink(isNavItemActive(pathname, item))}
                  >
                    <item.icon class="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {user.value.isAdmin && (
            <div q:slot="mobile" class="px-2 pt-2">
              <div class="text-theme-text-muted mb-1 px-2 text-xs font-semibold tracking-wider uppercase">
                Admin
              </div>
              <div class="space-y-1">
                {adminNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    class={mobileLink(isNavItemActive(pathname, item))}
                  >
                    <item.icon class="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div q:slot="mobile" class="mt-2 border-t border-theme-card-border px-4 py-3">
            <ThemeToggle variant="dropdown" showLabel={true} />
          </div>
          <button
            onClick$={signOut}
            q:slot="mobile"
            class={`mx-2 ${mobileLink(false)}`}
          >
            <LogOut class="h-5 w-5" />
            Sign Out
          </button>
        </>
      ) : (
        <>
          <div q:slot="mobile" class="px-4 py-3">
            <ThemeToggle variant="dropdown" showLabel={true} />
          </div>
          <LoginButton
            q:slot="mobile"
            class={`mx-2 ${mobileLink(false)} btn-cute text-white`}
            iconClass="h-5 w-5"
          />
        </>
      )}
    </Nav>
  );
});
