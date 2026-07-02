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
import { PageHeader, StatCard } from "~/components/ui";
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
        subtitle="Complete analytics for all your files and activity~ ✨"
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
      <div class="card-cute mb-6 rounded-2xl p-6">
        <h3 class="text-gradient-cute mb-4 flex items-center gap-2 text-lg font-bold">
          <BarChart3 class="h-5 w-5" />
          Your Activity (30 Days)
        </h3>{" "}
        <DetailedAnalyticsChart
          data={data.value.userAnalytics}
          metric="totalViews"
          colorTheme="primary"
          height={250}
        />
      </div>

      {/* Top Performing Files */}
      <div class="card-cute rounded-2xl p-6">
        <h3 class="text-gradient-cute mb-4 flex items-center gap-2 text-lg font-bold">
          <Zap class="h-5 w-5" />
          Top Performing Files
        </h3>

        {data.value.topUploadsAnalytics.length > 0 ? (
          <div class="space-y-4">
            {data.value.topUploadsAnalytics.map((upload, index) => (
              <div
                key={upload.id}
                class="border-theme-card-border rounded-2xl border p-4 transition-all duration-300 hover:bg-white/5"
              >
                <div class="flex items-center justify-between">
                  <div class="flex min-w-0 flex-1 items-center gap-3">
                    <div class="bg-gradient-to-br from-theme-accent-tertiary to-theme-accent-quaternary text-theme-text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
                      #{index + 1}
                    </div>
                    <div class="min-w-0 flex-1">
                      <h4 class="text-theme-text-primary truncate font-medium">
                        {upload.originalName}
                      </h4>
                      <div class="text-theme-text-secondary flex items-center gap-4 text-sm">
                        <span>{formatFileSize(upload.size)}</span>
                        <span>{upload.mimeType}</span>
                        <span>
                          {new Date(upload.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-6">
                    <div class="text-center">
                      <div class="text-theme-accent-primary font-bold">
                        {upload.views}
                      </div>
                      <div class="text-theme-text-muted text-xs">
                        Total Views
                      </div>
                    </div>
                    <div class="text-center">
                      <div class="text-theme-accent-secondary font-bold">
                        {upload.weeklyViews}
                      </div>
                      <div class="text-theme-text-muted text-xs">
                        7-day Views
                      </div>
                    </div>
                    <div class="text-center">
                      <div class="text-theme-accent-tertiary font-bold">
                        {upload.downloads}
                      </div>
                      <div class="text-theme-text-muted text-xs">Downloads</div>
                    </div>
                    <a
                      href={`/dashboard/analytics/${upload.shortCode}`}
                      class="glass text-theme-text-primary hover:bg-theme-bg-tertiary/20 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors"
                    >
                      <BarChart3 class="h-4 w-4" />
                      Details
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div class="py-8 text-center">
            <div class="mb-4 text-6xl">📊</div>
            <h4 class="text-theme-text-primary mb-2 font-medium">
              No files yet~
            </h4>
            <p class="text-theme-text-secondary">
              Upload some files to see analytics here! ✨
            </p>
          </div>
        )}
      </div>
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
