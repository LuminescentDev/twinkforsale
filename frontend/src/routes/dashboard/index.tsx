import { component$, useContext } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import {
  Folder,
  Eye,
  HardDrive,
  Key,
  Flower2,
  Rocket,
  TrendingUp,
  ExternalLink,
} from "lucide-icons-qwik";
import { ImagePreviewContext } from "~/lib/image-preview-store";
import { AnalyticsChart } from "~/components/charts/analytics-chart";
import { FileTypeIcon } from "~/components/file-type-icon";
import { api, serverAuth } from "~/lib/api-client";
import { getCurrentUser } from "~/lib/auth-client";
import { formatBytes } from "~/lib/utils";
import {
  Button,
  Callout,
  CopyButton,
  EmptyState,
  IconButton,
  PageHeader,
  Panel,
  Section,
  StatCard,
} from "~/components/ui";

export const useUserData = routeLoader$(async (requestEvent) => {
  const auth = serverAuth(requestEvent);

  const user = await getCurrentUser(auth);
  if (!user) {
    throw requestEvent.redirect(302, "/");
  }

  // Pull dashboard data from the backend in parallel. Each call degrades
  // gracefully so a single failing endpoint doesn't blank the whole page.
  const [summary, uploadsRes, apiKeysRes, analyticsOverview] =
    await Promise.all([
      api.dashboard.summary(auth).catch(() => null),
      api.dashboard.uploads(auth).catch(() => ({ uploads: [] })),
      api.apiKeys.list(auth).catch(() => ({ apiKeys: [] })),
      api.analytics.overview(auth).catch(() => null),
    ]);

  const uploads = (uploadsRes.uploads ?? []).slice(0, 10);

  return {
    user: {
      name: user.name,
      isApproved: user.isApproved,
      isAdmin: user.isAdmin,
      apiKeys: apiKeysRes.apiKeys ?? [],
      uploads,
    },
    stats: {
      totalUploads: summary?.totalUploads ?? uploads.length,
      totalViews: summary?.totalViews ?? 0,
      storageUsed: summary?.storageUsed ?? 0,
      maxStorage: summary?.storageLimit ?? 0,
    },
    analyticsData: analyticsOverview?.userAnalytics ?? [],
    origin: requestEvent.url.origin,
  };
});

export default component$(() => {
  const userData = useUserData();
  const imagePreviewStore = useContext(ImagePreviewContext);
  const uploads = userData.value.user.uploads;

  return (
    <>
      <PageHeader
        align="left"
        title={`Welcome back, ${userData.value.user.name || "cutie"}!`}
        subtitle="Your cute dashboard is ready~ Manage uploads, API keys, and more! (◕‿◕)♡"
      >
        <div q:slot="actions" class="flex flex-wrap gap-2">
          <Button href="/upload">
            <Rocket class="h-4 w-4" />
            Upload a file
          </Button>
        </div>
      </PageHeader>

      {!userData.value.user.isApproved && (
        <Callout tone="warning" title="Account Pending Approval" class="mb-6 sm:mb-8">
          Your account is awaiting admin approval. You'll be able to upload files
          and create API keys once approved.
        </Callout>
      )}

      {/* Stats */}
      <div class="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-6 md:grid-cols-4">
        <StatCard
          icon={Folder}
          accent={0}
          label="Total Uploads"
          value={userData.value.stats.totalUploads}
        />
        <StatCard
          icon={Eye}
          accent={1}
          pulse
          label="Total Views"
          value={userData.value.stats.totalViews}
        />
        <StatCard
          icon={HardDrive}
          accent={2}
          pulse
          label="Storage Used"
          value={formatBytes(userData.value.stats.storageUsed)}
        />
        <StatCard
          icon={Key}
          accent={3}
          pulse
          label="API Keys"
          value={userData.value.user.apiKeys.length}
        />
      </div>

      {/* Analytics */}
      <Section title="Your Analytics — Last 7 Days" icon={TrendingUp}>
        <div class="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
          <AnalyticsChart
            data={userData.value.analyticsData || []}
            metric="totalViews"
            title="Total Views"
            color="var(--theme-accent-primary)"
          />
          <AnalyticsChart
            data={userData.value.analyticsData || []}
            metric="uniqueViews"
            title="Unique Visitors"
            color="var(--theme-accent-secondary)"
          />
          <AnalyticsChart
            data={userData.value.analyticsData || []}
            metric="uploadsCount"
            title="New Uploads"
            color="var(--theme-accent-tertiary)"
          />
        </div>
      </Section>

      {/* Recent Uploads */}
      <Panel title="Recent Uploads" icon={Folder} flush>
        <Button q:slot="actions" href="/dashboard/uploads" variant="glass" size="sm">
          View all files
        </Button>
        {uploads.length > 0 ? (
          <div class="divide-theme-card-border/60 divide-y">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                class="hover:bg-theme-bg-tertiary/20 flex items-center gap-3 px-4 py-3 transition-colors sm:px-6"
              >
                <FileTypeIcon
                  upload={upload}
                  size="sm"
                  onClick$={() => {
                    if (upload.mimeType.startsWith("image/")) {
                      imagePreviewStore.openPreview(
                        `/f/${upload.shortCode}`,
                        upload.originalName,
                      );
                    }
                  }}
                />
                <div class="min-w-0 flex-1">
                  <p class="text-theme-text-primary truncate text-sm font-medium">
                    {upload.originalName}
                  </p>
                  <p class="text-theme-text-muted text-xs">
                    {upload.views} views •{" "}
                    {new Date(upload.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div class="flex items-center gap-1">
                  <CopyButton
                    value={`${userData.value.origin}/f/${upload.shortCode}`}
                    label="Copy"
                  />
                  <IconButton
                    href={`/f/${upload.shortCode}`}
                    external
                    size="sm"
                    title="Open file"
                  >
                    <ExternalLink class="h-4 w-4" />
                  </IconButton>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Flower2}
            title="No files yet~"
            description="Upload via ShareX or API to see your files here!"
            class="px-4 sm:px-6"
          >
            <Button href="/setup/sharex">
              <Rocket class="h-4 w-4" />
              Setup ShareX to get started
            </Button>
          </EmptyState>
        )}
      </Panel>
    </>
  );
});

export const head: DocumentHead = {
  title: "Dashboard - twink.forsale",
  meta: [
    {
      name: "description",
      content:
        "Your cute dashboard! Manage uploads, API keys, and all your cute files~ uwu",
    },
  ],
};
