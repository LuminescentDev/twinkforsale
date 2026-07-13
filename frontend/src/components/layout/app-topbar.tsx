import { component$, $, type QRL } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import {
  Menu,
  Upload,
  Wrench,
  LogOut,
  Settings,
  User as UserIcon,
  Shield,
} from "lucide-icons-qwik";
import type { MeResponse } from "~/lib/api-client";
import { logout } from "~/lib/auth-client";
import { resolveBreadcrumbs } from "~/lib/dashboard-nav";
import {
  Breadcrumbs,
  IconButton,
  DropdownMenu,
  MenuItem,
  ThemeToggle,
  Button,
} from "~/components/ui";

export interface AppTopbarProps {
  user: MeResponse | null;
  onMenu$: QRL<() => void>;
}

/** Small avatar: Discord image when present, else a gradient initial. */
const Avatar = component$<{ user: MeResponse }>(({ user }) => {
  if (user.image) {
    return (
      <img
        src={user.image}
        alt=""
        width="32"
        height="32"
        class="h-8 w-8 rounded-full object-cover"
      />
    );
  }
  const initial = (user.name || user.email || "?").charAt(0).toUpperCase();
  return (
    <span class="from-theme-accent-primary to-theme-accent-secondary flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white">
      {initial}
    </span>
  );
});

/**
 * Sticky app top bar: mobile menu trigger + breadcrumb trail on the left, and
 * a global action cluster (quick Upload, theme switcher, account menu) on the
 * right. Page-specific actions live in each page's own header, keeping this bar
 * consistent across every route.
 */
export const AppTopbar = component$<AppTopbarProps>(({ user, onMenu$ }) => {
  const location = useLocation();
  const crumbs = resolveBreadcrumbs(location.url.pathname);
  const signOut = $(() => logout());

  return (
    <header class="border-theme-card-border bg-theme-bg-primary/70 sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 backdrop-blur-xl sm:px-6">
      <IconButton class="lg:hidden" onClick$={onMenu$} title="Open menu">
        <Menu class="h-5 w-5" />
      </IconButton>

      <Breadcrumbs crumbs={crumbs} class="min-w-0 flex-1" />

      <div class="flex items-center gap-2">
        <Button href="/upload" size="sm" class="hidden sm:inline-flex">
          <Upload class="h-4 w-4" />
          Upload
        </Button>
        <ThemeToggle variant="dropdown" />
        {user && (
          <DropdownMenu>
            <div
              q:slot="trigger"
              class="hover:bg-theme-bg-tertiary/30 flex items-center gap-2 rounded-full p-1 transition-colors sm:pr-2"
            >
              <Avatar user={user} />
              <span class="text-theme-text-secondary hidden max-w-[8rem] truncate text-sm font-medium sm:block">
                {user.name || "Account"}
              </span>
            </div>

            <div class="border-theme-card-border mb-1 border-b px-3 py-2">
              <div class="text-theme-text-primary truncate text-sm font-semibold">
                {user.name || "Account"}
              </div>
              <div class="text-theme-text-muted truncate text-xs">
                {user.email}
              </div>
            </div>
            <MenuItem href="/dashboard/settings" icon={Settings}>
              Settings
            </MenuItem>
            <MenuItem href="/setup/sharex" icon={Wrench}>
              ShareX Setup
            </MenuItem>
            {user.bioUsername && (
              <MenuItem href={`/${user.bioUsername}`} icon={UserIcon}>
                My Bio Page
              </MenuItem>
            )}
            {user.isAdmin && (
              <MenuItem href="/dashboard/admin" icon={Shield}>
                Admin
              </MenuItem>
            )}
            <div class="border-theme-card-border my-1 border-t" />
            <MenuItem onClick$={signOut} icon={LogOut} tone="danger">
              Sign Out
            </MenuItem>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
});
