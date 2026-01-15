import { component$ } from "@builder.io/qwik";
import { Form, Link, useLocation, routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useSession, useSignIn } from "~/routes/plugin@auth";
import {
  Home,
  Settings,
  User,
  Rocket,
  Heart,
  BarChart3,
  Sparkle,
  Wrench,
  FileText,
  Eye,
  Upload,
  Users,
  Palette,
} from "lucide-icons-qwik";
import { ThemeToggle } from "~/components/ui/theme-toggle";
import { db } from "~/lib/db";
import { getAnalyticsData } from "~/lib/analytics";
export const usePublicStats = routeLoader$(async () => {
  try {
    // Get total counts
    const totalUploads = await db.upload.count();
    const totalViews = await db.upload.aggregate({
      _sum: { views: true },
    });
    const totalUsers = await db.user.count();

    // Get analytics data for the last 7 days
    const analyticsData = await getAnalyticsData(7);

    // Calculate 7-day totals
    const weeklyStats = analyticsData.reduce(
      (acc, day) => ({
        views: acc.views + day.totalViews,
        uploads: acc.uploads + day.uploadsCount,
        users: acc.users + day.usersRegistered,
      }),
      { views: 0, uploads: 0, users: 0 },
    );

    // Get recent upload activity (anonymized)
    const recentUploads = await db.upload.findMany({
      select: {
        id: true,
        createdAt: true,
        mimeType: true,
        views: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return {
      totalUploads,
      totalViews: totalViews._sum.views || 0,
      totalUsers,
      weeklyStats,
      analyticsData,
      recentUploads,
    };
  } catch (error) {
    console.error("Error fetching public stats:", error);
    return {
      totalUploads: 0,
      totalViews: 0,
      totalUsers: 0,
      weeklyStats: { views: 0, uploads: 0, users: 0 },
      analyticsData: [],
      recentUploads: [],
    };
  }
});

export default component$(() => {
  const session = useSession();
  const signIn = useSignIn();
  const loc = useLocation();
  const publicStats = usePublicStats();

  return (
    <>
      {/* Hero Section */}
      <div class="relative overflow-hidden">
        <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-24 lg:px-8">
          {" "}
          <div class="text-center">
            {" "}
            <h1 class="text-theme-text-primary mb-4 text-3xl leading-tight font-bold sm:mb-6 sm:text-4xl md:text-6xl">
              Cute femboy
              <span class="text-gradient-cute block sm:inline">
                {" "}
                File Sharing
              </span>
            </h1>
            <p class="text-theme-text-secondary mx-auto mb-6 max-w-3xl px-2 text-lg sm:mb-8 sm:text-xl">
              Upload and share files with the cutest, most uwu file sharing
              service ever! I made this 80% with ai cuz i could (´｡• ᵕ •｡`) ♡
            </p>
            {session.value ? (
              <div class="flex flex-col items-center justify-center gap-4 px-4 sm:flex-row">
                {" "}
                <Link
                  href="/dashboard"
                  class="btn-cute flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-semibold text-white sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
                >
                  <Home class="h-5 w-5" />
                  Go to Dashboard
                </Link>
                <Link
                  href="/setup/sharex"
                  class="glass text-theme-text-primary hover:bg-gradient-to-br from-theme-accent-primary/10 via-theme-accent-secondary to-theme-accent-tertiary/10 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-semibold transition-all duration-300 sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
                >
                  <Settings class="h-5 w-5" />
                  Setup ShareX
                </Link>
              </div>
            ) : (
              <Form action={signIn} q:slot="end">
                <input type="hidden" name="providerId" value="discord" />
                <input
                  type="hidden"
                  name="options.redirectTo"
                  value={loc.url.pathname + loc.url.search}
                />{" "}
                <button class="btn-cute mx-auto flex w-full max-w-xs items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-semibold text-white sm:w-auto sm:px-8 sm:py-4 sm:text-lg">
                  <User class="h-5 w-5" />
                  Get Started
                </button>
              </Form>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div class="relative py-12 sm:py-24">
        {" "}
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 class="text-theme-text-primary text-gradient-cute mb-4 flex flex-wrap items-center justify-center gap-2 text-center text-2xl font-bold sm:text-3xl">
            Why Choose twink.forsale?
            <Sparkle class="h-6 w-6 sm:h-8 sm:w-8" />
          </h2>
          <p class="text-theme-text-secondary px-4 text-center">
            Because we're the cutest file hosting uwu
          </p>
          <p class="text-theme-text-muted mb-8 px-4 text-center sm:mb-16">
            Do note this is a private/application only site, hit me up on
            discord @akiradev to ask for access
          </p>
          <div class="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
            <div class="card-cute rounded-3xl p-8">
              <div class="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-500">
                <Rocket class="h-8 w-8 text-white" />
              </div>
              <h3 class="text-theme-text-primary mb-3 text-xl font-semibold">
                Femboy Certified ✓
              </h3>{" "}
              <p class="text-theme-text-secondary">
                Gay femboy approved file sharing with a focus on simplicity,
                speed, and maximum cuteness! (◕‿◕)♡
              </p>
            </div>{" "}
            <div class="card-cute rounded-3xl p-8">
              <div class="animation-delay-200 mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-violet-500">
                <Heart class="h-8 w-8 text-white" />
              </div>
              <h3 class="text-theme-text-primary mb-3 text-xl font-semibold">
                Super Secure uwu
              </h3>
              <p class="text-theme-text-secondary">
                Your files are protected with love and care~ (´｡• ᵕ •｡`) ♡
              </p>
            </div>{" "}
            <div class="card-cute rounded-3xl p-8">
              <div class="animation-delay-400 mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500">
                <BarChart3 class="h-8 w-8 text-white" />
              </div>
              <h3 class="text-theme-text-primary mb-3 text-xl font-semibold">
                Analytics & Stats
              </h3>
              <p class="text-theme-text-secondary">
                Track views, manage your uploads, and monitor your storage usage
                with our amazeballs dashboard! (=^･ω･^=)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Stats Section */}
      <div class="relative py-12 sm:py-16">
        {" "}
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 class="text-theme-text-primary text-gradient-cute mb-4 flex flex-wrap items-center justify-center gap-2 text-center text-2xl font-bold sm:text-3xl">
            Platform Activity
            <BarChart3 class="h-6 w-6 sm:h-8 sm:w-8" />
            <Sparkle class="h-5 w-5 sm:h-6 sm:w-6" />
          </h2>
          <p class="text-theme-text-secondary mb-8 px-4 text-center sm:mb-12">
            See how active our twinks are~ (◕‿◕)♡
          </p>

          <div class="mb-8 grid grid-cols-2 gap-4 sm:mb-12 sm:gap-6 md:grid-cols-4">
            {/* Total Stats */}
            <div class="card-cute rounded-3xl p-4 text-center sm:p-6">
              <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-500 sm:mb-4 sm:h-16 sm:w-16">
                <Upload class="h-6 w-6 text-white sm:h-8 sm:w-8" />
              </div>{" "}
              <div class="text-theme-text-primary mb-1 text-lg font-bold sm:text-2xl">
                {publicStats.value.totalUploads.toLocaleString()}
              </div>
              <div class="text-theme-text-secondary text-xs sm:text-sm">
                Total Files
              </div>
            </div>

            <div class="card-cute rounded-3xl p-4 text-center sm:p-6">
              <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-violet-500 sm:mb-4 sm:h-16 sm:w-16">
                <Eye class="h-6 w-6 text-white sm:h-8 sm:w-8" />
              </div>{" "}
              <div class="text-theme-text-primary mb-1 text-lg font-bold sm:text-2xl">
                {publicStats.value.totalViews.toLocaleString()}
              </div>
              <div class="text-theme-text-secondary text-xs sm:text-sm">
                Total Views
              </div>
            </div>

            <div class="card-cute rounded-3xl p-4 text-center sm:p-6">
              <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 sm:mb-4 sm:h-16 sm:w-16">
                <Users class="h-6 w-6 text-white sm:h-8 sm:w-8" />
              </div>{" "}
              <div class="text-theme-text-primary mb-1 text-lg font-bold sm:text-2xl">
                {publicStats.value.totalUsers.toLocaleString()}
              </div>
              <div class="text-theme-text-secondary text-xs sm:text-sm">Twinks</div>
            </div>

            <div class="card-cute rounded-3xl p-4 text-center sm:p-6">
              <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500 sm:mb-4 sm:h-16 sm:w-16">
                <Sparkle class="h-6 w-6 text-white sm:h-8 sm:w-8" />
              </div>{" "}
              <div class="text-theme-text-primary mb-1 text-lg font-bold sm:text-2xl">
                {publicStats.value.weeklyStats.views.toLocaleString()}
              </div>
              <div class="text-theme-text-secondary text-xs sm:text-sm">
                Views (7d)
              </div>
            </div>
          </div>

          {/* Activity Chart */}
          {publicStats.value.analyticsData.length > 0 && (
            <div class="glass mx-auto max-w-4xl rounded-3xl p-4 sm:p-8">
              {" "}
              <h3 class="text-theme-text-primary mb-4 flex items-center justify-center gap-2 text-center text-lg font-bold sm:mb-6 sm:text-xl">
                <BarChart3 class="h-5 w-5" />
                7-Day Activity Overview
              </h3>
              <div class="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
                {/* Mini Activity Charts */}
                <div class="text-center">
                  <div class="text-theme-text-secondary mb-2 text-sm font-medium">
                    Daily Views
                  </div>
                  <div class="flex h-16 items-end justify-center gap-1 sm:h-20">
                    {publicStats.value.analyticsData.map((day, index) => {
                      const maxViews = Math.max(
                        ...publicStats.value.analyticsData.map(
                          (d) => d.totalViews,
                        ),
                        1,
                      );
                      const height = Math.max(
                        (day.totalViews / maxViews) * 100,
                        5,
                      );
                      return (
                        <div
                          key={index}
                          class="w-3 rounded-sm bg-gradient-to-t from-pink-500 to-purple-500 sm:w-4"
                          style={`height: ${height}%`}
                          title={`${day.date}: ${day.totalViews} views`}
                        />
                      );
                    })}
                  </div>{" "}
                  <div class="text-theme-text-primary mt-2 text-lg font-bold">
                    {publicStats.value.weeklyStats.views}
                  </div>
                </div>
                <div class="text-center">
                  <div class="text-theme-text-secondary mb-2 text-sm font-medium">
                    Daily Uploads
                  </div>
                  <div class="flex h-16 items-end justify-center gap-1 sm:h-20">
                    {publicStats.value.analyticsData.map((day, index) => {
                      const maxUploads = Math.max(
                        ...publicStats.value.analyticsData.map(
                          (d) => d.uploadsCount,
                        ),
                        1,
                      );
                      const height = Math.max(
                        (day.uploadsCount / maxUploads) * 100,
                        5,
                      );
                      return (
                        <div
                          key={index}
                          class="w-3 rounded-sm bg-gradient-to-t from-cyan-500 to-blue-500 sm:w-4"
                          style={`height: ${height}%`}
                          title={`${day.date}: ${day.uploadsCount} uploads`}
                        />
                      );
                    })}
                  </div>{" "}
                  <div class="text-theme-text-primary mt-2 text-lg font-bold">
                    {publicStats.value.weeklyStats.uploads}
                  </div>
                </div>
                <div class="text-center">
                  <div class="text-theme-text-secondary mb-2 text-sm font-medium">
                    New Users
                  </div>
                  <div class="flex h-16 items-end justify-center gap-1 sm:h-20">
                    {publicStats.value.analyticsData.map((day, index) => {
                      const maxUsers = Math.max(
                        ...publicStats.value.analyticsData.map(
                          (d) => d.usersRegistered,
                        ),
                        1,
                      );
                      const height = Math.max(
                        (day.usersRegistered / maxUsers) * 100,
                        5,
                      );
                      return (
                        <div
                          key={index}
                          class="w-3 rounded-sm bg-gradient-to-t from-green-500 to-emerald-500 sm:w-4"
                          style={`height: ${height}%`}
                          title={`${day.date}: ${day.usersRegistered} new users`}
                        />
                      );
                    })}
                  </div>{" "}
                  <div class="text-theme-text-primary mt-2 text-lg font-bold">
                    {publicStats.value.weeklyStats.users}
                  </div>
                </div>{" "}
              </div>
            </div>
          )}

          {/* Recent Activity Feed */}
          {publicStats.value.recentUploads.length > 0 && (
            <div class="glass mx-auto mt-8 max-w-2xl rounded-3xl p-4 sm:mt-12 sm:p-6">
              {" "}
              <h3 class="text-theme-text-primary mb-4 flex items-center justify-center gap-2 text-center text-lg font-bold">
                <Sparkle class="h-5 w-5" />
                Recent Activity
              </h3>
              <div class="space-y-3">
                {publicStats.value.recentUploads.map((upload) => {
                  const getFileIcon = (mimeType: string) => {
                    if (mimeType.startsWith("image/")) return "🖼️";
                    if (mimeType.startsWith("video/")) return "🎥";
                    if (mimeType.startsWith("audio/")) return "🎵";
                    if (mimeType.startsWith("text/")) return "📝";
                    return "📄";
                  };

                  const getFileType = (mimeType: string) => {
                    if (mimeType.startsWith("image/")) return "Image";
                    if (mimeType.startsWith("video/")) return "Video";
                    if (mimeType.startsWith("audio/")) return "Audio";
                    if (mimeType.startsWith("text/")) return "Text";
                    return "File";
                  };
                  const timeAgo = (date: Date) => {
                    const now = new Date();
                    const uploadDate = new Date(date);
                    const diffInMinutes = Math.floor(
                      (now.getTime() - uploadDate.getTime()) / (1000 * 60),
                    );

                    if (diffInMinutes < 1) return "Just now";
                    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
                    if (diffInMinutes < 1440)
                      return `${Math.floor(diffInMinutes / 60)}h ago`;
                    return `${Math.floor(diffInMinutes / 1440)}d ago`;
                  };
                  return (
                    <div
                      key={upload.id}
                      class="glass border-theme-card-border flex items-center justify-between rounded-xl border p-3"
                    >
                      <div class="flex items-center gap-3">
                        <span class="text-lg">
                          {getFileIcon(upload.mimeType)}
                        </span>
                        <div>
                          <div class="text-theme-text-primary text-sm font-medium">
                            {getFileType(upload.mimeType)} uploaded
                          </div>{" "}
                          <div class="text-theme-accent-primary text-xs">
                            {timeAgo(upload.createdAt)} • {upload.views} views
                          </div>
                        </div>
                      </div>{" "}
                      <div class="flex items-center gap-1">
                        <Eye class="text-theme-accent-primary h-3 w-3" />
                        <span class="text-theme-accent-primary text-xs">
                          {upload.views}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ShareX Setup Section */}
      <div class="relative py-12 sm:py-24">
        {" "}
        <div class="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 class="text-theme-text-primary text-gradient-cute mb-4 flex flex-wrap items-center justify-center gap-2 text-2xl font-bold sm:text-3xl">
            Super Easy ShareX Setup!
            <Wrench class="h-6 w-6 sm:h-8 sm:w-8" />
            <Sparkle class="h-5 w-5 sm:h-6 sm:w-6" />
          </h2>
          <p class="text-theme-text-secondary mb-8 px-2 text-lg sm:mb-12 sm:text-xl">
            Set up ShareX in seconds with our automatic configuration generator~
            So easy even a catboy could do it! (=^･ω･^=)
          </p>
          <div class="glass rounded-3xl p-4 sm:p-8">
            <div class="grid grid-cols-1 gap-6 text-left sm:gap-8 md:grid-cols-3">
              {" "}
              <div class="flex items-start space-x-3 sm:space-x-4">
                <div class="pulse-soft flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-500 text-base font-bold text-white sm:h-12 sm:w-12 sm:text-lg">
                  1
                </div>
                <div>
                  <h3 class="text-theme-text-primary mb-2 flex items-center gap-2 text-sm font-semibold sm:text-base">
                    <User class="h-4 w-4" />
                    Sign In
                  </h3>
                  <p class="text-theme-text-secondary text-xs sm:text-sm">
                    Create your account with Discord~ It's quick and easy!
                  </p>
                </div>
              </div>
              <div class="flex items-start space-x-3 sm:space-x-4">
                <div class="pulse-soft animation-delay-200 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-violet-500 text-base font-bold text-white sm:h-12 sm:w-12 sm:text-lg">
                  2
                </div>
                <div>
                  <h3 class="text-theme-text-primary mb-2 flex items-center gap-2 text-sm font-semibold sm:text-base">
                    <FileText class="h-4 w-4" />
                    Download Config
                  </h3>
                  <p class="text-theme-text-secondary text-xs sm:text-sm">
                    Get your personalized ShareX configuration file
                  </p>
                </div>
              </div>
              <div class="flex items-start space-x-3 sm:space-x-4">
                <div class="pulse-soft animation-delay-400 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-base font-bold text-white sm:h-12 sm:w-12 sm:text-lg">
                  3
                </div>
                <div>
                  <h3 class="text-theme-text-primary mb-2 flex items-center gap-2 text-sm font-semibold sm:text-base">
                    <Rocket class="h-4 w-4" />
                    Start Sharing!
                  </h3>
                  <p class="text-theme-text-secondary text-xs sm:text-sm">
                    Upload files instantly with ShareX uwu
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Showcase Section */}
      <div class="relative py-12 sm:py-16">
        {" "}
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 class="text-theme-text-primary text-gradient-cute mb-4 flex flex-wrap items-center justify-center gap-2 text-center text-2xl font-bold sm:text-3xl">
            Customize Your Experience
            <Palette class="h-6 w-6 sm:h-8 sm:w-8" />
            <Sparkle class="h-5 w-5 sm:h-6 sm:w-6" />
          </h2>
          <p class="text-theme-text-secondary mb-8 px-4 text-center sm:mb-12">
            Choose from multiple adorable themes to match your mood~ (◕‿◕)♡
          </p>

          <div class="mx-auto max-w-4xl">
            <div class="glass rounded-3xl p-6 sm:p-8">
              {" "}
              <div class="mb-6 text-center">
                <h3 class="text-theme-text-primary mb-2 text-lg font-bold sm:text-xl">
                  Try Different Themes!
                </h3>
                <p class="text-theme-text-secondary text-sm sm:text-base">
                  Click the theme selector below to see how cute each theme
                  looks~ ✨
                </p>
              </div>{" "}
              <div class="relative z-10 flex justify-center">
                <ThemeToggle
                  variant="dropdown"
                  showLabel={true}
                  class="scale-110"
                />
              </div>{" "}
              <div class="relative z-0 mt-6 grid grid-cols-2 gap-4 text-center md:grid-cols-3">
                <div class="glass rounded-xl p-4">
                  <div class="mx-auto mb-2 h-8 w-8 rounded-full bg-gradient-to-br from-slate-800 to-slate-900"></div>
                  <div class="text-theme-text-secondary text-xs">Dark Theme</div>
                  <div class="text-theme-text-muted text-xs">Classic & sleek</div>
                </div>
                <div class="glass rounded-xl p-4">
                  <div class="mx-auto mb-2 h-8 w-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500"></div>
                  <div class="text-theme-text-secondary text-xs">Light Theme</div>
                  <div class="text-theme-text-muted text-xs">Clean & bright</div>
                </div>
                <div class="glass rounded-xl p-4">
                  <div class="mx-auto mb-2 h-8 w-8 rounded-full bg-gradient-to-br from-pink-300 to-purple-400"></div>
                  <div class="text-theme-text-secondary text-xs">Pastel Theme</div>
                  <div class="text-theme-text-muted text-xs">Soft & dreamy</div>
                </div>
                <div class="glass rounded-xl p-4">
                  <div class="mx-auto mb-2 h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-violet-600"></div>
                  <div class="text-theme-text-secondary text-xs">Neon Theme</div>
                  <div class="text-theme-text-muted text-xs">Cyberpunk vibes</div>
                </div>
                <div class="glass rounded-xl p-4">
                  <div class="mx-auto mb-2 h-8 w-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-600"></div>
                  <div class="text-theme-text-secondary text-xs">
                    Valentine Theme
                  </div>
                  <div class="text-theme-text-muted text-xs">Romantic pink</div>
                </div>
                <div class="glass rounded-xl p-4">
                  <div class="mx-auto mb-2 h-8 w-8 rounded-full bg-gradient-to-br from-slate-500 to-slate-600"></div>
                  <div class="text-theme-text-secondary text-xs">Auto Theme</div>
                  <div class="text-theme-text-muted text-xs">Follows system</div>
                </div>
              </div>
              <div class="mt-6 text-center">
                <p class="text-theme-text-muted text-xs">
                  Your theme preference is saved automatically and syncs across
                  all your devices~ 💫
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

export const head: DocumentHead = {
  title: "twink.forsale - Cutest File Sharing Ever! 💕",
  meta: [
    {
      name: "description",
      content:
        "The most amazing file sharing service! Upload and share files with adorable ShareX integration. Made with love by femboys for everyone~ uwu",
    },
    {
      name: "viewport",
      content: "width=device-width, initial-scale=1.0",
    },
    {
      property: "og:title",
      content: "twink.forsale - Cutest File Sharing Ever! 💕",
    },
    {
      property: "og:description",
      content:
        "The most mrrrp file sharing service! Upload and share files with adorable ShareX integration uwu",
    },
  ],
};
