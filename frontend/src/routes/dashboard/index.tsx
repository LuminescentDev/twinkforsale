import { component$, $, useContext } from "@builder.io/qwik";
import { routeLoader$, Link } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import {
  Folder,
  Eye,
  HardDrive,
  Key,
  Settings,
  Share,
  File,
  TrendingUp,
  Sliders,
  Upload,
  Link as LinkIcon,
  Link2 as ChainIcon,
} from "lucide-icons-qwik";
import { ImagePreviewContext } from "~/lib/image-preview-store";
import { AnalyticsChart } from "~/components/charts/analytics-chart";
import { api, serverAuth } from "~/lib/api-client";
import { getCurrentUser } from "~/lib/auth-client";
import { formatBytes } from "~/lib/utils";
import {
  Button,
  Callout,
  Card,
  EmptyState,
  PageHeader,
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

const quickActions = [
  {
    href: "/dashboard/links",
    icon: ChainIcon,
    accent: 1,
    title: "Short Links",
    body: "Create and manage /l/<code> short URLs with limits and expiry.",
  },
  {
    href: "/dashboard/uploads",
    icon: Upload,
    accent: 3,
    title: "Manage Files",
    body: "View and manage your uploaded files with expiration and view limits~ (◕‿◕)♡",
  },
  {
    href: "/dashboard/api-keys",
    icon: Key,
    accent: 1,
    title: "API Keys",
    body: "Create and manage API keys for ShareX integration~ Keep them safe! (◡ ‿ ◡) ♡",
  },
  {
    href: "/dashboard/embed",
    icon: Share,
    accent: 2,
    title: "Discord Embeds",
    body: "Customize how your uploads appear on Discord and social media~ Make them extra cute! uwu",
  },
  {
    href: "/dashboard/bio",
    icon: LinkIcon,
    accent: 0,
    title: "Bio Links",
    body: "Create your custom bio link page to share all your important links in one place~ ✨",
  },
  {
    href: "/dashboard/analytics",
    icon: TrendingUp,
    accent: 3,
    title: "Detailed Analytics",
    body: "Deep dive into your file analytics with detailed insights and charts~ 📊",
  },
  {
    href: "/dashboard/settings",
    icon: Sliders,
    accent: 3,
    title: "Settings",
    body: "Configure upload domains, themes, and personalize your experience~ (◕‿◕)♡",
  },
  {
    href: "/setup/sharex",
    icon: Settings,
    accent: 3,
    title: "ShareX Setup",
    body: "Download your personalized ShareX configuration~ So easy even a sleepy catboy could do it! (=^･ω･^=)",
  },
] as const;

const accentGradients = [
  "from-theme-accent-primary to-theme-accent-secondary",
  "from-theme-accent-secondary to-theme-accent-tertiary",
  "from-theme-accent-tertiary to-theme-accent-quaternary",
  "from-theme-accent-quaternary to-theme-accent-primary",
];

export default component$(() => {
  const userData = useUserData();
  const imagePreviewStore = useContext(ImagePreviewContext);
  const copyToClipboard = $((shortCode: string) => {
    const url = `${userData.value.origin}/f/${shortCode}`;
    navigator.clipboard.writeText(url);
  });
  const handleImageClick = $((shortCode: string, fileName: string) => {
    imagePreviewStore.openPreview(`/f/${shortCode}`, fileName);
  });

  return (
    <>
      <PageHeader
        title={`Welcome back, ${userData.value.user.name || "cutie"}!`}
        subtitle="Your cute dashboard is ready~ Manage uploads, API keys, and more! (◕‿◕)♡"
      />

      {!userData.value.user.isApproved && (
        <Callout tone="warning" title="Account Pending Approval" class="mb-6 sm:mb-8">
          Your account is awaiting admin approval. You'll be able to upload files
          and create API keys once approved.
        </Callout>
      )}

      {userData.value.user.isAdmin && (
        <div class="mb-6 text-center sm:mb-8">
          <Button href="/admin" variant="glass" size="sm">
            <Settings class="h-4 w-4" />
            Admin Dashboard
          </Button>
        </div>
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
      <Section title="Your Analytics — Last 7 Days" icon={TrendingUp} align="center">
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

      {/* Quick Actions */}
      <Section title="Quick Actions" align="center">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} class="group">
              <Card hover padding="md" class="h-full">
                <div class="mb-3 flex items-center sm:mb-4">
                  <div
                    class={`pulse-soft rounded-full bg-gradient-to-br p-2 sm:p-3 ${accentGradients[action.accent]}`}
                  >
                    <action.icon class="text-theme-text-primary h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <h3 class="group-hover:text-gradient-cute text-theme-text-primary ml-2 text-base font-medium transition-all duration-300 sm:ml-3 sm:text-lg">
                    {action.title}
                  </h3>
                </div>
                <p class="text-theme-text-secondary text-xs sm:text-sm">
                  {action.body}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </Section>

      {/* Recent Uploads */}
      <Card padding="md">
        <h2 class="text-gradient-cute mb-4 text-lg font-bold sm:text-xl">
          Recent Uploads
        </h2>
        {userData.value.user.uploads.length > 0 ? (
          <div class="space-y-3">
            {userData.value.user.uploads.map((upload) => (
              <div
                key={upload.id}
                class="glass flex flex-col space-y-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
              >
                <div class="flex items-center space-x-3">
                  <div class="flex-shrink-0">
                    {upload.mimeType.startsWith("image/") ? (
                      <div
                        class="border-theme-card-border hover:border-theme-accent-primary h-12 w-12 cursor-pointer overflow-hidden rounded-xl border transition-all duration-300"
                        onClick$={() =>
                          handleImageClick(upload.shortCode, upload.originalName)
                        }
                      >
                        <img
                          src={`/f/${upload.shortCode}`}
                          alt={upload.originalName}
                          class="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                          width="48"
                          height="48"
                        />
                      </div>
                    ) : (
                      <div class="pulse-soft from-theme-accent-primary to-theme-accent-secondary flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br">
                        <div class="text-lg">
                          {upload.mimeType.startsWith("video/")
                            ? "🎬"
                            : upload.mimeType.startsWith("audio/")
                              ? "🎵"
                              : upload.mimeType.includes("pdf")
                                ? "📄"
                                : upload.mimeType.includes("zip") ||
                                    upload.mimeType.includes("rar") ||
                                    upload.mimeType.includes("archive")
                                  ? "📦"
                                  : upload.mimeType.includes("text")
                                    ? "📝"
                                    : "📄"}
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <p class="text-theme-text-primary font-medium">
                      {upload.originalName}
                    </p>
                    <p class="text-theme-text-secondary text-sm">
                      {upload.views} views •{" "}
                      {new Date(upload.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div class="flex space-x-2">
                  <a
                    href={`/f/${upload.shortCode}`}
                    target="_blank"
                    class="text-theme-accent-secondary hover:bg-theme-bg-tertiary/20 rounded-full px-3 py-1 text-center text-sm transition-all duration-300"
                  >
                    View <Eye class="inline h-4 w-4" />
                  </a>
                  <button
                    onClick$={() => copyToClipboard(upload.shortCode)}
                    class="text-theme-accent-tertiary hover:bg-theme-bg-tertiary/20 hover:text-theme-text-primary rounded-full px-3 py-1 text-sm transition-all duration-300"
                  >
                    Copy URL <File class="inline h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            emoji="🌸"
            title="No files yet~"
            description="Upload via ShareX or API to see your files here!"
          >
            <Button href="/setup/sharex">Setup ShareX to get started 🚀</Button>
          </EmptyState>
        )}
      </Card>
    </>
  );
});

export const head: DocumentHead = {
  title: "Dashboard - twink.forsale 💕",
  meta: [
    {
      name: "description",
      content:
        "Your cute dashboard! Manage uploads, API keys, and all your cute files~ uwu",
    },
  ],
};
