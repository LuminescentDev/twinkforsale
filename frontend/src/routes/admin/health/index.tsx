import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import {
  routeLoader$,
  routeAction$,
  type DocumentHead,
} from "@builder.io/qwik-city";
import {
  Activity,
  Server,
  Database,
  HardDrive,
  Users,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Zap,
  Eye,
  Download,
  FileText,
  Cpu,
  RefreshCw,
  Info,
} from "lucide-icons-qwik";
import { formatBytes } from "~/lib/utils";
import { api, serverAuth } from "~/lib/api-client";
import { getCurrentUser } from "~/lib/auth-client";

export const useAdminCheck = routeLoader$(async (requestEvent) => {
  const user = await getCurrentUser(serverAuth(requestEvent));
  if (!user) {
    throw requestEvent.redirect(302, "/");
  }
  if (!user.isAdmin) {
    throw requestEvent.redirect(302, "/dashboard");
  }
  return { isAdmin: true };
});

// The backend has no aggregate system-check endpoint yet; treat as a no-op.
export const useTriggerSystemCheck = routeAction$(async () => {
  return {
    success: true,
    message: "System check completed",
    error: undefined as string | undefined,
  };
});

export const useHealthData = routeLoader$(async (requestEvent) => {
  const auth = serverAuth(requestEvent);
  try {
    const [health, usersRes, eventsRes] = await Promise.all([
      api.admin.health(auth).catch(() => null),
      api.admin.users(auth).catch(() => ({ users: [] })),
      api.admin.events(auth).catch(() => ({ events: [] })),
    ]);

    const users = usersRes.users ?? [];
    const totalUsers = users.length;
    const approvedUsers = users.filter((u) => u.isApproved).length;
    const totalSize = users.reduce((s, u) => s + u.storageUsed, 0);
    const totalFiles = users.reduce((s, u) => s + u.uploads, 0);

    // 24h severity stats from events.
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const stats = { CRITICAL: 0, ERROR: 0, WARNING: 0, INFO: 0 };
    for (const e of eventsRes.events) {
      if (new Date(e.createdAt).getTime() >= cutoff && e.severity in stats) {
        stats[e.severity as keyof typeof stats]++;
      }
    }
    const recentEvents = eventsRes.events
      .slice(0, 20)
      .map((e) => ({ ...e, user: null as { email: string } | null }));

    const topUsers = [...users]
      .sort((a, b) => b.uploads - a.uploads)
      .slice(0, 5)
      .map((u) => ({
        name: u.name || "Anonymous",
        email: u.email,
        uploadsLast7Days: 0,
        totalUploads: u.uploads,
        storageUsed: u.storageUsed,
      }));

    return {
      database: {
        status: health?.databaseReachable ? "healthy" : "degraded",
        responseTime: 0,
        connections: 1,
      },
      // Server-level disk/CPU metrics aren't exposed by the backend yet.
      storage: {
        totalFiles,
        totalSize,
        freeSpace: 0,
        usedSpace: totalSize,
        diskTotal: 0,
        diskUsed: totalSize,
        diskUsedPercentage: 0,
        storageType: "Backend",
      },
      users: {
        total: totalUsers,
        approved: approvedUsers,
        pending: totalUsers - approvedUsers,
      },
      activity: { uploads24h: 0, views24h: 0, downloads24h: 0 },
      system: {
        uptime: 0,
        memory: { used: 0, total: 0, external: 0, available: 0 },
        cpu: null,
        platform: "backend",
        nodeVersion: "",
        environment: "",
      },
      topUsers,
      errorLogs: [] as unknown[],
      analytics: [] as unknown[],
      systemEvents: { recent: recentEvents, stats },
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error("Health check error:", error);
    return {
      error: "Failed to collect health data",
      lastUpdated: new Date(),
    };
  }
});

export default component$(() => {
  const healthData = useHealthData();
  const triggerSystemCheckAction = useTriggerSystemCheck();
  const autoRefresh = useSignal(false);
  // Auto-refresh functionality
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }: any) => {
    track(() => autoRefresh.value);

    if (autoRefresh.value) {
      const interval = setInterval(() => {
        window.location.reload();
      }, 30000); // Refresh every 30 seconds

      cleanup(() => clearInterval(interval));
    }
  });
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (healthData.value.error) {
    return (
      <div>
        <div class="mx-auto max-w-7xl">
          <div class="text-center">
            <AlertTriangle class="mx-auto h-12 w-12 text-theme-error" />
            <h1 class="mt-4 text-2xl font-bold text-theme-error">
              Health Check Failed
            </h1>
            <p class="mt-2 text-theme-text-muted">{healthData.value.error}</p>
          </div>
        </div>
      </div>
    );
  }

  const data = healthData.value;

  return (
    <div>
      <div class="mx-auto max-w-7xl">
        {" "}
        {/* Header */}
        <div class="mb-6">
          <div class="mb-4">
            <h1 class="text-gradient-cute flex items-center gap-3 text-2xl font-bold sm:text-3xl">
              <Activity class="h-6 w-6 sm:h-8 sm:w-8" />
              Health Dashboard
            </h1>
            <p class="text-theme-text-secondary mt-2 text-sm sm:text-base">
              Real-time system monitoring and performance metrics~ 📊
            </p>
          </div>

          {/* Mobile Action Buttons */}
          <div class="block space-y-3 sm:hidden">
            <button
              onClick$={() => (autoRefresh.value = !autoRefresh.value)}
              class={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95 ${
                autoRefresh.value
                  ? "bg-gradient-to-br from-theme-confirm to-theme-confirm-hover text-white shadow-lg shadow-green-500/20"
                  : "card-cute hover:shadow-md"
              }`}
            >
              <RefreshCw
                class={`h-4 w-4 ${autoRefresh.value ? "animate-spin" : ""}`}
              />
              Auto Refresh {autoRefresh.value ? "(ON)" : "(OFF)"}
            </button>

            <div class="grid grid-cols-2 gap-2">
              <button
                onClick$={async () => {
                  const result = await triggerSystemCheckAction.submit();
                  if (result.value?.success) {
                    setTimeout(() => window.location.reload(), 1000);
                  } else {
                    console.error(
                      "Failed to trigger system check:",
                      result.value?.error,
                    );
                  }
                }}
                class="card-cute flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-xs font-medium transition-all duration-300 hover:scale-105 hover:shadow-md active:scale-95"
              >
                <Info class="h-4 w-4 text-theme-info" />
                Check Events
              </button>
              <button
                onClick$={() => window.location.reload()}
                class="bg-gradient-to-br from-theme-accent-primary to-theme-accent-secondary flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-xs font-medium text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95"
              >
                <RefreshCw class="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Desktop Action Buttons */}
          <div class="hidden items-center justify-end gap-3 sm:flex">
            <button
              onClick$={() => (autoRefresh.value = !autoRefresh.value)}
              class={`card-cute flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95 ${
                autoRefresh.value
                  ? "card-cute !bg-gradient-to-br from-theme-confirm to-theme-confirm-hover text-white"
                  : ""
              }`}
            >
              <RefreshCw
                class={`h-4 w-4 ${autoRefresh.value ? "animate-spin" : ""}`}
              />
              Auto Refresh
            </button>
            <button
              onClick$={async () => {
                const result = await triggerSystemCheckAction.submit();
                if (result.value?.success) {
                  setTimeout(() => window.location.reload(), 1000);
                } else {
                  console.error(
                    "Failed to trigger system check:",
                    result.value?.error,
                  );
                }
              }}
              class="card-cute flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-md active:scale-95"
            >
              <Info class="h-4 w-4 text-theme-info" />
              Check Events
            </button>
            <button
              onClick$={() => window.location.reload()}
              class="bg-gradient-to-br from-theme-accent-primary to-theme-accent-secondary flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95"
            >
              <RefreshCw class="h-4 w-4" />
              Refresh Now
            </button>
          </div>
        </div>{" "}
        {/* Status Overview */}
        <div class="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {/* Database Status */}
          <div class="card-cute rounded-2xl p-3 sm:p-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 sm:gap-3">
                <Database class="h-5 w-5 text-theme-info sm:h-6 sm:w-6" />
                <div>
                  <h3 class="text-sm font-medium sm:text-base">Database</h3>
                  <p class="text-xs text-theme-text-muted sm:text-sm">
                    {data.database?.responseTime}ms response
                  </p>
                </div>
              </div>
              <CheckCircle class="h-4 w-4 text-theme-success sm:h-5 sm:w-5" />
            </div>
          </div>
          {/* Storage Status */}
          <div class="card-cute rounded-2xl p-3 sm:p-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 sm:gap-3">
                <HardDrive class="h-5 w-5 text-purple-500 sm:h-6 sm:w-6" />
                <div class="min-w-0 flex-1">
                  <h3 class="text-sm font-medium sm:text-base">Storage</h3>
                  <p class="truncate text-xs text-theme-text-muted sm:text-sm">
                    {formatBytes(data.storage?.freeSpace || 0)} free
                    {data.storage?.diskUsedPercentage && (
                      <span class="ml-1 hidden sm:inline">
                        ({(100 - data.storage.diskUsedPercentage).toFixed(1)}%)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {data.storage?.diskUsedPercentage &&
              data.storage.diskUsedPercentage > 80 ? (
                <AlertTriangle class="h-4 w-4 flex-shrink-0 text-theme-warning sm:h-5 sm:w-5" />
              ) : (
                <CheckCircle class="h-4 w-4 flex-shrink-0 text-theme-success sm:h-5 sm:w-5" />
              )}
            </div>
          </div>
          {/* Users Status */}
          <div class="card-cute rounded-2xl p-3 sm:p-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 sm:gap-3">
                <Users class="h-5 w-5 text-theme-success sm:h-6 sm:w-6" />
                <div>
                  <h3 class="text-sm font-medium sm:text-base">Users</h3>
                  <p class="text-xs text-theme-text-muted sm:text-sm">
                    {data.users?.pending || 0} pending approval
                  </p>
                </div>
              </div>
              {(data.users?.pending || 0) > 0 ? (
                <AlertTriangle class="h-4 w-4 text-theme-warning sm:h-5 sm:w-5" />
              ) : (
                <CheckCircle class="h-4 w-4 text-theme-success sm:h-5 sm:w-5" />
              )}
            </div>
          </div>
          {/* System Status */}
          <div class="card-cute rounded-2xl p-3 sm:p-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 sm:gap-3">
                <Server class="h-5 w-5 text-indigo-500 sm:h-6 sm:w-6" />
                <div class="min-w-0 flex-1">
                  <h3 class="text-sm font-medium sm:text-base">System</h3>
                  <p class="truncate text-xs text-theme-text-muted sm:text-sm">
                    Uptime: {formatUptime(data.system?.uptime || 0)}
                  </p>
                </div>
              </div>
              <CheckCircle class="h-4 w-4 flex-shrink-0 text-theme-success sm:h-5 sm:w-5" />
            </div>
          </div>
        </div>{" "}
        {/* Key Metrics */}
        <div class="mb-6 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          {/* System Performance */}
          <div class="card-cute rounded-2xl p-4 sm:rounded-2xl sm:p-6">
            <h3 class="text-gradient-cute mb-4 flex items-center gap-2 text-base font-bold sm:text-lg">
              <Cpu class="h-4 w-4 sm:h-5 sm:w-5" />
              System Performance
            </h3>
            <div class="space-y-3 sm:space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-theme-text-secondary text-sm sm:text-base">
                  Memory Usage
                </span>
                <span class="text-sm font-medium sm:text-base">
                  {data.system?.memory.used}MB / {data.system?.memory.total}MB
                </span>
              </div>
              <div class="bg-theme-card-border h-2 overflow-hidden rounded-full">
                <div
                  class="bg-gradient-to-br from-theme-accent-primary to-theme-accent-secondary h-full transition-all duration-500"
                  style={{
                    width: `${
                      data.system?.memory.used && data.system?.memory.total
                        ? (data.system.memory.used / data.system.memory.total) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <div class="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2 sm:gap-4">
                <div>
                  <span class="text-theme-text-secondary text-xs sm:text-sm">
                    Available Memory
                  </span>
                  <p class="text-sm font-medium sm:text-base">
                    {data.system?.memory.available}MB
                  </p>
                </div>
                <div>
                  <span class="text-theme-text-secondary text-xs sm:text-sm">
                    Node Version
                  </span>
                  <p class="text-sm font-medium sm:text-base">
                    {data.system?.nodeVersion}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Metrics */}
          <div class="card-cute rounded-2xl p-4 sm:rounded-2xl sm:p-6">
            <h3 class="text-gradient-cute mb-4 flex items-center gap-2 text-base font-bold sm:text-lg">
              <TrendingUp class="h-4 w-4 sm:h-5 sm:w-5" />
              24h Activity
            </h3>
            <div class="grid grid-cols-3 gap-3 sm:gap-4">
              <div class="text-center">
                <div class="bg-gradient-to-br from-theme-accent-primary to-theme-accent-secondary mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full sm:h-12 sm:w-12">
                  <FileText class="h-5 w-5 text-white sm:h-6 sm:w-6" />
                </div>
                <div class="text-theme-text-primary text-lg font-bold sm:text-2xl">
                  {data.activity?.uploads24h || 0}
                </div>
                <div class="text-theme-text-secondary text-xs sm:text-sm">
                  Uploads
                </div>
              </div>
              <div class="text-center">
                <div class="bg-gradient-to-br from-theme-accent-secondary to-theme-accent-tertiary mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full sm:h-12 sm:w-12">
                  <Eye class="h-5 w-5 text-white sm:h-6 sm:w-6" />
                </div>
                <div class="text-theme-text-primary text-lg font-bold sm:text-2xl">
                  {data.activity?.views24h || 0}
                </div>
                <div class="text-theme-text-secondary text-xs sm:text-sm">
                  Views
                </div>
              </div>
              <div class="text-center">
                <div class="bg-gradient-to-br from-theme-accent-tertiary to-theme-accent-quaternary mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full sm:h-12 sm:w-12">
                  <Download class="h-5 w-5 text-white sm:h-6 sm:w-6" />
                </div>
                <div class="text-theme-text-primary text-lg font-bold sm:text-2xl">
                  {data.activity?.downloads24h || 0}
                </div>
                <div class="text-theme-text-secondary text-xs sm:text-sm">
                  Downloads
                </div>
              </div>
            </div>
          </div>
        </div>{" "}
        {/* Storage & User Analytics */}
        <div class="mb-6 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Storage Breakdown */}
          <div class="card-cute rounded-2xl p-4 sm:rounded-2xl sm:p-6">            <h3 class="text-gradient-cute mb-4 flex items-center gap-2 text-base font-bold sm:text-lg">
              <HardDrive class="h-4 w-4 sm:h-5 sm:w-5" />
              Storage Analytics ({data.storage?.storageType || 'Unknown'})
            </h3>
            <div class="space-y-3 sm:space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-theme-text-secondary text-sm sm:text-base">
                  Total Files
                </span>
                <span class="text-sm font-medium sm:text-base">
                  {data.storage?.totalFiles?.toLocaleString() || 0}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-theme-text-secondary text-sm sm:text-base">
                  Files Size
                </span>
                <span class="text-sm font-medium sm:text-base">
                  {formatBytes(data.storage?.totalSize || 0)}
                </span>
              </div>              {data.storage?.storageType === 'R2' ? (
                <>
                  <div class="flex items-center justify-between">
                    <span class="text-theme-text-secondary text-sm sm:text-base">
                      R2 Storage
                    </span>
                    <span class="text-sm font-medium text-theme-info sm:text-base">
                      Unlimited
                    </span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-theme-text-secondary text-sm sm:text-base">
                      Monthly Cost
                    </span>
                    <span class="text-sm font-medium text-theme-success sm:text-base">
                      ${((data.storage?.totalSize || 0) / (1024 * 1024 * 1024) * 0.015).toFixed(2)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div class="flex items-center justify-between">
                    <span class="text-theme-text-secondary text-sm sm:text-base">
                      Disk Free Space
                    </span>
                    <span class="text-sm font-medium text-theme-success sm:text-base">
                      {formatBytes(data.storage?.freeSpace || 0)}
                    </span>
                  </div>
                  {data.storage?.diskTotal && data.storage.diskTotal > 0 && (
                    <>
                      <div class="flex items-center justify-between">
                        <span class="text-theme-text-secondary text-sm sm:text-base">
                          Total Disk Size
                        </span>
                        <span class="text-sm font-medium sm:text-base">
                          {formatBytes(data.storage.diskTotal)}
                        </span>
                      </div>
                      <div class="flex items-center justify-between">
                        <span class="text-theme-text-secondary text-sm sm:text-base">
                          Disk Usage
                        </span>
                        <span class="text-sm font-medium sm:text-base">
                          {data.storage.diskUsedPercentage?.toFixed(1) || 0}%
                        </span>
                      </div>
                      <div class="bg-theme-card-border h-3 overflow-hidden rounded-full">
                        <div
                          class={`h-full transition-all duration-500 ${
                            (data.storage.diskUsedPercentage || 0) > 80
                              ? "bg-gradient-to-r from-red-500 to-red-600"
                              : (data.storage.diskUsedPercentage || 0) > 60
                                ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                                : "bg-gradient-to-r from-green-500 to-emerald-500"
                          }`}
                          style={{
                            width: `${Math.min(data.storage.diskUsedPercentage || 0, 100)}%`,
                          }}
                        />
                      </div>
                    </>
                  )}
                </>
              )}
              <div class="flex items-center justify-between">
                <span class="text-theme-text-secondary text-sm sm:text-base">
                  Average File Size
                </span>
                <span class="text-sm font-medium sm:text-base">
                  {data.storage?.totalFiles && data.storage?.totalSize
                    ? formatBytes(
                        Math.round(
                          data.storage.totalSize / data.storage.totalFiles,
                        ),
                      )
                    : "0 Bytes"}
                </span>
              </div>
            </div>
          </div>

          {/* User Statistics */}
          <div class="card-cute rounded-2xl p-4 sm:rounded-2xl sm:p-6">
            <h3 class="text-gradient-cute mb-4 flex items-center gap-2 text-base font-bold sm:text-lg">
              <Users class="h-4 w-4 sm:h-5 sm:w-5" />
              User Statistics
            </h3>
            <div class="space-y-3 sm:space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-theme-text-secondary text-sm sm:text-base">
                  Total Users
                </span>
                <span class="text-sm font-medium sm:text-base">
                  {data.users?.total || 0}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-theme-text-secondary text-sm sm:text-base">
                  Approved Users
                </span>
                <span class="text-sm font-medium text-theme-success sm:text-base">
                  {data.users?.approved || 0}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-theme-text-secondary text-sm sm:text-base">
                  Pending Approval
                </span>
                <span
                  class={`text-sm font-medium sm:text-base ${
                    (data.users?.pending || 0) > 0
                      ? "text-theme-warning"
                      : "text-theme-text-muted"
                  }`}
                >
                  {data.users?.pending || 0}
                </span>
              </div>
              <div class="bg-theme-card-border h-2 overflow-hidden rounded-full">
                <div
                  class="bg-gradient-to-br from-theme-confirm to-theme-confirm-hover h-full transition-all duration-500"
                  style={{
                    width: `${
                      data.users?.total && data.users?.approved
                        ? (data.users.approved / data.users.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>{" "}
        {/* Top Active Users */}
        <div class="mb-6">
          <div class="card-cute rounded-2xl p-4 sm:rounded-2xl sm:p-6">
            <h3 class="text-gradient-cute mb-4 flex items-center gap-2 text-base font-bold sm:text-lg">
              <Zap class="h-4 w-4 sm:h-5 sm:w-5" />
              Top Active Users (Last 7 Days)
            </h3>
            {data.topUsers && data.topUsers.length > 0 ? (
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead>
                    <tr class="border-theme-card-border border-b">
                      <th class="text-theme-text-secondary py-2 text-left text-xs font-medium sm:text-sm">
                        User
                      </th>
                      <th class="text-theme-text-secondary py-2 text-right text-xs font-medium sm:text-sm">
                        Recent Uploads
                      </th>
                      <th class="text-theme-text-secondary hidden py-2 text-right text-xs font-medium sm:table-cell sm:text-sm">
                        Total Uploads
                      </th>
                      <th class="text-theme-text-secondary py-2 text-right text-xs font-medium sm:text-sm">
                        Storage Used
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topUsers.map((user, index) => (
                      <tr
                        key={index}
                        class="border-theme-card-border border-b last:border-b-0"
                      >
                        <td class="py-2 sm:py-3">
                          <div>
                            <div class="truncate text-sm font-medium sm:text-base">
                              {user.name}
                            </div>
                            <div class="text-theme-text-secondary truncate text-xs sm:text-sm">
                              {user.email}
                            </div>
                          </div>
                        </td>
                        <td class="text-theme-text-primary text-right text-sm font-medium sm:text-base">
                          {user.uploadsLast7Days}
                        </td>
                        <td class="text-theme-text-secondary hidden text-right text-sm sm:table-cell sm:text-base">
                          {user.totalUploads}
                        </td>
                        <td class="text-theme-text-secondary text-right text-sm sm:text-base">
                          {formatBytes(user.storageUsed)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div class="py-6 text-center sm:py-8">
                <Users class="mx-auto h-8 w-8 text-gray-400 sm:h-12 sm:w-12" />
                <p class="text-theme-text-secondary mt-2 text-sm sm:text-base">
                  No recent user activity
                </p>
              </div>
            )}
          </div>
        </div>{" "}
        {/* System Events */}
        <div class="mb-6">
          <div class="card-cute rounded-2xl p-4 sm:rounded-2xl sm:p-6">
            <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 class="text-gradient-cute flex items-center gap-2 text-base font-bold sm:text-lg">
                <Info class="h-4 w-4 sm:h-5 sm:w-5" />
                System Events (Last 24h)
              </h3>
              <div class="flex flex-wrap gap-1 text-xs sm:gap-2">
                {data.systemEvents?.stats && (
                  <>
                    {data.systemEvents.stats.CRITICAL && (
                      <span class="rounded bg-theme-error/15 px-2 py-1 text-theme-error">
                        {data.systemEvents.stats.CRITICAL} Critical
                      </span>
                    )}
                    {data.systemEvents.stats.ERROR && (
                      <span class="rounded bg-theme-warning/15 px-2 py-1 text-theme-warning">
                        {data.systemEvents.stats.ERROR} Errors
                      </span>
                    )}
                    {data.systemEvents.stats.WARNING && (
                      <span class="rounded bg-theme-warning/15 px-2 py-1 text-theme-warning">
                        {data.systemEvents.stats.WARNING} Warnings
                      </span>
                    )}
                    {data.systemEvents.stats.INFO && (
                      <span class="rounded bg-theme-info/15 px-2 py-1 text-theme-info">
                        {data.systemEvents.stats.INFO} Info
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
            {data.systemEvents?.recent &&
            data.systemEvents.recent.length > 0 ? (
              <div class="max-h-80 space-y-3 overflow-y-auto sm:max-h-96">
                {data.systemEvents.recent.map((event, index) => (
                  <div
                    key={index}
                    class="border-theme-card-border flex flex-col gap-2 border-b pb-3 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-3"
                  >
                    <div class="flex min-w-0 flex-1 items-start gap-2 sm:gap-3">
                      {event.severity === "CRITICAL" && (
                        <AlertTriangle class="mt-1 h-3 w-3 flex-shrink-0 text-theme-error sm:h-4 sm:w-4" />
                      )}
                      {event.severity === "ERROR" && (
                        <AlertTriangle class="mt-1 h-3 w-3 flex-shrink-0 text-theme-warning sm:h-4 sm:w-4" />
                      )}
                      {event.severity === "WARNING" && (
                        <AlertTriangle class="mt-1 h-3 w-3 flex-shrink-0 text-theme-warning sm:h-4 sm:w-4" />
                      )}
                      {event.severity === "INFO" && (
                        <Info class="mt-1 h-3 w-3 flex-shrink-0 text-theme-info sm:h-4 sm:w-4" />
                      )}
                      <div class="min-w-0 flex-1">
                        <div class="text-sm font-medium break-words sm:text-base">
                          {event.title}
                        </div>
                        <div class="text-theme-text-secondary mt-1 text-xs break-words sm:text-sm">
                          {event.message}
                        </div>
                        {event.user && (
                          <div class="text-theme-text-secondary mt-1 text-xs">
                            User:{" "}
                            <span class="truncate">{event.user.email}</span>
                          </div>
                        )}
                        {event.metadata && (
                          <div class="text-theme-text-secondary mt-1 text-xs">
                            <details class="cursor-pointer">
                              <summary>View details</summary>
                              <pre class="bg-theme-card border-theme-card-border mt-1 overflow-x-auto rounded border p-2 text-xs">
                                {typeof event.metadata === "string"
                                  ? JSON.stringify(
                                      JSON.parse(event.metadata),
                                      null,
                                      2,
                                    )
                                  : JSON.stringify(event.metadata, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                    <div class="text-theme-text-secondary flex-shrink-0 text-xs sm:text-right sm:text-sm">
                      {new Date(event.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div class="py-6 text-center sm:py-8">
                <CheckCircle class="mx-auto h-8 w-8 text-theme-success sm:h-12 sm:w-12" />
                <p class="text-theme-text-secondary mt-2 text-sm sm:text-base">
                  No system events in the last 24 hours! 🎉
                </p>
              </div>
            )}
          </div>
        </div>{" "}
        {/* Footer */}
        <div class="px-4 text-center text-xs text-theme-text-muted sm:text-sm">
          <p>
            Last updated: {data.lastUpdated?.toLocaleString()} •{" "}
            {autoRefresh.value ? "Auto-refreshing every 30s" : "Manual refresh"}
          </p>
          <p class="mt-1">
            Environment: {data.system?.environment} • Platform:{" "}
            {data.system?.platform}
          </p>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Health Dashboard - Admin - twink.forsale",
  meta: [
    {
      name: "description",
      content:
        "System health monitoring and performance metrics for twink.forsale",
    },
  ],
};
