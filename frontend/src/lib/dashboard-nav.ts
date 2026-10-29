import {
  Folder,
  Images,
  Inbox,
  Trash2,
  Upload,
  Link2,
  IdCard,
  MessageSquare,
  BarChart3,
  Settings,
  Wrench,
  Shield,
  Users,
  Globe,
  Bell,
  Activity,
  SlidersHorizontal,
} from "lucide-icons-qwik";

export interface NavItem {
  href: string;
  label: string;
  icon: any;
  /** Match only on an exact pathname (used for section roots). */
  exact?: boolean;
}

/**
 * Durable destinations in the signed-in application. Files is the home; Upload
 * is the shell's dedicated action rather than a list entry, so it is never
 * duplicated as a second equally prominent call to action inside a page.
 */
export const primaryNav: NavItem[] = [
  { href: "/dashboard", label: "Files", icon: Folder, exact: true },
  { href: "/dashboard/albums", label: "Albums", icon: Images },
  { href: "/dashboard/requests", label: "File requests", icon: Inbox },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/links", label: "Short Links", icon: Link2 },
  { href: "/dashboard/bio", label: "Bio", icon: IdCard },
  { href: "/dashboard/embed", label: "Embeds", icon: MessageSquare },
];

/** Configuration, reached less often than the primary destinations. */
export const secondaryNav: NavItem[] = [
  { href: "/dashboard/cleanup", label: "Storage cleanup", icon: Trash2 },
  { href: "/dashboard/presets", label: "Upload presets", icon: SlidersHorizontal },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/setup/sharex", label: "ShareX Setup", icon: Wrench },
];

/** The single Admin entry. Admin sections live in the admin route's own rail. */
export const adminEntry: NavItem = {
  href: "/dashboard/admin",
  label: "Admin",
  icon: Shield,
};

export const uploadAction: NavItem = {
  href: "/upload",
  label: "Upload",
  icon: Upload,
};

/** Sections within Admin, rendered as local navigation on admin routes. */
export const adminNav: NavItem[] = [
  { href: "/dashboard/admin", label: "Users", icon: Users, exact: true },
  { href: "/dashboard/admin/domains", label: "Domains", icon: Globe },
  { href: "/dashboard/admin/events", label: "Events", icon: Bell },
  { href: "/dashboard/admin/health", label: "Health", icon: Activity },
  {
    href: "/dashboard/admin/bio-limits",
    label: "Bio Limits",
    icon: SlidersHorizontal,
  },
];

function normalize(path: string): string {
  return path.replace(/\/+$/, "") || "/";
}

/**
 * Active-state test shared by every navigation surface. Section roots (`exact`)
 * match only their own path; everything else also matches nested routes, so
 * `/dashboard/analytics/<code>` keeps Analytics selected.
 */
export function isNavItemActive(pathname: string, item: NavItem): boolean {
  const path = normalize(pathname);
  const href = normalize(item.href);
  if (
    href === "/dashboard/settings" &&
    path === "/dashboard/api-keys"
  ) {
    return true;
  }
  if (item.exact) return path === href;
  return path === href || path.startsWith(href + "/");
}

/** True when the shell should show the Admin entry as the current section. */
export function isAdminSection(pathname: string): boolean {
  const path = normalize(pathname);
  return path === "/dashboard/admin" || path.startsWith("/dashboard/admin/");
}

export interface Crumb {
  label: string;
  /** Omitted for the final (current) crumb. */
  href?: string;
}

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Files",
  analytics: "Analytics",
  links: "Short Links",
  bio: "Bio",
  embed: "Embeds",
  "api-keys": "API Keys",
  settings: "Settings",
  admin: "Admin",
  domains: "Domains",
  events: "Events",
  health: "Health",
  "bio-limits": "Bio Limits",
  "alerts-test": "Alerts Test",
  upload: "Upload",
  setup: "Setup",
  sharex: "ShareX Setup",
};

/**
 * Breadcrumbs for nested views only. A top-level destination is already named
 * by the selected navigation item, so it returns an empty trail and the shell
 * renders nothing.
 */
export function resolveBreadcrumbs(pathname: string): Crumb[] {
  const segments = normalize(pathname).replace(/^\//, "").split("/").filter(Boolean);
  if (segments.length < 2) return [];

  if (
    segments.length === 2 &&
    segments[0] === "dashboard" &&
    segments[1] === "api-keys"
  ) {
    return [
      { label: "Settings", href: "/dashboard/settings" },
      { label: "API Keys" },
    ];
  }

  // `/dashboard/<section>` is a top-level destination, not a nested view.
  if (segments.length === 2 && segments[0] === "dashboard") return [];
  if (segments[0] === "setup") return [];

  const crumbs: Crumb[] = [];
  let acc = "";
  segments.forEach((seg, i) => {
    acc += `/${seg}`;
    // The rail already names the application root, so it is noise in a trail.
    if (i === 0 && seg === "dashboard") return;
    const isLast = i === segments.length - 1;
    const label =
      SEGMENT_LABELS[seg] ?? (seg.length > 18 ? `${seg.slice(0, 18)}…` : seg);
    crumbs.push({ label, href: isLast ? undefined : acc });
  });
  return crumbs;
}
