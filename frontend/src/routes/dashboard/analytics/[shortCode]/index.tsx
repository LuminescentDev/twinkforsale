import { component$, $ } from "@builder.io/qwik";
import { routeLoader$, type DocumentHead } from "@builder.io/qwik-city";
import {
  TrendingUp,
  Eye,
  Download,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  ArrowLeft,
  BarChart3,
  FileDown,
} from "lucide-icons-qwik";
import { DetailedAnalyticsChart } from "~/components/charts/detailed-analytics-chart";
import { api, serverAuth } from "~/lib/api-client";
import { getCurrentUser } from "~/lib/auth-client";
import { formatBytes } from "~/lib/utils";

export const useFileAnalytics = routeLoader$(async (requestEvent) => {
  const auth = serverAuth(requestEvent);
  const shortCode = requestEvent.params.shortCode;

  const user = await getCurrentUser(auth);
  if (!user) {
    throw requestEvent.redirect(302, "/");
  }

  // Detailed per-file analytics (metadata, logs, referrers, devices). The
  // endpoint enforces ownership and 404s for files the user doesn't own.
  const detail = await api.analytics.upload(shortCode, auth).catch(() => null);
  if (!detail) {
    throw requestEvent.redirect(302, "/dashboard/uploads");
  }

  return {
    upload: detail.upload,
    analytics: detail.analytics,
    viewLogs: detail.viewLogs,
    downloadLogs: detail.downloadLogs,
    referrerStats: detail.referrerStats,
    deviceStats: detail.deviceStats,
    hourlyActivity: detail.hourlyActivity,
    totalViews: detail.totalViews,
    totalDownloads: detail.totalDownloads,
    origin: detail.origin || requestEvent.url.origin,
  };
});

export default component$(() => {
  const data = useFileAnalytics();

  const exportAnalytics = $(() => {
    const analyticsData = {
      file: {
        name: data.value.upload.originalName,
        size: data.value.upload.size,
        type: data.value.upload.mimeType,
        uploadedAt: data.value.upload.createdAt,
        shortCode: data.value.upload.shortCode,
      },
      summary: {
        totalViews: data.value.totalViews,
        totalDownloads: data.value.totalDownloads,
        uniqueVisitors: new Set(
          data.value.viewLogs.map((log) => log.ipAddress).filter(Boolean),
        ).size,
        lastViewed: data.value.upload.lastViewed,
      },
      dailyAnalytics: data.value.analytics,
      referrerStats: data.value.referrerStats,
      deviceStats: data.value.deviceStats,
      hourlyActivity: data.value.hourlyActivity,
      recentViews: data.value.viewLogs,
      recentDownloads: data.value.downloadLogs,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(analyticsData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${data.value.upload.shortCode}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString();
  };
  const formatFileSize = (bytes: number | bigint) => {
    return formatBytes(bytes);
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case "Mobile":
        return <Smartphone class="h-5 w-5" />;
      case "Tablet":
        return <Tablet class="h-5 w-5" />;
      case "Desktop":
        return <Monitor class="h-5 w-5" />;
      default:
        return <Globe class="h-5 w-5" />;
    }
  };

  return (
    <div>
      {/* Header */}
      <div class="mb-6">
        <div class="mb-4 flex items-center gap-4">
          <a
            href="/dashboard/uploads"
            class="btn-secondary flex items-center gap-2 text-sm"
          >
            <ArrowLeft class="h-4 w-4" />
            Back to Files
          </a>
        </div>

        <div class="card-cute rounded-2xl p-6">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 class="text-gradient-cute mb-2 flex items-center gap-2 text-2xl font-bold">
                <BarChart3 class="h-6 w-6" />
                File Analytics~
              </h1>
              <p class="text-theme-text-primary mb-1 font-medium">
                {data.value.upload.originalName}
              </p>
              <div class="text-theme-text-secondary flex flex-wrap gap-4 text-sm">
                <span>Size: {formatFileSize(data.value.upload.size)}</span>
                <span>Type: {data.value.upload.mimeType}</span>
                <span>Uploaded: {formatDate(data.value.upload.createdAt)}</span>
              </div>
            </div>
            <div class="flex gap-3">
              <button
                onClick$={exportAnalytics}
                class="btn-secondary flex items-center gap-2"
              >
                <FileDown class="h-4 w-4" />
                Export Data
              </button>
              <a
                href={`${data.value.origin}/f/${data.value.upload.shortCode}`}
                target="_blank"
                class="btn-primary flex items-center gap-2"
              >
                <Eye class="h-4 w-4" />
                View File
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div class="card-cute rounded-2xl p-4">
          <div class="flex items-center gap-3">
            <div class="bg-gradient-to-br from-theme-accent-primary to-theme-accent-secondary rounded-full p-2">
              <Eye class="text-theme-text-primary h-5 w-5" />
            </div>
            <div>
              <p class="text-theme-text-secondary text-sm">Total Views</p>
              <p class="text-theme-text-primary text-xl font-bold">
                {data.value.totalViews}
              </p>
            </div>
          </div>
        </div>
        <div class="card-cute rounded-2xl p-4">
          <div class="flex items-center gap-3">
            <div class="bg-gradient-to-br from-theme-accent-secondary to-theme-accent-tertiary rounded-full p-2">
              <Download class="text-theme-text-primary h-5 w-5" />
            </div>
            <div>
              <p class="text-theme-text-secondary text-sm">Downloads</p>
              <p class="text-theme-text-primary text-xl font-bold">
                {data.value.totalDownloads}
              </p>
            </div>
          </div>
        </div>
        <div class="card-cute rounded-2xl p-4">
          <div class="flex items-center gap-3">
            <div class="bg-gradient-to-br from-theme-accent-quaternary to-theme-accent-primary rounded-full p-2">
              <TrendingUp class="text-theme-text-primary h-5 w-5" />
            </div>
            <div>
              <p class="text-theme-text-secondary text-sm">Unique Visitors</p>
              <p class="text-theme-text-primary text-xl font-bold">
                {
                  new Set(
                    data.value.viewLogs
                      .map((log) => log.ipAddress)
                      .filter(Boolean),
                  ).size
                }
              </p>
            </div>
          </div>
        </div>{" "}
        <div class="card-cute rounded-2xl p-4">
          <div class="flex items-center gap-3">
            <div class="bg-gradient-to-br from-theme-accent-quaternary to-theme-accent-primary rounded-full p-2">
              <TrendingUp class="text-theme-text-primary h-5 w-5" />
            </div>
            <div>
              <p class="text-theme-text-secondary text-sm">Download Rate</p>
              <p class="text-theme-text-primary text-xl font-bold">
                {data.value.totalViews > 0
                  ? Math.round(
                      (data.value.totalDownloads / data.value.totalViews) * 100,
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>{" "}
      </div>

      {/* Additional Insights */}
      <div class="card-cute mb-6 rounded-2xl p-6">
        <h3 class="text-gradient-cute mb-4 flex items-center gap-2 text-lg font-bold">
          <BarChart3 class="h-5 w-5" />
          Insights & Summary
        </h3>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div class="text-center">
            <div class="text-theme-accent-primary text-2xl font-bold">
              {data.value.totalViews > 0
                ? Math.round(
                    (data.value.totalDownloads / data.value.totalViews) * 100,
                  )
                : 0}
              %
            </div>
            <div class="text-theme-text-secondary text-sm">
              Download Conversion Rate
            </div>
          </div>
          <div class="text-center">
            <div class="text-theme-accent-secondary text-2xl font-bold">
              {data.value.analytics.length > 0
                ? Math.round(
                    data.value.analytics.reduce(
                      (sum, day) => sum + day.totalViews,
                      0,
                    ) / data.value.analytics.length,
                  )
                : 0}
            </div>
            <div class="text-theme-text-secondary text-sm">
              Avg. Daily Views (30d)
            </div>
          </div>
          <div class="text-center">
            <div class="text-theme-accent-tertiary text-2xl font-bold">
              {Object.keys(data.value.referrerStats).length}
            </div>
            <div class="text-theme-text-secondary text-sm">Traffic Sources</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div class="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Views Over Time */}
        <div class="card-cute rounded-2xl p-6">
          <h3 class="text-gradient-cute mb-4 flex items-center gap-2 text-lg font-bold">
            <BarChart3 class="h-5 w-5" />
            Views Over Time (30 Days)
          </h3>{" "}
          <DetailedAnalyticsChart
            data={data.value.analytics}
            metric="totalViews"
            colorTheme="primary"
            height={200}
          />
        </div>

        {/* Hourly Activity */}
        <div class="card-cute rounded-2xl p-6">
          <h3 class="text-gradient-cute mb-4 flex items-center gap-2 text-lg font-bold">
            <Clock class="h-5 w-5" />
            Hourly Activity (24h)
          </h3>
          <div class="space-y-2">
            {data.value.hourlyActivity.map((item) => (
              <div key={item.hour} class="flex items-center justify-between">
                <span class="text-theme-text-secondary text-sm">
                  {item.hour.toString().padStart(2, "0")}:00
                </span>
                <div class="mx-3 flex flex-1 items-center gap-2">
                  <div class="bg-theme-card-border h-2 flex-1 overflow-hidden rounded-full">
                    <div
                      class="h-full bg-gradient-to-r from-theme-accent-primary to-theme-accent-secondary transition-all duration-500"
                      style={{
                        width: `${Math.max(item.count * 10, item.count > 0 ? 5 : 0)}%`,
                      }}
                    />
                  </div>
                  <span class="text-theme-text-primary min-w-[2rem] text-right text-sm font-medium">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Referrer and Device Stats */}
      <div class="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Traffic Sources */}
        <div class="card-cute rounded-2xl p-6">
          <h3 class="text-gradient-cute mb-4 flex items-center gap-2 text-lg font-bold">
            <Globe class="h-5 w-5" />
            Traffic Sources
          </h3>
          <div class="space-y-3">
            {Object.entries(data.value.referrerStats)
              .sort(([, a], [, b]) => b - a)
              .map(([source, count]) => (
                <div key={source} class="flex items-center justify-between">
                  <span class="text-theme-text-primary font-medium">
                    {source}
                  </span>
                  <div class="flex items-center gap-2">
                    <div class="bg-theme-card-border h-2 w-24 overflow-hidden rounded-full">
                      <div
                        class="h-full bg-gradient-to-r from-theme-accent-secondary to-theme-accent-tertiary"
                        style={{
                          width: `${(count / Math.max(...Object.values(data.value.referrerStats))) * 100}%`,
                        }}
                      />
                    </div>
                    <span class="text-theme-text-primary min-w-[2rem] text-right text-sm font-bold">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Device Types */}
        <div class="card-cute rounded-2xl p-6">
          {" "}
          <h3 class="text-gradient-cute mb-4 flex items-center gap-2 text-lg font-bold">
            <BarChart3 class="h-5 w-5" />
            Device Types
          </h3>
          <div class="space-y-3">
            {Object.entries(data.value.deviceStats)
              .sort(([, a], [, b]) => b - a)
              .map(([device, count]) => (
                <div key={device} class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class="text-theme-accent-primary">
                      {getDeviceIcon(device)}
                    </div>
                    <span class="text-theme-text-primary font-medium">
                      {device}
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="bg-theme-card-border h-2 w-24 overflow-hidden rounded-full">
                      <div
                        class="h-full bg-gradient-to-r from-theme-accent-tertiary to-theme-accent-quaternary"
                        style={{
                          width: `${(count / Math.max(...Object.values(data.value.deviceStats))) * 100}%`,
                        }}
                      />
                    </div>
                    <span class="text-theme-text-primary min-w-[2rem] text-right text-sm font-bold">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Views */}
        <div class="card-cute rounded-2xl p-6">
          <h3 class="text-gradient-cute mb-4 flex items-center gap-2 text-lg font-bold">
            <Eye class="h-5 w-5" />
            Recent Views
          </h3>
          <div class="max-h-80 space-y-3 overflow-y-auto">
            {data.value.viewLogs.length > 0 ? (
              data.value.viewLogs.map((log, index) => (
                <div
                  key={index}
                  class="border-theme-card-border border-b pb-2 last:border-b-0 last:pb-0"
                >
                  {" "}
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-theme-text-primary">{log.ipAddress}</span>
                    <span class="text-theme-text-secondary">
                      {formatDate(log.viewedAt)}
                    </span>
                  </div>
                  {log.referer && (
                    <p class="text-theme-text-muted mt-1 truncate text-xs">
                      From: {log.referer}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p class="text-theme-text-secondary py-4 text-center">
                No views yet~
              </p>
            )}
          </div>
        </div>

        {/* Recent Downloads */}
        <div class="card-cute rounded-2xl p-6">
          <h3 class="text-gradient-cute mb-4 flex items-center gap-2 text-lg font-bold">
            <Download class="h-5 w-5" />
            Recent Downloads
          </h3>
          <div class="max-h-80 space-y-3 overflow-y-auto">
            {data.value.downloadLogs.length > 0 ? (
              data.value.downloadLogs.map((log, index) => (
                <div
                  key={index}
                  class="border-theme-card-border border-b pb-2 last:border-b-0 last:pb-0"
                >
                  {" "}
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-theme-text-primary">{log.ipAddress}</span>
                    <span class="text-theme-text-secondary">
                      {formatDate(log.downloadedAt)}
                    </span>
                  </div>
                  {log.referer && (
                    <p class="text-theme-text-muted mt-1 truncate text-xs">
                      From: {log.referer}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p class="text-theme-text-secondary py-4 text-center">
                No downloads yet~
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const data = resolveValue(useFileAnalytics);
  return {
    title: `Analytics for ${data.upload.originalName} - twink.forsale`,
    meta: [
      {
        name: "description",
        content: `Detailed analytics for ${data.upload.originalName} including views, downloads, and visitor data.`,
      },
    ],
  };
};
