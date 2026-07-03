import { component$, useSignal, useComputed$ } from "@builder.io/qwik";
import { routeLoader$, routeAction$, Link } from "@builder.io/qwik-city";
import {
  Users,
  CheckCircle,
  Ban,
  Search,
  Filter,
  ArrowUpDown,
  Globe,
  Activity,
  Bell,
  Settings,
  Crown,
  ArrowUp,
  ArrowDown,
  X,
  Clock,
  TrendingUp,
  HardDrive,
  Mail,
  MessageCircle,
  Calendar,
  Folder,
  Package,
  Save,
  RotateCcw,
  ChevronRight,
} from "lucide-icons-qwik";
import { AnalyticsChart } from "~/components/charts/analytics-chart";
import { UserAnalytics } from "~/components/charts/user-analytics";
import { api, serverAuth } from "~/lib/api-client";
import { getCurrentUser } from "~/lib/auth-client";
import { formatBytes } from "~/lib/utils";
import { PageHeader, StatCard } from "~/components/ui";

const DEFAULT_STORAGE_LIMIT = 10737418240;

export const useUserData = routeLoader$(async (requestEvent) => {
  const auth = serverAuth(requestEvent);
  const currentUser = await getCurrentUser(auth);
  if (!currentUser) {
    throw requestEvent.redirect(302, "/");
  }
  if (!currentUser.isAdmin) {
    throw requestEvent.redirect(302, "/dashboard");
  }

  const [usersRes, analyticsRes] = await Promise.all([
    api.admin.users(auth).catch(() => ({ users: [] })),
    api.admin.analytics(auth).catch(() => null),
  ]);

  // Shape backend users to what the table expects (settings/_count/accounts).
  const users = (usersRes.users ?? []).map((u) => ({
    ...u,
    settings: {
      maxUploads: 100,
      maxFileSize: 10485760,
      maxStorageLimit: null as number | null,
      storageUsed: u.storageUsed,
    },
    _count: { uploads: u.uploads, apiKeys: u.apiKeys },
    accounts: [] as { provider: string; providerAccountId: string }[],
  }));

  return {
    users,
    currentUser,
    config: { BASE_STORAGE_LIMIT: DEFAULT_STORAGE_LIMIT },
    analyticsData: analyticsRes?.analytics ?? [],
  };
});

export const useUpdateUser = routeAction$(async (data, requestEvent) => {
  if (!data.userId) {
    return { success: false, error: "userId is required" };
  }

  const parseLimit = (val: unknown): number | null | undefined => {
    if (typeof val !== "string") return undefined;
    if (val.trim() === "") return null; // explicit reset to default
    const n = parseInt(val);
    return !isNaN(n) && n > 0 ? n : undefined;
  };

  try {
    await api.admin.updateUser(
      data.userId as string,
      {
        isApproved:
          typeof data.isApproved === "boolean" ? data.isApproved : undefined,
        isAdmin: typeof data.isAdmin === "boolean" ? data.isAdmin : undefined,
        maxUploads: parseLimit(data.maxUploads) ?? undefined,
        maxFileSize: parseLimit(data.maxFileSize) ?? undefined,
        maxStorageLimit: parseLimit(data.maxStorageLimit),
      },
      serverAuth(requestEvent),
    );
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user",
    };
  }
});

export default component$(() => {
  const userData = useUserData();
  const updateUser = useUpdateUser();
  const searchQuery = useSignal("");
  const approvalFilter = useSignal("all"); // all, approved, pending
  const adminFilter = useSignal("all"); // all, admin, user  const sortBy = useSignal("createdAt"); // createdAt, name, uploads, storageUsed, email
  const sortBy = useSignal("createdAt"); // createdAt, name, uploads, storageUsed, email
  const sortOrder = useSignal("desc"); // asc, desc

  const getEffectiveStorageLimit = (user: any): number => {
    const limit = user.settings?.maxStorageLimit ||
      userData.value?.config.BASE_STORAGE_LIMIT ||
      10737418240;
    return typeof limit === 'bigint' ? Number(limit) : limit;
  }; // Filter and sort users based on all criteria
  const filteredUsers = useComputed$(() => {
    let users = userData.value?.users || [];

    // Apply search filter
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase().trim();
      users = users.filter((user: any) => {
        // Search by name (Discord display name/username)
        if (user.name?.toLowerCase().includes(query)) return true;

        // Search by email
        if (user.email?.toLowerCase().includes(query)) return true;

        // Search by Discord ID (providerAccountId)
        if (
          user.accounts?.some(
            (account: any) =>
              account.provider === "discord" &&
              account.providerAccountId?.includes(query),
          )
        )
          return true;

        // Search by user ID
        if (user.id?.toLowerCase().includes(query)) return true;

        return false;
      });
    }

    // Apply approval status filter
    if (approvalFilter.value !== "all") {
      users = users.filter((user: any) => {
        if (approvalFilter.value === "approved") return user.isApproved;
        if (approvalFilter.value === "pending") return !user.isApproved;
        return true;
      });
    }

    // Apply admin status filter
    if (adminFilter.value !== "all") {
      users = users.filter((user: any) => {
        if (adminFilter.value === "admin") return user.isAdmin;
        if (adminFilter.value === "user") return !user.isAdmin;
        return true;
      });
    }

    // Apply sorting
    users = [...users].sort((a: any, b: any) => {
      let aVal, bVal;

      switch (sortBy.value) {
        case "name":
          aVal = (a.name || "").toLowerCase();
          bVal = (b.name || "").toLowerCase();
          break;
        case "email":
          aVal = (a.email || "").toLowerCase();
          bVal = (b.email || "").toLowerCase();
          break;
        case "uploads":
          aVal = a._count?.uploads || 0;
          bVal = b._count?.uploads || 0;
          break;
        case "storageUsed":
          aVal = Number(a.storageUsed || 0);
          bVal = Number(b.storageUsed || 0);
          break;
        case "createdAt":
        default:
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
      }

      if (aVal < bVal) return sortOrder.value === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder.value === "asc" ? 1 : -1;
      return 0;
    });

    return users;
  });

  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        icon={Users}
        subtitle="Manage your twink community~ Approve users and keep everything safe! (◕‿◕)♡"
      />
      {/* Status Messages */}
      {updateUser.value?.success && (
        <div class="glass mb-6 rounded-2xl border border-theme-success/30 bg-theme-success/10 p-4 sm:mb-8 sm:p-6">
          <div class="flex items-center justify-center text-center">
            <CheckCircle class="mr-2 h-5 w-5 text-theme-success" />
            <span class="font-medium text-theme-success">
              User updated successfully!
            </span>
          </div>
        </div>
      )}
      {updateUser.value?.error && (
        <div class="glass mb-6 rounded-2xl border border-theme-error/30 bg-theme-error/10 p-4 sm:mb-8 sm:p-6">
          <div class="flex items-center justify-center text-center">
            <Ban class="mr-2 h-5 w-5 text-theme-error" />
            <span class="font-medium text-theme-error">
              Error: {updateUser.value.error}
            </span>
          </div>
        </div>
      )}
      {/* Stats Cards */}
      <div class="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-6 md:grid-cols-4">
        <StatCard
          icon={Users}
          accent={0}
          label="Total Users"
          value={userData.value?.users.length || 0}
        />
        <StatCard
          icon={CheckCircle}
          accent={1}
          label="Approved"
          value={userData.value?.users.filter((u) => u.isApproved).length || 0}
        />
        <StatCard
          icon={Ban}
          accent={2}
          label="Pending"
          value={userData.value?.users.filter((u) => !u.isApproved).length || 0}
        />
        <StatCard
          icon={Users}
          accent={3}
          label="New Users (7d)"
          value={
            userData.value?.analyticsData?.reduce(
              (sum, day) => sum + (day.usersRegistered || 0),
              0,
            ) || 0
          }
        />
      </div>
      {/* Analytics Section */}
      <div class="mb-6 sm:mb-8">
        <h2 class="text-gradient-cute mb-4 flex items-center gap-2 text-xl font-bold sm:mb-6 sm:text-2xl">
          Analytics Overview - Last 7 Days
        </h2>
        <div class="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-4">
          <AnalyticsChart
            data={userData.value?.analyticsData || []}
            metric="totalViews"
            title="Total Views"
            color="var(--theme-accent-primary)"
          />
          <AnalyticsChart
            data={userData.value?.analyticsData || []}
            metric="uniqueViews"
            title="Unique Visitors"
            color="var(--theme-accent-secondary)"
          />
          <AnalyticsChart
            data={userData.value?.analyticsData || []}
            metric="uploadsCount"
            title="New Uploads"
            color="var(--theme-accent-tertiary)"
          />
          <AnalyticsChart
            data={userData.value?.analyticsData || []}
            metric="usersRegistered"
            title="New Users"
            color="var(--theme-accent-quaternary)"
          />
        </div>
      </div>
      {/* Admin Quick Actions */}
      <div class="mb-6 sm:mb-8">
        <h2 class="text-gradient-cute mb-4 flex items-center justify-center gap-2 text-center text-xl font-bold sm:mb-6 sm:text-2xl">
          <Settings class="h-5 w-5 sm:h-6 sm:w-6" />
          Admin Actions~
        </h2>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/dashboard/admin/domains"
            class="card-cute group rounded-2xl p-4 sm:p-6"
          >
            <div class="mb-3 flex items-center sm:mb-4">
              <div class="pulse-soft from-theme-accent-primary to-theme-accent-secondary rounded-full bg-gradient-to-br p-2 sm:p-3">
                <Globe class="text-theme-text-primary h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>
            <div class="mb-2">
              <h3 class="group-hover:text-gradient-cute text-theme-text-primary text-base font-medium transition-all duration-300 sm:text-lg">
                Upload Domains
              </h3>
            </div>
            <p class="text-theme-text-secondary text-xs sm:text-sm">
              Manage available upload domains for users~ Add cute domains!
              (◕‿◕)♡
            </p>
          </Link>

          <Link
            href="/dashboard/admin/health"
            class="card-cute group rounded-2xl p-4 sm:p-6"
          >
            <div class="mb-3 flex items-center sm:mb-4">
              <div class="pulse-soft from-theme-accent-secondary to-theme-accent-tertiary animation-delay-200 rounded-full bg-gradient-to-br p-2 sm:p-3">
                <Activity class="text-theme-text-primary h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>
            <div class="mb-2">
              <h3 class="group-hover:text-gradient-cute text-theme-text-primary text-base font-medium transition-all duration-300 sm:text-lg">
                Health Dashboard
              </h3>
            </div>
            <p class="text-theme-text-secondary text-xs sm:text-sm">
              Monitor server performance, system metrics, and health status~
            </p>
          </Link>

          <Link
            href="/dashboard/admin/events"
            class="card-cute group rounded-2xl p-4 sm:p-6"
          >
            <div class="mb-3 flex items-center sm:mb-4">
              <div class="pulse-soft from-theme-accent-tertiary to-theme-accent-quaternary animation-delay-400 rounded-full bg-gradient-to-br p-2 sm:p-3">
                <Bell class="text-theme-text-primary h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>
            <div class="mb-2">
              <h3 class="group-hover:text-gradient-cute text-theme-text-primary text-base font-medium transition-all duration-300 sm:text-lg">
                System Events
              </h3>
            </div>
            <p class="text-theme-text-secondary text-xs sm:text-sm">
              Monitor system alerts, user warnings, and automated events~
            </p>
          </Link>
        </div>
      </div>
      {/* User Management */}
      <div class="card-cute mb-6 rounded-2xl p-4 sm:mb-8 sm:p-6">
        <div class="mb-4 flex flex-col gap-4">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 class="text-gradient-cute flex items-center gap-2 text-lg font-bold sm:text-xl">
              User Management
              {(searchQuery.value.trim() ||
                approvalFilter.value !== "all" ||
                adminFilter.value !== "all") && (
                <span class="text-theme-accent-primary text-sm font-normal">
                  ({filteredUsers.value.length} of
                  {userData.value?.users.length || 0} users)
                </span>
              )}
            </h2>
            {/* Search Input */}
            <div class="relative w-full max-w-md sm:w-auto">
              <div class="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3">
                <Search class="text-theme-accent-primary h-4 w-4 drop-shadow-sm" />
              </div>
              <input
                type="text"
                placeholder="Search by name, email, Discord ID..."
                value={searchQuery.value}
                onInput$={(e) => {
                  searchQuery.value = (e.target as HTMLInputElement).value;
                }}
                class="text-theme-text-primary bg-theme-accent-primary/10 border-theme-card-border placeholder:theme-text-muted focus:border-theme-accent-primary/60 focus:from-theme-accent-primary/20 focus:to-theme-accent-secondary/20 focus:ring-theme-accent-primary/30 focus:shadow-theme-accent-primary/20 hover:border-theme-accent-primary/40 hover:shadow-theme-accent-primary/10 w-full rounded-full border bg-gradient-to-br py-2 pr-4 pl-10 text-sm backdrop-blur-sm transition-all duration-500 hover:shadow-md focus:bg-gradient-to-br focus:shadow-lg focus:ring-2 focus:outline-none"
              />
              <div class="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r from-pink-400/5 via-purple-400/5 to-cyan-400/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
            </div>
          </div>
          {/* Filters and Sorting */}
          <div class="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Approval Status Filter */}
            <div class="flex items-center gap-2">
              <Filter class="text-theme-accent-primary h-4 w-4" />
              <select
                value={approvalFilter.value}
                onChange$={(e) => {
                  approvalFilter.value = (e.target as HTMLSelectElement).value;
                }}
                class="glass border-theme-card-border text-theme-text-primary focus:border-theme-accent-primary/60 rounded-full border px-3 py-1 text-sm focus:outline-none"
              >
                <option value="all" class="bg-theme-card text-theme-primary">
                  All Users
                </option>
                <option
                  value="approved"
                  class="bg-theme-card text-theme-primary"
                >
                  Approved
                </option>
                <option
                  value="pending"
                  class="bg-theme-card text-theme-primary"
                >
                  Pending
                </option>
              </select>
            </div>
            {/* Admin Status Filter */}
            <div class="flex items-center gap-2">
              <select
                value={adminFilter.value}
                onChange$={(e) => {
                  adminFilter.value = (e.target as HTMLSelectElement).value;
                }}
                class="glass border-theme-card-border text-theme-text-primary focus:border-theme-accent-primary/60 rounded-full border bg-transparent px-3 py-1 text-sm focus:outline-none"
              >
                <option value="all" class="bg-theme-card text-theme-primary">
                  All Roles
                </option>
                <option value="admin" class="bg-theme-card text-theme-primary">
                  Admins
                </option>
                <option value="user" class="bg-theme-card text-theme-primary">
                  Users
                </option>
              </select>
            </div>
            {/* Sort By */}
            <div class="flex items-center gap-2">
              <ArrowUpDown class="text-theme-accent-primary h-4 w-4" />
              <select
                value={sortBy.value}
                onChange$={(e) => {
                  sortBy.value = (e.target as HTMLSelectElement).value;
                }}
                class="glass border-theme-card-border text-theme-text-primary focus:border-theme-accent-primary/60 rounded-full border bg-transparent px-3 py-1 text-sm focus:outline-none"
              >
                <option
                  value="createdAt"
                  class="bg-theme-card text-theme-primary"
                >
                  Join Date
                </option>
                <option value="name" class="bg-theme-card text-theme-primary">
                  Name
                </option>
                <option value="email" class="bg-theme-card text-theme-primary">
                  Email
                </option>
                <option
                  value="uploads"
                  class="bg-theme-card text-theme-primary"
                >
                  Upload Count
                </option>
                <option
                  value="storageUsed"
                  class="bg-theme-card text-theme-primary"
                >
                  Storage Used
                </option>
              </select>
            </div>
            {/* Sort Order */}
            <button
              onClick$={() => {
                sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
              }}
              class="glass border-theme-card-border text-theme-text-primary hover:border-theme-accent-primary/40 inline-flex items-center gap-1.5 rounded-full border bg-transparent px-3 py-1 text-sm transition-all duration-300 focus:outline-none"
            >
              {sortOrder.value === "asc" ? (
                <>
                  <ArrowUp class="h-3.5 w-3.5" />
                  Ascending
                </>
              ) : (
                <>
                  <ArrowDown class="h-3.5 w-3.5" />
                  Descending
                </>
              )}
            </button>
            {/* Clear Filters */}
            {(searchQuery.value.trim() ||
              approvalFilter.value !== "all" ||
              adminFilter.value !== "all" ||
              sortBy.value !== "createdAt" ||
              sortOrder.value !== "desc") && (
              <button
                onClick$={() => {
                  searchQuery.value = "";
                  approvalFilter.value = "all";
                  adminFilter.value = "all";
                  sortBy.value = "createdAt";
                  sortOrder.value = "desc";
                }}
                class="from-theme-deny to-theme-deny-hover border-theme-error text-theme-error inline-flex items-center gap-1.5 rounded-full border bg-gradient-to-br px-3 py-1 text-sm font-medium transition-all duration-300 hover:bg-gradient-to-br"
              >
                <X class="h-3.5 w-3.5" />
                Clear Filters
              </button>
            )}
          </div>
          {/* Quick Filter Buttons */}
          <div class="flex flex-wrap gap-2 text-xs">
            <span class="text-theme-accent-primary font-medium">
              Quick filters:
            </span>
            <button
              onClick$={() => {
                approvalFilter.value = "pending";
                adminFilter.value = "all";
                sortBy.value = "createdAt";
                sortOrder.value = "asc";
              }}
              class="glass border-theme-card-border text-theme-accent-primary hover:border-theme-accent-primary/40 inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs transition-all duration-300"
            >
              <Clock class="h-3.5 w-3.5" />
              Pending Approval
            </button>
            <button
              onClick$={() => {
                approvalFilter.value = "all";
                adminFilter.value = "all";
                sortBy.value = "uploads";
                sortOrder.value = "desc";
              }}
              class="glass border-theme-card-border text-theme-accent-primary hover:border-theme-accent-primary/40 inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs transition-all duration-300"
            >
              <TrendingUp class="h-3.5 w-3.5" />
              Most Active
            </button>
            <button
              onClick$={() => {
                approvalFilter.value = "all";
                adminFilter.value = "all";
                sortBy.value = "storageUsed";
                sortOrder.value = "desc";
              }}
              class="glass border-theme-card-border text-theme-accent-primary hover:border-theme-accent-primary/40 inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs transition-all duration-300"
            >
              <HardDrive class="h-3.5 w-3.5" />
              Storage Usage
            </button>
            <button
              onClick$={() => {
                approvalFilter.value = "all";
                adminFilter.value = "admin";
                sortBy.value = "createdAt";
                sortOrder.value = "desc";
              }}
              class="glass border-theme-card-border text-theme-accent-primary hover:border-theme-accent-primary/40 inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs transition-all duration-300"
            >
              <Crown class="h-3.5 w-3.5" />
              Admins Only
            </button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <div class="glass border-theme-card-border rounded-2xl border">
            {!userData.value?.users || userData.value.users.length === 0 ? (
              <div class="py-8 text-center sm:py-12">
                <div class="glass mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full sm:h-16 sm:w-16">
                  <Users class="text-theme-accent-primary h-6 w-6" />
                </div>
                <h3 class="text-theme-text-primary mb-2 text-base font-medium sm:text-lg">
                  No Users Yet!
                </h3>
                <p class="text-theme-text-secondary px-4 text-sm sm:text-base">
                  Waiting for the first twinks to join~ (◕‿◕)♡
                </p>
              </div>
            ) : filteredUsers.value.length === 0 ? (
              <div class="py-8 text-center sm:py-12">
                <div class="glass mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full sm:h-16 sm:w-16">
                  <Search class="text-theme-accent-primary h-6 w-6" />
                </div>
                <h3 class="text-theme-text-primary mb-2 text-base font-medium sm:text-lg">
                  No Results Found!
                </h3>
                <p class="text-theme-text-secondary px-4 text-sm sm:text-base">
                  Try adjusting your filters or search terms~ (◕‿◕)♡
                </p>
              </div>
            ) : (
              <div class="space-y-4 p-4">
                {filteredUsers.value.map((user: any) => (
                  <div
                    key={user.id}
                    class="glass border-theme-card-border hover:border-theme-accent-primary/40 group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-lg"
                  >
                    {/* Main User Card */}
                    <div class="p-5">
                      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        {/* Left Section: User Info */}
                        <div class="flex flex-1 items-start gap-4">
                          {/* Avatar */}
                          {user.image && (
                            <div class="relative flex-shrink-0">
                              <img
                                class="border-theme-accent-primary/20 h-14 w-14 rounded-2xl border-2 shadow-lg transition-transform duration-300 group-hover:scale-105"
                                src={user.image}
                                alt={user.name || "User"}
                                width="56"
                                height="56"
                              />
                              {/* Status Indicator */}
                              <div
                                class={`absolute -right-1 -bottom-1 h-4 w-4 rounded-full border-2 border-white ${
                                  user.isApproved
                                    ? "bg-theme-success"
                                    : "bg-theme-warning"
                                }`}
                              />
                            </div>
                          )}
                          
                          {/* User Details */}
                          <div class="min-w-0 flex-1">
                            <div class="mb-2 flex flex-wrap items-center gap-2">
                              <h3 class="text-theme-text-primary text-lg font-semibold">
                                {user.name || "Anonymous Cutie"}
                              </h3>
                              {/* Badges */}
                              <span
                                class={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                  user.isApproved
                                    ? "bg-theme-success/20 text-theme-success border border-theme-success/30"
                                    : "bg-theme-warning/20 text-theme-warning border border-theme-warning/30"
                                }`}
                              >
                                {user.isApproved ? (
                                  <>
                                    <CheckCircle class="h-3 w-3" />
                                    Approved
                                  </>
                                ) : (
                                  <>
                                    <Clock class="h-3 w-3" />
                                    Pending
                                  </>
                                )}
                              </span>
                              {user.isAdmin && (
                                <span class="bg-purple-500/20 text-purple-400 border-purple-500/30 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                                  <Crown class="h-3 w-3" />
                                  Admin
                                </span>
                              )}
                            </div>
                            
                            {/* Contact Info */}
                            <div class="text-theme-text-secondary space-y-1 text-sm">
                              <div class="flex items-center gap-2">
                                <Mail class="text-theme-accent-primary h-3.5 w-3.5 flex-shrink-0" />
                                <span class="truncate">{user.email}</span>
                              </div>
                              {user.accounts?.[0]?.providerAccountId && (
                                <div class="flex items-center gap-2">
                                  <MessageCircle class="text-theme-accent-secondary h-3.5 w-3.5 flex-shrink-0" />
                                  <span class="font-mono text-xs">
                                    {user.accounts[0].providerAccountId}
                                  </span>
                                </div>
                              )}
                              <div class="flex items-center gap-2">
                                <Calendar class="text-theme-accent-tertiary h-3.5 w-3.5 flex-shrink-0" />
                                <span class="text-xs">
                                  Joined{" "}
                                  {new Date(user.createdAt).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    },
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Section: Stats & Actions */}
                        <div class="flex flex-col gap-4 lg:items-end">
                          {/* Stats Grid */}
                          <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
                            {/* Uploads */}
                            <div class="glass rounded-xl p-3 text-center">
                              <div class="text-theme-accent-primary text-2xl font-bold">
                                {user._count.uploads}
                              </div>
                              <div class="text-theme-text-secondary text-xs">
                                Uploads
                              </div>
                            </div>
                            
                            {/* API Keys */}
                            <div class="glass rounded-xl p-3 text-center">
                              <div class="text-theme-accent-secondary text-2xl font-bold">
                                {user._count.apiKeys}
                              </div>
                              <div class="text-theme-text-secondary text-xs">
                                API Keys
                              </div>
                            </div>
                            
                            {/* Storage Used */}
                            <div class="glass rounded-xl p-3 text-center lg:col-span-2">
                              <div class="text-theme-accent-tertiary mb-1 text-lg font-bold">
                                {formatBytes(user.settings?.storageUsed || 0)}
                              </div>
                              <div class="text-theme-text-secondary text-xs">
                                of {formatBytes(getEffectiveStorageLimit(user))}
                              </div>
                              {/* Storage Bar */}
                              <div class="bg-theme-accent-primary/10 mt-2 h-1.5 overflow-hidden rounded-full">
                                <div
                                  class="from-theme-accent-primary to-theme-accent-secondary h-full rounded-full bg-gradient-to-r transition-all duration-300"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      (Number(user.settings?.storageUsed || 0) /
                                        getEffectiveStorageLimit(user)) *
                                        100,
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div class="flex flex-wrap gap-2 lg:justify-end">
                            {!user.isApproved ? (
                              <button
                                onClick$={() => {
                                  updateUser.submit({
                                    userId: user.id,
                                    isApproved: true,
                                  });
                                }}
                                class="from-green-500 to-emerald-500 inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl lg:flex-initial"
                              >
                                <CheckCircle class="h-4 w-4" />
                                Approve User
                              </button>
                            ) : (
                              <button
                                onClick$={() => {
                                  updateUser.submit({
                                    userId: user.id,
                                    isApproved: false,
                                  });
                                }}
                                class="from-orange-500 to-red-500 inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl lg:flex-initial"
                              >
                                <Ban class="h-4 w-4" />
                                Revoke Access
                              </button>
                            )}
                            
                            <button
                              onClick$={() => {
                                updateUser.submit({
                                  userId: user.id,
                                  isAdmin: !user.isAdmin,
                                });
                              }}
                              class={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl lg:flex-initial ${
                                user.isAdmin
                                  ? "from-purple-500 to-pink-500 bg-gradient-to-br text-white"
                                  : "glass border-theme-accent-primary/40 text-theme-text-primary border"
                              }`}
                            >
                              {user.isAdmin ? "Remove Admin" : "Make Admin"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Sections */}
                    <div class="border-theme-card-border/50 border-t">
                      {/* Limits Editor */}
                      <details class="group/limits">
                        <summary class="text-theme-accent-primary hover:bg-theme-accent-primary/5 flex cursor-pointer items-center justify-between px-5 py-3 text-sm font-medium transition-colors">
                          <span class="flex items-center gap-2">
                            <ChevronRight class="h-4 w-4 transition-transform group-open/limits:rotate-90" />
                            <Settings class="h-4 w-4" />
                            Edit User Limits
                          </span>
                        </summary>
                        <div class="bg-theme-card/30 p-5">
                          <form
                            class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
                            preventdefault:submit
                            onSubmit$={(e, currentTarget) => {
                              const formData = new FormData(currentTarget);
                              updateUser.submit({
                                userId: user.id,
                                maxUploads: formData.get("maxUploads") as string,
                                maxFileSize: formData.get("maxFileSize") as string,
                                maxStorageLimit: formData.get("maxStorageLimit") as string,
                              });
                            }}
                          >
                            {/* Max Uploads */}
                            <div class="space-y-2">
                              <label class="text-theme-text-primary flex items-center gap-2 text-sm font-medium">
                                <Folder class="h-4 w-4" />
                                Max Uploads
                              </label>
                              <input
                                type="number"
                                name="maxUploads"
                                value={user.settings?.maxUploads || 100}
                                class="glass border-theme-card-border text-theme-text-primary focus:border-theme-accent-primary focus:ring-theme-accent-primary/20 w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:ring-2 focus:outline-none"
                                min="1"
                              />
                              <p class="text-theme-text-secondary text-xs">
                                Current: {user.settings?.maxUploads || 100} files
                              </p>
                            </div>

                            {/* Max File Size */}
                            <div class="space-y-2">
                              <label class="text-theme-text-primary flex items-center gap-2 text-sm font-medium">
                                <Package class="h-4 w-4" />
                                Max File Size
                              </label>
                              <input
                                type="number"
                                name="maxFileSize"
                                value={user.settings?.maxFileSize || 10485760}
                                class="glass border-theme-card-border text-theme-text-primary focus:border-theme-accent-primary focus:ring-theme-accent-primary/20 w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:ring-2 focus:outline-none"
                                min="1"
                              />
                              <p class="text-theme-text-secondary text-xs">
                                Current: {formatBytes(user.settings?.maxFileSize || 10485760)}
                              </p>
                            </div>

                            {/* Storage Limit */}
                            <div class="space-y-2">
                              <label class="text-theme-text-primary flex items-center gap-2 text-sm font-medium">
                                <HardDrive class="h-4 w-4" />
                                Storage Limit
                              </label>
                              <input
                                type="number"
                                name="maxStorageLimit"
                                value={user.settings?.maxStorageLimit || ""}
                                placeholder="Leave empty for default"
                                class="glass border-theme-card-border text-theme-text-primary placeholder:text-theme-text-secondary/50 focus:border-theme-accent-primary focus:ring-theme-accent-primary/20 w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:ring-2 focus:outline-none"
                                min="1"
                              />
                              <p class="text-theme-text-secondary text-xs">
                                {user.settings?.maxStorageLimit
                                  ? `Custom: ${formatBytes(user.settings.maxStorageLimit)}`
                                  : `Default: ${formatBytes(userData.value?.config.BASE_STORAGE_LIMIT || 10737418240)}`}
                              </p>
                            </div>

                            {/* Buttons */}
                            <div class="flex flex-col gap-2 sm:col-span-2 lg:col-span-1 lg:justify-center">
                              <button
                                type="submit"
                                class="from-theme-accent-primary to-theme-accent-secondary flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                              >
                                <Save class="h-4 w-4" />
                                Save Changes
                              </button>
                              <button
                                type="button"
                                onClick$={() => {
                                  updateUser.submit({
                                    userId: user.id,
                                    maxStorageLimit: "",
                                  });
                                }}
                                class="glass border-theme-card-border text-theme-text-secondary hover:text-theme-text-primary inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-300"
                              >
                                <RotateCcw class="h-4 w-4" />
                                Reset to Default
                              </button>
                            </div>
                          </form>
                        </div>
                      </details>

                      {/* User Analytics */}
                      <div class="border-theme-card-border/50 border-t p-5">
                        <UserAnalytics
                          userId={user.id}
                          userName={user.name || "Anonymous Cutie"}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
});
