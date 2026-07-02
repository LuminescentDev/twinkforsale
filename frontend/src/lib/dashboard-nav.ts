import {
  Home,
  Folder,
  Upload,
  Link2,
  Link as LinkIcon,
  Share,
  TrendingUp,
  Key,
  Settings,
  Wrench,
} from "lucide-icons-qwik";

export interface NavItem {
  href: string;
  label: string;
  icon: any;
  /** Only mark active on an exact pathname match (used for section roots). */
  exact?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

/**
 * Single source of truth for the signed-in navigation. Rendered by the
 * dashboard sidebar (desktop) and the top-nav mobile menu so the two never
 * drift apart. Grouped so the ~9 destinations are scannable instead of being
 * crammed into one flat bar.
 */
export const dashboardNav: NavGroup[] = [
  {
    title: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: Home, exact: true }],
  },
  {
    title: "Content",
    items: [
      { href: "/dashboard/uploads", label: "Files", icon: Folder },
      { href: "/upload", label: "Upload", icon: Upload },
      { href: "/dashboard/links", label: "Short Links", icon: Link2 },
    ],
  },
  {
    title: "Sharing",
    items: [
      { href: "/dashboard/bio", label: "Bio Page", icon: LinkIcon },
      { href: "/dashboard/embed", label: "Discord Embeds", icon: Share },
    ],
  },
  {
    title: "Insights",
    items: [
      { href: "/dashboard/analytics", label: "Analytics", icon: TrendingUp },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/dashboard/api-keys", label: "API Keys", icon: Key },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
      { href: "/setup/sharex", label: "ShareX Setup", icon: Wrench },
    ],
  },
];

/**
 * Active-state test shared by every nav surface. Section roots (`exact`)
 * match only their own path; everything else also matches nested routes
 * (e.g. `/dashboard/analytics/<code>` keeps Analytics highlighted).
 */
export function isNavItemActive(pathname: string, item: NavItem): boolean {
  const path = pathname.replace(/\/$/, "") || "/";
  const href = item.href.replace(/\/$/, "") || "/";
  if (item.exact) return path === href;
  return path === href || path.startsWith(href + "/");
}
