import { component$, Slot, useSignal, $ } from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";
import {
  PanelLeft,
  PanelLeftClose,
  Ellipsis,
  LogOut,
  ExternalLink,
  ChevronRight,
  Heart,
} from "lucide-icons-qwik";
import { useCurrentUser, useSidebarState } from "~/routes/layout";
import type { MeResponse } from "~/lib/api-client";
import { logout } from "~/lib/auth-client";
import {
  primaryNav,
  secondaryNav,
  adminEntry,
  uploadAction,
  isNavItemActive,
  isAdminSection,
  resolveBreadcrumbs,
} from "~/lib/dashboard-nav";
import { setSidebarCollapsed } from "~/lib/cookie-utils";
import { cn } from "~/lib/utils";
import {
  Sheet,
  ThemeToggle,
  DropdownMenu,
  MenuItem,
  MenuSeparator,
  IconButton,
} from "~/components/ui";

const Wordmark = component$<{ collapsed?: boolean }>(({ collapsed }) => (
  <Link
    href="/dashboard"
    aria-label={collapsed ? "twink.forsale" : undefined}
    class="focus-ring rounded-control flex items-center"
  >
    {collapsed ? (
      <Heart
        class="text-accent-text h-5 w-5 shrink-0 fill-current"
        aria-hidden="true"
      />
    ) : (
      <span class="retro-banner truncate text-xl font-bold">twink.forsale</span>
    )}
  </Link>
));

const Avatar = component$<{ user: MeResponse; size?: "sm" | "md" }>(
  ({ user, size = "sm" }) => {
    const dim = size === "sm" ? "h-6 w-6 text-[11px]" : "h-8 w-8 text-xs";
    if (user.image) {
      return (
        <img
          src={user.image}
          alt=""
          width={size === "sm" ? 24 : 32}
          height={size === "sm" ? 24 : 32}
          class={cn("shrink-0 rounded-full object-cover", dim)}
        />
      );
    }
    return (
      <span
        aria-hidden="true"
        class={cn(
          "bg-accent text-on-accent flex shrink-0 items-center justify-center rounded-full font-semibold",
          dim,
        )}
      >
        {(user.name || user.email || "?").charAt(0).toUpperCase()}
      </span>
    );
  },
);

const railLink = (active: boolean, collapsed?: boolean) =>
  cn(
    "focus-ring rounded-control relative flex items-center text-[13px] transition-colors duration-150",
    collapsed ? "h-9 w-9 justify-center" : "h-8 gap-2.5 px-2.5",
    active
      ? "bg-accent-soft text-accent-text font-semibold"
      : "text-ink-muted hover:bg-surface-hover hover:text-ink",
  );

/** Accent detail marking the selected destination, alongside fill and weight. */
const ActiveMark = component$(() => (
  <span
    aria-hidden="true"
    class="bg-accent absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-full"
  />
));

/**
 * The signed-in application frame.
 *
 * At `lg` and above: a 240px left rail (collapsible to 64px) carrying the
 * wordmark, the Upload action, primary and secondary destinations, and the
 * theme/account controls in its footer.
 *
 * Below `lg`: a fixed bottom bar with Files, Upload, Analytics and More, where
 * More opens a sheet holding everything else.
 */
export const AppShell = component$(() => {
  const user = useCurrentUser();
  const sidebarState = useSidebarState();
  const location = useLocation();
  const collapsed = useSignal(sidebarState.value.collapsed);
  const moreOpen = useSignal(false);

  const pathname = location.url.pathname;
  const isAdmin = !!user.value?.isAdmin;
  const crumbs = resolveBreadcrumbs(pathname);

  const toggleCollapse = $(() => {
    collapsed.value = !collapsed.value;
    setSidebarCollapsed(collapsed.value);
  });
  const signOut = $(() => logout());
  const closeMore = $(() => (moreOpen.value = false));

  const analyticsItem = primaryNav.find(
    (i) => i.href === "/dashboard/analytics",
  )!;
  const filesItem = primaryNav[0];
  const sheetItems = [
    ...primaryNav.filter(
      (i) => i.href !== filesItem.href && i.href !== analyticsItem.href,
    ),
    ...secondaryNav,
    ...(isAdmin ? [adminEntry] : []),
  ];

  return (
    <div class="flex min-h-screen">
      {/* ---------------------------------------------------------------- */}
      {/* Desktop rail                                                      */}
      {/* ---------------------------------------------------------------- */}
      <aside
        class={cn(
          "border-accent-text bg-nav sticky top-0 hidden h-screen shrink-0 flex-col border-r-[3px] border-double transition-[width] duration-150 lg:flex",
          collapsed.value ? "w-16" : "w-60",
        )}
      >
        <div
          class={cn(
            "flex h-14 shrink-0 items-center",
            collapsed.value ? "justify-center px-0" : "px-4",
          )}
        >
          <Wordmark collapsed={collapsed.value} />
        </div>

        <div class={cn("shrink-0 pb-3", collapsed.value ? "px-3" : "px-3")}>
          <Link
            href={uploadAction.href}
            aria-label={collapsed.value ? "Upload" : undefined}
            title={collapsed.value ? "Upload" : undefined}
            class={cn(
              "focus-ring rounded-control retro-bevel border-accent bg-accent text-on-accent hover:bg-accent-hover flex items-center justify-center gap-2 text-[13px] font-semibold transition-colors duration-150",
              collapsed.value ? "h-9 w-10" : "h-9 w-full",
            )}
          >
            <uploadAction.icon class="h-4 w-4 shrink-0" aria-hidden="true" />
            {!collapsed.value && "Upload"}
          </Link>
        </div>

        <nav
          aria-label="Main"
          class={cn(
            "flex-1 overflow-y-auto pb-3",
            collapsed.value ? "px-3" : "px-3",
          )}
        >
          <ul class="space-y-0.5">
            {primaryNav.map((item) => {
              const active = isNavItemActive(pathname, item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    aria-label={collapsed.value ? item.label : undefined}
                    title={collapsed.value ? item.label : undefined}
                    class={railLink(active, collapsed.value)}
                  >
                    {active && !collapsed.value && <ActiveMark />}
                    <item.icon class="h-4 w-4 shrink-0" aria-hidden="true" />
                    {!collapsed.value && (
                      <span class="truncate">{item.label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <hr class="retro-rule my-3" />

          <ul class="space-y-0.5">
            {secondaryNav.map((item) => {
              const active = isNavItemActive(pathname, item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    aria-label={collapsed.value ? item.label : undefined}
                    title={collapsed.value ? item.label : undefined}
                    class={railLink(active, collapsed.value)}
                  >
                    {active && !collapsed.value && <ActiveMark />}
                    <item.icon class="h-4 w-4 shrink-0" aria-hidden="true" />
                    {!collapsed.value && (
                      <span class="truncate">{item.label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
            {isAdmin && (
              <li>
                <Link
                  href={adminEntry.href}
                  aria-current={isAdminSection(pathname) ? "page" : undefined}
                  aria-label={collapsed.value ? adminEntry.label : undefined}
                  title={collapsed.value ? adminEntry.label : undefined}
                  class={railLink(isAdminSection(pathname), collapsed.value)}
                >
                  {isAdminSection(pathname) && !collapsed.value && (
                    <ActiveMark />
                  )}
                  <adminEntry.icon
                    class="h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  {!collapsed.value && (
                    <span class="truncate">{adminEntry.label}</span>
                  )}
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <div
          class={cn(
            "border-accent-text/55 flex shrink-0 items-center gap-1 border-t-2 border-dotted p-2",
            collapsed.value && "flex-col",
          )}
        >
          {user.value && (
            <DropdownMenu
              align="left"
              class={collapsed.value ? "" : "min-w-0 flex-1"}
              menuClass="w-56 bottom-full mb-1 mt-0"
              triggerLabel={collapsed.value ? "Account" : undefined}
              triggerClass={cn(
                "hover:bg-surface-hover border border-transparent px-1.5 py-1 gap-2",
                collapsed.value ? "justify-center" : "w-full",
              )}
            >
              <span
                q:slot="trigger"
                class="flex min-w-0 flex-1 items-center gap-2"
              >
                <Avatar user={user.value} />
                {!collapsed.value && (
                  <span class="text-ink min-w-0 flex-1 truncate text-left text-[13px]">
                    {user.value.name || "Account"}
                  </span>
                )}
              </span>
              <div class="border-edge mb-1 border-b px-2.5 pb-2">
                <p class="text-ink truncate text-[13px] font-medium">
                  {user.value.name || "Account"}
                </p>
                <p class="text-ink-muted truncate text-xs">
                  {user.value.email}
                </p>
              </div>
              {user.value.bioUsername && (
                <MenuItem
                  href={`/${user.value.bioUsername}`}
                  icon={ExternalLink}
                >
                  View public bio
                </MenuItem>
              )}
              <MenuSeparator />
              <MenuItem onClick$={signOut} icon={LogOut} tone="danger">
                Sign out
              </MenuItem>
            </DropdownMenu>
          )}
          <ThemeToggle />
          <IconButton
            size="sm"
            label={collapsed.value ? "Expand sidebar" : "Collapse sidebar"}
            onClick$={toggleCollapse}
          >
            {collapsed.value ? (
              <PanelLeft class="h-4 w-4" />
            ) : (
              <PanelLeftClose class="h-4 w-4" />
            )}
          </IconButton>
        </div>
      </aside>

      {/* ---------------------------------------------------------------- */}
      {/* Content column                                                    */}
      {/* ---------------------------------------------------------------- */}
      <div class="flex min-w-0 flex-1 flex-col">
        {/* Quiet mobile bar: wordmark + account. Breadcrumbs join it for
            nested views on every width. */}
        <header class="border-accent-text bg-nav sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b-[3px] border-double px-4 sm:px-6 lg:hidden">
          <Wordmark />
          <div class="ml-auto flex items-center gap-1">
            <ThemeToggle />
            {user.value && <Avatar user={user.value} size="md" />}
          </div>
        </header>

        {crumbs.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            class="border-accent-text/45 bg-nav sticky top-14 z-20 flex h-9 shrink-0 items-center border-b-2 border-dotted px-4 text-[13px] sm:px-6 lg:top-0 lg:px-8"
          >
            <ol class="flex min-w-0 items-center gap-1">
              {crumbs.map((crumb, i) => (
                <li key={i} class="flex min-w-0 items-center gap-1">
                  {i > 0 && (
                    <ChevronRight
                      aria-hidden="true"
                      class="text-ink-muted h-3.5 w-3.5 shrink-0"
                    />
                  )}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      class="focus-ring retro-link truncate"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      aria-current="page"
                      class="text-ink truncate font-medium"
                    >
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <main class="min-w-0 flex-1 pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-0">
          <Slot />
        </main>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Mobile bottom navigation                                          */}
      {/* ---------------------------------------------------------------- */}
      <nav
        aria-label="Main"
        class="border-accent-text bg-nav fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t-[3px] border-double pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <BottomItem
          href={filesItem.href}
          label={filesItem.label}
          icon={filesItem.icon}
          active={isNavItemActive(pathname, filesItem)}
        />
        <BottomItem
          href={uploadAction.href}
          label={uploadAction.label}
          icon={uploadAction.icon}
          active={isNavItemActive(pathname, uploadAction)}
          emphasis
        />
        <BottomItem
          href={analyticsItem.href}
          label={analyticsItem.label}
          icon={analyticsItem.icon}
          active={isNavItemActive(pathname, analyticsItem)}
        />
        <button
          type="button"
          onClick$={() => (moreOpen.value = true)}
          aria-haspopup="dialog"
          aria-expanded={moreOpen.value}
          class={cn(
            "focus-ring flex h-14 flex-col items-center justify-center gap-0.5 text-[11px]",
            sheetItems.some((i) => isNavItemActive(pathname, i))
              ? "text-accent-text font-medium"
              : "text-ink-muted",
          )}
        >
          <Ellipsis class="h-5 w-5" aria-hidden="true" />
          More
        </button>
      </nav>

      <Sheet open={moreOpen} title="More" side="bottom">
        <ul class="space-y-0.5">
          {sheetItems.map((item) => {
            const active =
              item.href === adminEntry.href
                ? isAdminSection(pathname)
                : isNavItemActive(pathname, item);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick$={closeMore}
                  aria-current={active ? "page" : undefined}
                  class={cn(
                    "focus-ring rounded-control flex items-center gap-3 px-2 py-2.5 text-sm transition-colors duration-150",
                    active
                      ? "bg-accent-soft text-accent-text font-semibold"
                      : "text-ink hover:bg-surface-hover",
                  )}
                >
                  <item.icon class="h-4 w-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <hr class="retro-rule my-3" />

        <div class="mb-3">
          <p class="text-ink-muted mb-1.5 text-xs font-medium tracking-wide uppercase">
            Theme
          </p>
          <ThemeToggle variant="list" />
        </div>

        {user.value && (
          <>
            <hr class="retro-rule my-3" />
            <div class="flex items-center gap-2.5 px-1 py-1.5">
              <Avatar user={user.value} size="md" />
              <div class="min-w-0 flex-1">
                <p class="text-ink truncate text-[13px] font-medium">
                  {user.value.name || "Account"}
                </p>
                <p class="text-ink-muted truncate text-xs">
                  {user.value.email}
                </p>
              </div>
            </div>
            {user.value.bioUsername && (
              <Link
                href={`/${user.value.bioUsername}`}
                onClick$={closeMore}
                class="focus-ring rounded-control text-ink hover:bg-surface-hover flex items-center gap-3 px-2 py-2.5 text-sm"
              >
                <ExternalLink class="h-4 w-4 shrink-0" aria-hidden="true" />
                View public bio
              </Link>
            )}
            <button
              type="button"
              onClick$={signOut}
              class="focus-ring rounded-control text-danger hover:bg-danger-soft flex w-full items-center gap-3 px-2 py-2.5 text-left text-sm"
            >
              <LogOut class="h-4 w-4 shrink-0" aria-hidden="true" />
              Sign out
            </button>
          </>
        )}
      </Sheet>
    </div>
  );
});

const BottomItem = component$<{
  href: string;
  label: string;
  icon: any;
  active: boolean;
  /** Upload: filled icon chip so it reads as the primary action without floating. */
  emphasis?: boolean;
}>(({ href, label, icon: Icon, active, emphasis }) => (
  <Link
    href={href}
    aria-current={active ? "page" : undefined}
    class={cn(
      "focus-ring flex h-14 flex-col items-center justify-center gap-0.5 text-[11px]",
      active ? "text-accent-text font-medium" : "text-ink-muted",
    )}
  >
    {emphasis ? (
      <span class="retro-bevel border-accent bg-accent text-on-accent flex h-6 w-9 items-center justify-center">
        <Icon class="h-4 w-4" aria-hidden="true" />
      </span>
    ) : (
      <Icon class="h-5 w-5" aria-hidden="true" />
    )}
    {label}
  </Link>
));
