import { component$ } from "@builder.io/qwik";
import { routeLoader$, type DocumentHead } from "@builder.io/qwik-city";
import {
  TrendingUp,
  Eye,
  Download,
  BarChart3,
  FileText,
  Zap,
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
  StatCard,
} from "~/components/ui";
export const useAnalyticsOverview = routeLoader$(async (requestEvent) => {
  const auth = serverAuth(requestEvent);
  const user = await getCurrentUser(auth);
  if (!user) {
    throw requestEvent.redirect(302, "/");
  }

  const overview = await api.analytics.overview(auth).catch(() => null);

  return {
    userAnalytics: overview?.userAnalytics ?? [],
    topUploadsAnalytics: overview?.topUploadsAnalytics ?? [],
    summary: {
      totalFiles: overview?.summary.totalFiles ?? 0,
      totalViews: overview?.summary.totalViews ?? 0,
      totalDownloads: overview?.summary.totalDownloads ?? 0,
    },
  };
});

export default component$(() => {
  const data = useAnalyticsOverview();
  const formatFileSize = (bytes: number | bigint) => {
    return formatBytes(bytes);
  };

  return (
    <div>
      <PageHeader
        align="left"
        title="Analytics Overview~"
        icon={TrendingUp}
        subtitle="Complete analytics for all your files and activity~"
      />

      {/* Summary Stats */}
      <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={FileText}
          accent={0}
          label="Total Files"
          value={data.value.summary.totalFiles}
        />
        <StatCard
          icon={Eye}
          accent={1}
          label="Total Views"
          value={data.value.summary.totalViews.toLocaleString()}
        />
        <StatCard
          icon={Download}
          accent={2}
          label="Total Downloads"
          value={data.value.summary.totalDownloads.toLocaleString()}
        />
        <StatCard
          icon={TrendingUp}
          accent={3}
          label="Avg Views/File"
          value={
            data.value.summary.totalFiles > 0
              ? Math.round(
                  data.value.summary.totalViews /
                    data.value.summary.totalFiles,
                )
              : 0
          }
        />
      </div>

      {/* Activity Chart */}
      <Panel
        title="Your Activity (30 Days)"
        icon={BarChart3}
        class="mb-6"
      >
        <DetailedAnalyticsChart
          data={data.value.userAnalytics}
          metric="totalViews"
          colorTheme="primary"
          height={250}
        />
      </Panel>

      {/* Top Performing Files */}
      <Panel title="Top Performing Files" icon={Zap} flush>
        {data.value.topUploadsAnalytics.length > 0 ? (
          <div class="divide-theme-card-border/60 divide-y">
            {data.value.topUploadsAnalytics.map((upload, index) => (
              <div
                key={upload.id}
                class="hover:bg-theme-bg-tertiary/20 flex flex-col gap-3 px-4 py-4 transition-colors sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div class="flex min-w-0 flex-1 items-center gap-3">
                  <div class="from-theme-accent-tertiary to-theme-accent-quaternary flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white">
                    #{index + 1}
                  </div>
                  <div class="min-w-0 flex-1">
                    <h4 class="text-theme-text-primary truncate font-medium">
                      {upload.originalName}
                    </h4>
                    <div class="text-theme-text-muted flex flex-wrap items-center gap-x-3 text-xs">
                      <span>{formatFileSize(upload.size)}</span>
                      <span>{upload.mimeType}</span>
                      <span>
                        {new Date(upload.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-5 sm:gap-6">
                  <div class="text-center">
                    <div class="text-theme-accent-primary font-bold">
                      {upload.views}
                    </div>
                    <div class="text-theme-text-muted text-xs">Views</div>
                  </div>
                  <div class="text-center">
                    <div class="text-theme-accent-secondary font-bold">
                      {upload.weeklyViews}
                    </div>
                    <div class="text-theme-text-muted text-xs">7-day</div>
                  </div>
                  <div class="text-center">
                    <div class="text-theme-accent-tertiary font-bold">
                      {upload.downloads}
                    </div>
                    <div class="text-theme-text-muted text-xs">Downloads</div>
                  </div>
                  <Button
                    href={`/dashboard/analytics/${upload.shortCode}`}
                    variant="glass"
                    size="sm"
                  >
                    <BarChart3 class="h-4 w-4" />
                    Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BarChart3}
            title="No files yet~"
            description="Upload some files to see analytics here!"
            class="px-4 sm:px-6"
          />
        )}
      </Panel>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Analytics Overview~ - twink.forsale",
  meta: [
    {
      name: "description",
      content:
        "Complete analytics overview for all your uploaded files and activity.",
    },
  ],
};
