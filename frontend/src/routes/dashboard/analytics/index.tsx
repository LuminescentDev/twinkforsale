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
import { db } from "~/lib/db";
import { getUploadAnalytics, getUserAnalytics } from "~/lib/analytics";
import { formatBytes } from "~/lib/utils";
export const useAnalyticsOverview = routeLoader$(async (requestEvent) => {
  const session = requestEvent.sharedMap.get("session");

  if (!session?.user?.email) {
    throw requestEvent.redirect(302, "/");
  }

  // Find the user and their uploads
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    include: {
      uploads: {
        orderBy: { views: "desc" },
        take: 10, // Top 10 most viewed files
      },
      settings: true,
    },
  });

  if (!user) {
    throw requestEvent.redirect(302, "/dashboard/uploads");
  }

  // Get user analytics for the last 30 days
  const userAnalytics = await getUserAnalytics(user.id, 30);

  // Get analytics for top files
  const topUploadsAnalytics = await Promise.all(
    user.uploads.map(async (upload) => {
      const analytics = await getUploadAnalytics(upload.id, 7);
      const weeklyViews = analytics.reduce(
        (sum, day) => sum + day.totalViews,
        0,
      );
      const weeklyDownloads = analytics.reduce(
        (sum, day) => sum + day.totalDownloads,
        0,
      );

      return {
        ...upload,
        size: Number(upload.size), // Convert BigInt to number
        analytics,
        weeklyViews,
        weeklyDownloads,
      };
    }),
  );

  // Calculate summary statistics
  const totalFiles = await db.upload.count({
    where: { userId: user.id },
  });

  const totalViews = await db.upload.aggregate({
    where: { userId: user.id },
    _sum: { views: true },
  });

  const totalDownloads = await db.upload.aggregate({
    where: { userId: user.id },
    _sum: { downloads: true },
  });

  return {
    user: {
      ...user,
      maxFileSize: user.settings ? Number(user.settings.maxFileSize) : 10485760, // Convert BigInt to number
      maxStorageLimit: user.settings?.maxStorageLimit ? Number(user.settings.maxStorageLimit) : null, // Convert BigInt to number
      storageUsed: user.settings ? Number(user.settings.storageUsed) : 0, // Convert BigInt to number
      uploads: topUploadsAnalytics // Already converted above
    },
    userAnalytics,
    topUploadsAnalytics,
    summary: {
      totalFiles,
      totalViews: totalViews._sum.views || 0,
      totalDownloads: totalDownloads._sum.downloads || 0,
    },
  };
});

export default component$(() => {
  const data = useAnalyticsOverview();
  const formatFileSize = (bytes: number | bigint) => {
    return formatBytes(bytes);
  };

  return (
    <div class="min-h-screen p-4 sm:p-6">
      {/* Header */}
      <div class="mb-6">
        <div class="card-cute rounded-3xl p-6">
          <h1 class="text-gradient-cute mb-2 text-3xl font-bold">
            Analytics Overview~
          </h1>
          <p class="text-theme-text-secondary">
            Complete analytics for all your files and activity~ ✨
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div class="card-cute rounded-2xl p-4">
          <div class="flex items-center gap-3">
            <div class="bg-gradient-to-br from-theme-accent-primary to-theme-accent-secondary rounded-full p-2">
              <FileText class="text-theme-text-primary h-5 w-5" />
            </div>
            <div>
              <p class="text-theme-text-secondary text-sm">Total Files</p>
              <p class="text-theme-text-primary text-xl font-bold">
                {data.value.summary.totalFiles}
              </p>
            </div>
          </div>
        </div>

        <div class="card-cute rounded-2xl p-4">
          <div class="flex items-center gap-3">
            <div class="bg-gradient-to-br from-theme-accent-secondary to-theme-accent-tertiary rounded-full p-2">
              <Eye class="text-theme-text-primary h-5 w-5" />
            </div>
            <div>
              <p class="text-theme-text-secondary text-sm">Total Views</p>
              <p class="text-theme-text-primary text-xl font-bold">
                {data.value.summary.totalViews.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div class="card-cute rounded-2xl p-4">
          <div class="flex items-center gap-3">
            <div class="bg-gradient-to-br from-theme-accent-tertiary to-theme-accent-quaternary rounded-full p-2">
              <Download class="text-theme-text-primary h-5 w-5" />
            </div>
            <div>
              <p class="text-theme-text-secondary text-sm">Total Downloads</p>
              <p class="text-theme-text-primary text-xl font-bold">
                {data.value.summary.totalDownloads.toLocaleString()}
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
              <p class="text-theme-text-secondary text-sm">Avg Views/File</p>
              <p class="text-theme-text-primary text-xl font-bold">
                {data.value.summary.totalFiles > 0
                  ? Math.round(
                      data.value.summary.totalViews /
                        data.value.summary.totalFiles,
                    )
                  : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Chart */}
      <div class="card-cute mb-6 rounded-3xl p-6">
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
      <div class="card-cute rounded-3xl p-6">
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
                      <div class="text-theme-accent-primary-primary font-bold">
                        {upload.views}
                      </div>
                      <div class="text-theme-text-muted text-xs">
                        Total Views
                      </div>
                    </div>
                    <div class="text-center">
                      <div class="text-theme-accent-primary-secondary font-bold">
                        {upload.weeklyViews}
                      </div>
                      <div class="text-theme-text-muted text-xs">
                        7-day Views
                      </div>
                    </div>
                    <div class="text-center">
                      <div class="text-theme-accent-primary-tertiary font-bold">
                        {upload.downloads}
                      </div>
                      <div class="text-theme-text-muted text-xs">Downloads</div>
                    </div>
                    <a
                      href={`/dashboard/analytics/${upload.shortCode}`}
                      class="btn-secondary flex items-center gap-2 text-sm"
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
