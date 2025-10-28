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
import { createSystemEvent } from "~/lib/system-events";
import { ImagePreviewContext } from "~/lib/image-preview-store";
import { AnalyticsChart } from "~/components/charts/analytics-chart";
import { db } from "~/lib/db";
import { getEnvConfig } from "~/lib/env";
import { getUserAnalytics } from "~/lib/analytics";
import { formatBytes } from "~/lib/utils";
export const useUserData = routeLoader$(async (requestEvent) => {
  // Import server-side dependencies inside the loader

  const session = requestEvent.sharedMap.get("session");

  if (!session?.user?.email) {
    throw requestEvent.redirect(302, "/");
  }

  // Get environment configuration for storage limits
  const config = getEnvConfig();
  // Find or create user
  let user = await db.user.findUnique({
    where: { email: session.user.email },
    include: {
      uploads: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      apiKeys: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      },
      bioLinks: {
        where: { isActive: true },
        orderBy: { order: "asc" },
      },
      settings: true, // Include user settings
    },
  });
  if (!user) {
    user = await db.user.create({
      data: {
        email: session.user.email,
        name: session.user.name || null,
        image: session.user.image || null,
        settings: {
          create: {} // Create default settings
        }
      },
      include: {
        uploads: true,
        apiKeys: true,
        bioLinks: true,
        settings: true,
      },
    });

    // Send notification for new user registration
    try {
      await createSystemEvent(
        "USER_REGISTRATION",
        "INFO",
        "New User Registration",
        `New user registered: ${user.email}`,
        {
          userId: user.id,
          metadata: {
            name: user.name,
            provider: "Discord", // Since this app only uses Discord OAuth
            registrationDate: new Date().toISOString(),
          },
        },
      );
    } catch (error) {
      console.error("Failed to send user registration notification:", error);
    }
  }

  // Ensure user has settings (create if missing for existing users)
  if (!user.settings) {
    await db.userSettings.create({
      data: {
        userId: user.id
      }
    });
    // Re-fetch user with settings
    user = await db.user.findUnique({
      where: { id: user.id },
      include: {
        uploads: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        apiKeys: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
        },
        bioLinks: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
        settings: true,
      },
    }) || user;
  }

  // Calculate stats
  const totalUploads = await db.upload.count({
    where: { userId: user.id },
  });

  const totalViews = await db.upload.aggregate({
    where: { userId: user.id },
    _sum: { views: true },
  });
  // Calculate the effective storage limit (user's custom limit or default from env)
  const effectiveStorageLimit =
    user.settings?.maxStorageLimit || config.BASE_STORAGE_LIMIT;

  // Get user analytics for the last 7 days
  const analyticsData = await getUserAnalytics(user.id, 7);

  return {
    user: {
      ...user,
      // Add settings fields at the top level for backward compatibility
      maxFileSize: user.settings ? Number(user.settings.maxFileSize) : 10485760, // Default 10MB
      maxStorageLimit: user.settings?.maxStorageLimit ? Number(user.settings.maxStorageLimit) : null,
      storageUsed: user.settings ? Number(user.settings.storageUsed) : 0,
      uploads: user.uploads.map(upload => ({
        ...upload,
        size: Number(upload.size) // Convert BigInt to number
      }))
    },
    stats: {
      totalUploads,
      totalViews: totalViews._sum.views || 0,
      storageUsed: user.settings ? Number(user.settings.storageUsed) : 0,
      maxStorage: Number(effectiveStorageLimit), // Convert BigInt to number
    },
    analyticsData,
    origin: requestEvent.url.origin,
  };
});

export default component$(() => {
  const userData = useUserData();
  const imagePreviewStore = useContext(ImagePreviewContext);
  const copyToClipboard = $((shortCode: string) => {
    const url = `${userData.value.origin}/f/${shortCode}`;
    navigator.clipboard.writeText(url);
    // Could add a toast notification here
  });
  const handleImageClick = $((shortCode: string, fileName: string) => {
    const imageUrl = `/f/${shortCode}`;
    imagePreviewStore.openPreview(imageUrl, fileName);
  });
  const formatFileSize = (bytes: number | bigint) => {
    return formatBytes(bytes);
  };

  return (
    <>
      {" "}
      {/* Page Header */}
      <div class="mb-6 text-center sm:mb-8">
        <h1 class="text-gradient-cute mb-3 flex flex-wrap items-center justify-center gap-2 text-3xl font-bold sm:gap-3 sm:text-4xl">
          Welcome back, {userData.value.user.name || "cutie"}!
        </h1>
        <p class="text-theme-text-secondary px-4 text-base sm:text-lg">
          Your cute dashboard is ready~ Manage uploads, API keys, and more!
          (◕‿◕)♡
        </p>
      </div>{" "}
      {/* Account Status Banner */}
      {!userData.value.user.isApproved && (
        <div class="border-theme-accent-secondary bg-theme-secondary/10 text-theme-text-primary mb-6 rounded-xl border p-4 sm:mb-8 sm:p-6">
          <div class="flex items-center justify-center text-center">
            <div>
              <h3 class="mb-2 text-lg font-semibold">
                Account Pending Approval
              </h3>
              <p class="text-theme-text-secondary text-sm">
                Your account is awaiting admin approval. You'll be able to
                upload files and create API keys once approved.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Admin Link */}
      {userData.value.user.isAdmin && (
        <div class="mb-6 text-center sm:mb-8">
          <Link
            href="/admin"
            class="from-theme-accent-tertiary to-theme-accent-quaternary text-theme-text-primary hover:bg-theme-accent-tertiary inline-flex items-center rounded-lg bg-gradient-to-br px-4 py-2 font-medium transition-colors"
          >
            <Settings class="mr-2 h-4 w-4" />
            Admin Dashboard
          </Link>
        </div>
      )}
      {/* Stats Cards */}
      <div class="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-6 md:grid-cols-4">
        {" "}
        <div class="card-cute rounded-3xl p-4 sm:p-6">
          <div class="flex items-center">
            <div class="from-theme-accent-primary to-theme-accent-secondary rounded-full bg-gradient-to-br p-2 sm:p-3">
              <Folder class="text-theme-text-primary h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <div class="ml-3 sm:ml-4">
              <p class="text-theme-text-secondary text-xs font-medium sm:text-sm">
                Total Uploads
              </p>
              <p class="text-theme-text-primary text-lg font-bold sm:text-2xl">
                {userData.value.stats.totalUploads}
              </p>
            </div>
          </div>
        </div>
        <div class="card-cute rounded-3xl p-4 sm:p-6">
          <div class="flex items-center">
            <div class="pulse-soft from-theme-accent-secondary to-theme-accent-tertiary animation-delay-200 rounded-full bg-gradient-to-br p-2 sm:p-3">
              <Eye class="text-theme-text-primary h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <div class="ml-3 sm:ml-4">
              <p class="text-theme-text-secondary text-xs font-medium sm:text-sm">
                Total Views
              </p>
              <p class="text-theme-text-primary text-lg font-bold sm:text-2xl">
                {userData.value.stats.totalViews}
              </p>
            </div>
          </div>
        </div>
        <div class="card-cute rounded-3xl p-4 sm:p-6">
          <div class="flex items-center">
            <div class="pulse-soft from-theme-accent-tertiary to-theme-accent-quaternary animation-delay-400 rounded-full bg-gradient-to-br p-2 sm:p-3">
              <HardDrive class="text-theme-text-primary h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <div class="ml-3 sm:ml-4">
              <p class="text-theme-text-secondary text-xs font-medium sm:text-sm">
                Storage Used
              </p>
              <p class="text-theme-text-primary text-lg font-bold sm:text-2xl">
                {formatFileSize(userData.value.stats.storageUsed)}
              </p>
            </div>
          </div>
        </div>
        <div class="card-cute rounded-3xl p-4 sm:p-6">
          <div class="flex items-center">
            <div class="pulse-soft from-theme-accent-quaternary to-theme-accent-primary animation-delay-600 rounded-full bg-gradient-to-br p-2 sm:p-3">
              <Key class="text-theme-text-primary h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <div class="ml-3 sm:ml-4">
              <p class="text-theme-text-secondary text-xs font-medium sm:text-sm">
                API Keys
              </p>
              <p class="text-theme-text-primary text-lg font-bold sm:text-2xl">
                {userData.value.user.apiKeys.length}
              </p>
            </div>
          </div>
        </div>
      </div>{" "}
      {/* Analytics Section */}
      <div class="mb-6 sm:mb-8">
        <h2 class="text-gradient-cute mb-4 flex items-center justify-center gap-2 text-center text-xl font-bold sm:mb-6 sm:text-2xl">
          <TrendingUp class="text-theme-accent-primary h-5 w-5" />
          Your Analytics - Last 7 Days
        </h2>
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
      </div>
      {/* Quick Actions */}
      <div class="mb-6 sm:mb-8">
        <h2 class="text-gradient-cute mb-4 flex items-center justify-center gap-2 text-center text-xl font-bold sm:mb-6 sm:text-2xl">
          Quick Actions
        </h2>{" "}
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {" "}
          <Link
            href="/dashboard/links"
            class="card-cute group rounded-3xl p-4 sm:p-6"
          >
            <div class="mb-3 flex items-center sm:mb-4">
              <div class="pulse-soft from-theme-accent-secondary to-theme-accent-tertiary animation-delay-200 rounded-full bg-gradient-to-br p-2 sm:p-3">
                <ChainIcon class="text-theme-text-primary h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 class="group-hover:text-gradient-cute text-theme-text-primary ml-2 text-base font-medium transition-all duration-300 sm:ml-3 sm:text-lg">
                Short Links
              </h3>
            </div>
            <p class="text-theme-text-secondary text-xs sm:text-sm">
              Create and manage /l/&lt;code&gt; short URLs with limits and expiry.
            </p>
          </Link>
          <Link
            href="/dashboard/uploads"
            class="card-cute group rounded-3xl p-4 sm:p-6"
          >
            <div class="mb-3 flex items-center sm:mb-4">
              <div class="pulse-soft from-theme-accent-quaternary to-theme-accent-primary rounded-full bg-gradient-to-br p-2 sm:p-3">
                <Upload class="text-theme-text-primary h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 class="group-hover:text-gradient-cute text-theme-text-primary ml-2 text-base font-medium transition-all duration-300 sm:ml-3 sm:text-lg">
                Manage Files
              </h3>
            </div>
            <p class="text-theme-text-secondary text-xs sm:text-sm">
              View and manage your uploaded files with expiration and view
              limits~ (◕‿◕)♡
            </p>
          </Link>
          <Link
            href="/dashboard/api-keys"
            class="card-cute group rounded-3xl p-4 sm:p-6"
          >
            <div class="mb-3 flex items-center sm:mb-4">
              <div class="pulse-soft from-theme-accent-secondary to-theme-accent-tertiary animation-delay-200 rounded-full bg-gradient-to-br p-2 sm:p-3">
                <Key class="text-theme-text-primary h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 class="group-hover:text-gradient-cute text-theme-text-primary ml-2 text-base font-medium transition-all duration-300 sm:ml-3 sm:text-lg">
                API Keys
              </h3>
            </div>
            <p class="text-theme-text-secondary text-xs sm:text-sm">
              Create and manage API keys for ShareX integration~ Keep them safe!
              (◡ ‿ ◡) ♡
            </p>
          </Link>
          <Link
            href="/dashboard/embed"
            class="card-cute group rounded-3xl p-4 sm:p-6"
          >
            <div class="mb-3 flex items-center sm:mb-4">
              <div class="pulse-soft from-theme-accent-tertiary to-theme-accent-quaternary animation-delay-400 rounded-full bg-gradient-to-br p-2 sm:p-3">
                <Share class="text-theme-text-primary h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 class="group-hover:text-gradient-cute text-theme-text-primary ml-2 text-base font-medium transition-all duration-300 sm:ml-3 sm:text-lg">
                Discord Embeds
              </h3>
            </div>{" "}
            <p class="text-theme-text-secondary text-xs sm:text-sm">
              Customize how your uploads appear on Discord and social media~
              Make them extra cute! uwu
            </p>
          </Link>
          <Link
            href="/dashboard/bio"
            class="card-cute group rounded-3xl p-4 sm:p-6"
          >
            <div class="mb-3 flex items-center sm:mb-4">
              <div class="pulse-soft from-theme-accent-primary to-theme-accent-secondary animation-delay-600 rounded-full bg-gradient-to-br p-2 sm:p-3">
                <LinkIcon class="text-theme-text-primary h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 class="group-hover:text-gradient-cute text-theme-text-primary ml-2 text-base font-medium transition-all duration-300 sm:ml-3 sm:text-lg">
                Bio Links
              </h3>
            </div>
            <p class="text-theme-text-secondary text-xs sm:text-sm">
              Create your custom bio link page to share all your important links
              in one place~ ✨
            </p>
          </Link>
          <Link
            href="/dashboard/analytics"
            class="card-cute group rounded-3xl p-4 sm:p-6"
          >
            <div class="mb-3 flex items-center sm:mb-4">
              <div class="pulse-soft from-theme-accent-quaternary to-theme-accent-primary animation-delay-600 rounded-full bg-gradient-to-br p-2 sm:p-3">
                <TrendingUp class="text-theme-text-primary h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 class="group-hover:text-gradient-cute text-theme-text-primary ml-2 text-base font-medium transition-all duration-300 sm:ml-3 sm:text-lg">
                Detailed Analytics
              </h3>
            </div>
            <p class="text-theme-text-secondary text-xs sm:text-sm">
              Deep dive into your file analytics with detailed insights and
              charts~ 📊
            </p>
          </Link>
          <Link
            href="/dashboard/settings"
            class="card-cute group rounded-3xl p-4 sm:p-6"
          >
            <div class="mb-3 flex items-center sm:mb-4">
              <div class="pulse-soft from-theme-accent-quaternary to-theme-accent-primary animation-delay-600 rounded-full bg-gradient-to-br p-2 sm:p-3">
                <Sliders class="text-theme-text-primary h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 class="group-hover:text-gradient-cute text-theme-text-primary ml-2 text-base font-medium transition-all duration-300 sm:ml-3 sm:text-lg">
                Settings
              </h3>
            </div>
            <p class="text-theme-text-secondary text-xs sm:text-sm">
              Configure upload domains, themes, and personalize your experience~
              (◕‿◕)♡
            </p>
          </Link>
          <Link
            href="/setup/sharex"
            class="card-cute group rounded-3xl p-4 sm:p-6"
          >
            <div class="mb-3 flex items-center sm:mb-4">
              <div class="pulse-soft from-theme-accent-quaternary to-theme-accent-primary animation-delay-800 rounded-full bg-gradient-to-br p-2 sm:p-3">
                <Settings class="text-theme-text-primary h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 class="group-hover:text-gradient-cute text-theme-text-primary ml-2 text-base font-medium transition-all duration-300 sm:ml-3 sm:text-lg">
                ShareX Setup
              </h3>
            </div>
            <p class="text-theme-text-secondary text-xs sm:text-sm">
              Download your personalized ShareX configuration~ So easy even a
              sleepy catboy could do it! (=^･ω･^=)
            </p>
          </Link>
        </div>
      </div>{" "}
      {/* Recent Uploads */}
      <div class="card-cute rounded-3xl p-4 sm:p-6">
        <h2 class="text-gradient-cute mb-4 flex items-center gap-2 text-lg font-bold sm:text-xl">
          Recent Uploads
        </h2>
        {userData.value.user.uploads.length > 0 ? (
          <div class="space-y-3">
            {userData.value.user.uploads.map((upload) => (
              <div
                key={upload.id}
                class="glass flex flex-col space-y-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
              >
                <div class="flex items-center space-x-3">
                  <div class="flex-shrink-0">
                    {upload.mimeType.startsWith("image/") ? (
                      <div
                        class="border-theme-card-border hover:border-theme-accent-primary h-12 w-12 cursor-pointer overflow-hidden rounded-xl border transition-all duration-300"
                        onClick$={() =>
                          handleImageClick(
                            upload.shortCode,
                            upload.originalName,
                          )
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
                    ) : upload.mimeType.startsWith("video/") ? (
                      <div class="pulse-soft from-theme-accent-primary to-theme-accent-secondary flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br">
                        <div class="text-lg">🎬</div>
                      </div>
                    ) : upload.mimeType.startsWith("audio/") ? (
                      <div class="pulse-soft from-theme-accent-secondary to-theme-accent-tertiary flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br">
                        <div class="text-lg">🎵</div>
                      </div>
                    ) : upload.mimeType.includes("pdf") ? (
                      <div class="pulse-soft from-theme-accent-tertiary to-theme-accent-quaternary flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br">
                        <div class="text-lg">📄</div>
                      </div>
                    ) : upload.mimeType.includes("zip") ||
                      upload.mimeType.includes("rar") ||
                      upload.mimeType.includes("archive") ? (
                      <div class="pulse-soft from-theme-accent-quaternary to-theme-accent-primary flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br">
                        <div class="text-lg">📦</div>
                      </div>
                    ) : upload.mimeType.includes("text") ? (
                      <div class="pulse-soft from-theme-accent-primary to-theme-accent-tertiary flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br">
                        <div class="text-lg">📝</div>
                      </div>
                    ) : (
                      <div class="pulse-soft from-theme-accent-primary to-theme-accent-secondary flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br">
                        <div class="text-lg">📄</div>
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
                    class="text-theme-accent-secondary hover:bg-theme-bg-tertiary/20 hover:text-theme-accent-secondary rounded-full px-3 py-1 text-center text-sm transition-all duration-300"
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
          <div class="py-12 text-center">
            <div class="sparkle mb-4 text-6xl">🌸</div>{" "}
            <p class="text-theme-text-secondary mb-6 text-lg">
              No files yet~ Upload via ShareX or API!
            </p>
            <a
              href="/setup/sharex"
              class="btn-cute text-theme-text-primary inline-block rounded-full px-6 py-3 font-medium"
            >
              Setup ShareX to get started 🚀
            </a>
          </div>
        )}
      </div>
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
