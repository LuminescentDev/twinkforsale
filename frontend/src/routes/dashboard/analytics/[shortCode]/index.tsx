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
import {
  Button,
  EmptyState,
  PageHeader,
  Panel,
  ProgressBar,
  StatCard,
} from "~/components/ui";

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

  const uniqueVisitors = new Set(
    data.value.viewLogs.map((log) => log.ipAddress).filter(Boolean),
  ).size;
  const downloadRate =
    data.value.totalViews > 0
      ? Math.round((data.value.totalDownloads / data.value.totalViews) * 100)
      : 0;
  const referrerMax = Math.max(...Object.values(data.value.referrerStats), 1);
  const deviceMax = Math.max(...Object.values(data.value.deviceStats), 1);
  const hourlyMax = Math.max(
    ...data.value.hourlyActivity.map((i) => i.count),
    1,
  );

  return (
    <div>
      {/* Back link */}
      <Button
        href="/dashboard/uploads"
        variant="ghost"
        size="sm"
        class="mb-4"
      >
        <ArrowLeft class="h-4 w-4" />
        Back to Files
      </Button>

      <PageHeader
        align="left"
        title="File Analytics~"
        icon={BarChart3}
        subtitle={data.value.upload.originalName}
      >
        <div q:slot="actions" class="flex flex-wrap gap-2">
          <Button variant="glass" onClick$={exportAnalytics}>
            <FileDown class="h-4 w-4" />
            Export Data
          </Button>
          <Button
            href={`${data.value.origin}/f/${data.value.upload.shortCode}`}
            external
          >
            <Eye class="h-4 w-4" />
            View File
          </Button>
        </div>
      </PageHeader>

      <div class="text-theme-text-muted mb-6 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <span>Size: {formatFileSize(data.value.upload.size)}</span>
        <span>Type: {data.value.upload.mimeType}</span>
        <span>Uploaded: {formatDate(data.value.upload.createdAt)}</span>
      </div>

      {/* Key Metrics */}
      <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Eye} accent={0} label="Total Views" value={data.value.totalViews} />
        <StatCard
          icon={Download}
          accent={1}
          label="Downloads"
          value={data.value.totalDownloads}
        />
        <StatCard
          icon={Globe}
          accent={2}
          label="Unique Visitors"
          value={uniqueVisitors}
        />
        <StatCard
          icon={TrendingUp}
          accent={3}
          label="Download Rate"
          value={`${downloadRate}%`}
        />
      </div>

      {/* Additional Insights */}
      <Panel title="Insights & Summary" icon={BarChart3} class="mb-6">
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
      </Panel>

      {/* Charts Section */}
      <div class="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Views Over Time (30 Days)" icon={BarChart3}>
          <DetailedAnalyticsChart
            data={data.value.analytics}
            metric="totalViews"
            colorTheme="primary"
            height={200}
          />
        </Panel>

        <Panel title="Hourly Activity (24h)" icon={Clock}>
          <div class="space-y-2">
            {data.value.hourlyActivity.map((item) => (
              <div key={item.hour} class="flex items-center gap-3">
                <span class="text-theme-text-muted w-12 shrink-0 text-sm">
                  {item.hour.toString().padStart(2, "0")}:00
                </span>
                <ProgressBar value={item.count} max={hourlyMax} class="flex-1" />
                <span class="text-theme-text-primary w-8 shrink-0 text-right text-sm font-medium">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Referrer and Device Stats */}
      <div class="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Traffic Sources" icon={Globe}>
          <div class="space-y-3">
            {Object.entries(data.value.referrerStats)
              .sort(([, a], [, b]) => b - a)
              .map(([source, count]) => (
                <div key={source} class="flex items-center gap-3">
                  <span class="text-theme-text-primary min-w-0 flex-1 truncate font-medium">
                    {source}
                  </span>
                  <ProgressBar
                    value={count}
                    max={referrerMax}
                    tone="accent"
                    class="w-24 shrink-0"
                  />
                  <span class="text-theme-text-primary w-8 shrink-0 text-right text-sm font-bold">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </Panel>

        <Panel title="Device Types" icon={BarChart3}>
          <div class="space-y-3">
            {Object.entries(data.value.deviceStats)
              .sort(([, a], [, b]) => b - a)
              .map(([device, count]) => (
                <div key={device} class="flex items-center gap-3">
                  <div class="text-theme-accent-primary shrink-0">
                    {getDeviceIcon(device)}
                  </div>
                  <span class="text-theme-text-primary min-w-0 flex-1 truncate font-medium">
                    {device}
                  </span>
                  <ProgressBar
                    value={count}
                    max={deviceMax}
                    tone="accent"
                    class="w-24 shrink-0"
                  />
                  <span class="text-theme-text-primary w-8 shrink-0 text-right text-sm font-bold">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </Panel>
      </div>

      {/* Recent Activity */}
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Recent Views" icon={Eye}>
          <div class="max-h-80 space-y-3 overflow-y-auto">
            {data.value.viewLogs.length > 0 ? (
              data.value.viewLogs.map((log, index) => (
                <div
                  key={index}
                  class="border-theme-card-border/60 border-b pb-2 last:border-b-0 last:pb-0"
                >
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-theme-text-primary">{log.ipAddress}</span>
                    <span class="text-theme-text-muted">
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
              <EmptyState icon={Eye} title="No views yet~" />
            )}
          </div>
        </Panel>

        <Panel title="Recent Downloads" icon={Download}>
          <div class="max-h-80 space-y-3 overflow-y-auto">
            {data.value.downloadLogs.length > 0 ? (
              data.value.downloadLogs.map((log, index) => (
                <div
                  key={index}
                  class="border-theme-card-border/60 border-b pb-2 last:border-b-0 last:pb-0"
                >
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-theme-text-primary">{log.ipAddress}</span>
                    <span class="text-theme-text-muted">
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
              <EmptyState icon={Download} title="No downloads yet~" />
            )}
          </div>
        </Panel>
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
