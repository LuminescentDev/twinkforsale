import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useCurrentUser } from "~/routes/layout";
import { api } from "~/lib/api-client";
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
  Image as ImageIcon,
  Video,
  Music,
  File as FileIcon,
} from "lucide-icons-qwik";
import { LoginButton } from "~/components/auth/login-button";
import {
  Button,
  Card,
  Section,
  StatCard,
  ThemeToggle,
} from "~/components/ui";

export const usePublicStats = routeLoader$(async (requestEvent) => {
  const empty = {
    totalUploads: 0,
    totalViews: 0,
    totalUsers: 0,
    weeklyStats: { views: 0, uploads: 0, users: 0 },
    analyticsData: [] as {
      date: string;
      totalViews: number;
      uploadsCount: number;
      usersRegistered: number;
    }[],
    recentUploads: [] as {
      id: string;
      createdAt: string;
      mimeType: string;
      views: number;
    }[],
  };
  const stats = await api.stats
    .public({ cookie: requestEvent.request.headers.get("cookie") })
    .catch(() => null);
  return stats ?? empty;
});

const features = [
  {
    icon: Rocket,
    accent: "from-theme-accent-primary to-theme-accent-secondary",
    title: "Femboy Certified ✓",
    body: "Gay femboy approved file sharing with a focus on simplicity, speed, and maximum cuteness! (◕‿◕)♡",
  },
  {
    icon: Heart,
    accent: "from-theme-accent-secondary to-theme-accent-tertiary",
    title: "Super Secure uwu",
    body: "Your files are protected with love and care~ (´｡• ᵕ •｡`) ♡",
  },
  {
    icon: BarChart3,
    accent: "from-theme-accent-tertiary to-theme-accent-quaternary",
    title: "Analytics & Stats",
    body: "Track views, manage your uploads, and monitor your storage usage with our amazeballs dashboard! (=^･ω･^=)",
  },
];

const themePreviews = [
  { gradient: "from-slate-800 to-slate-900", name: "Dark", desc: "Classic & sleek" },
  { gradient: "from-yellow-400 to-orange-500", name: "Light", desc: "Clean & bright" },
  { gradient: "from-pink-300 to-purple-400", name: "Pastel", desc: "Soft & dreamy" },
  { gradient: "from-pink-500 to-violet-600", name: "Neon", desc: "Cyberpunk vibes" },
  { gradient: "from-rose-400 to-pink-600", name: "Valentine", desc: "Romantic pink" },
  { gradient: "from-slate-500 to-slate-600", name: "Auto", desc: "Follows system" },
];

const setupSteps = [
  {
    icon: User,
    title: "Sign In",
    body: "Create your account with Discord~ It's quick and easy!",
  },
  {
    icon: FileText,
    title: "Download Config",
    body: "Get your personalized ShareX configuration file",
  },
  {
    icon: Rocket,
    title: "Start Sharing!",
    body: "Upload files instantly with ShareX uwu",
  },
];

export default component$(() => {
  const user = useCurrentUser();
  const publicStats = usePublicStats();

  return (
    <>
      {/* Hero */}
      <div class="py-10 text-center sm:py-20">
        <h1 class="text-theme-text-primary mb-4 text-3xl leading-tight font-bold sm:mb-6 sm:text-5xl md:text-6xl">
          Cute femboy
          <span class="text-gradient-cute block sm:inline"> File Sharing</span>
        </h1>
        <p class="text-theme-text-secondary mx-auto mb-8 max-w-3xl text-lg sm:text-xl">
          Upload and share files with the cutest, most uwu file sharing service
          ever! I made this 80% with ai cuz i could (´｡• ᵕ •｡`) ♡
        </p>
        {user.value ? (
          <div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button href="/dashboard" size="lg" class="w-full sm:w-auto">
              <Home class="h-5 w-5" />
              Go to Dashboard
            </Button>
            <Button
              href="/setup/sharex"
              variant="glass"
              size="lg"
              class="w-full sm:w-auto"
            >
              <Settings class="h-5 w-5" />
              Setup ShareX
            </Button>
          </div>
        ) : (
          <LoginButton
            class="btn-cute mx-auto flex w-full max-w-xs items-center justify-center gap-2 rounded-full px-8 py-4 text-lg font-semibold text-white sm:w-auto"
            iconClass="h-5 w-5"
            label="Get Started"
          />
        )}
      </div>

      {/* Features */}
      <Section class="py-10 sm:py-16">
        <h2 class="text-gradient-cute mb-3 flex flex-wrap items-center justify-center gap-2 text-center text-2xl font-bold sm:text-3xl">
          Why Choose twink.forsale?
          <Sparkle class="h-6 w-6 sm:h-8 sm:w-8" />
        </h2>
        <p class="text-theme-text-secondary text-center">
          Because we're the cutest file hosting uwu
        </p>
        <p class="text-theme-text-muted mb-10 text-center">
          Do note this is a private/application only site, hit me up on discord
          @akiradev to ask for access
        </p>
        <div class="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} hover padding="lg">
              <div
                class={`mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${f.accent}`}
              >
                <f.icon class="h-8 w-8 text-white" />
              </div>
              <h3 class="text-theme-text-primary mb-3 text-xl font-semibold">
                {f.title}
              </h3>
              <p class="text-theme-text-secondary">{f.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Platform Stats */}
      <Section class="py-10 sm:py-16">
        <h2 class="text-gradient-cute mb-3 flex flex-wrap items-center justify-center gap-2 text-center text-2xl font-bold sm:text-3xl">
          Platform Activity
          <BarChart3 class="h-6 w-6 sm:h-8 sm:w-8" />
        </h2>
        <p class="text-theme-text-secondary mb-10 text-center">
          See how active our twinks are~ (◕‿◕)♡
        </p>

        <div class="mb-10 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
          <StatCard
            icon={Upload}
            accent={0}
            layout="centered"
            label="Total Files"
            value={publicStats.value.totalUploads.toLocaleString()}
          />
          <StatCard
            icon={Eye}
            accent={1}
            layout="centered"
            label="Total Views"
            value={publicStats.value.totalViews.toLocaleString()}
          />
          <StatCard
            icon={Users}
            accent={2}
            layout="centered"
            label="Twinks"
            value={publicStats.value.totalUsers.toLocaleString()}
          />
          <StatCard
            icon={Sparkle}
            accent={3}
            layout="centered"
            label="Views (7d)"
            value={publicStats.value.weeklyStats.views.toLocaleString()}
          />
        </div>

        {publicStats.value.analyticsData.length > 0 && (
          <Card variant="glass" padding="lg" class="mx-auto max-w-4xl">
            <h3 class="text-theme-text-primary mb-6 flex items-center justify-center gap-2 text-center text-lg font-bold sm:text-xl">
              <BarChart3 class="h-5 w-5" />
              7-Day Activity Overview
            </h3>
            <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
              {(
                [
                  {
                    label: "Daily Views",
                    key: "totalViews" as const,
                    bar: "from-theme-accent-primary to-theme-accent-secondary",
                    total: publicStats.value.weeklyStats.views,
                  },
                  {
                    label: "Daily Uploads",
                    key: "uploadsCount" as const,
                    bar: "from-theme-accent-secondary to-theme-accent-tertiary",
                    total: publicStats.value.weeklyStats.uploads,
                  },
                  {
                    label: "New Users",
                    key: "usersRegistered" as const,
                    bar: "from-theme-accent-tertiary to-theme-accent-quaternary",
                    total: publicStats.value.weeklyStats.users,
                  },
                ]
              ).map((series) => {
                const max = Math.max(
                  ...publicStats.value.analyticsData.map((d) => d[series.key]),
                  1,
                );
                return (
                  <div key={series.key} class="text-center">
                    <div class="text-theme-text-secondary mb-2 text-sm font-medium">
                      {series.label}
                    </div>
                    <div class="flex h-16 items-end justify-center gap-1 sm:h-20">
                      {publicStats.value.analyticsData.map((day, index) => {
                        const height = Math.max((day[series.key] / max) * 100, 5);
                        return (
                          <div
                            key={index}
                            class={`w-3 rounded-sm bg-gradient-to-t sm:w-4 ${series.bar}`}
                            style={`height: ${height}%`}
                            title={`${day.date}: ${day[series.key]}`}
                          />
                        );
                      })}
                    </div>
                    <div class="text-theme-text-primary mt-2 text-lg font-bold">
                      {series.total}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {publicStats.value.recentUploads.length > 0 && (
          <Card variant="glass" padding="md" class="mx-auto mt-8 max-w-2xl">
            <h3 class="text-theme-text-primary mb-4 flex items-center justify-center gap-2 text-center text-lg font-bold">
              <Sparkle class="h-5 w-5" />
              Recent Activity
            </h3>
            <div class="space-y-3">
              {publicStats.value.recentUploads.map((upload) => {
                const getFileIcon = (mimeType: string) => {
                  if (mimeType.startsWith("image/")) return ImageIcon;
                  if (mimeType.startsWith("video/")) return Video;
                  if (mimeType.startsWith("audio/")) return Music;
                  if (mimeType.startsWith("text/")) return FileText;
                  return FileIcon;
                };
                const getFileType = (mimeType: string) => {
                  if (mimeType.startsWith("image/")) return "Image";
                  if (mimeType.startsWith("video/")) return "Video";
                  if (mimeType.startsWith("audio/")) return "Audio";
                  if (mimeType.startsWith("text/")) return "Text";
                  return "File";
                };
                const timeAgo = (date: string) => {
                  const diffInMinutes = Math.floor(
                    (Date.now() - new Date(date).getTime()) / (1000 * 60),
                  );
                  if (diffInMinutes < 1) return "Just now";
                  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
                  if (diffInMinutes < 1440)
                    return `${Math.floor(diffInMinutes / 60)}h ago`;
                  return `${Math.floor(diffInMinutes / 1440)}d ago`;
                };
                const FileIconCmp = getFileIcon(upload.mimeType);
                return (
                  <div
                    key={upload.id}
                    class="glass border-theme-card-border flex items-center justify-between rounded-xl border p-3"
                  >
                    <div class="flex items-center gap-3">
                      <FileIconCmp class="text-theme-accent-primary h-5 w-5" />
                      <div>
                        <div class="text-theme-text-primary text-sm font-medium">
                          {getFileType(upload.mimeType)} uploaded
                        </div>
                        <div class="text-theme-accent-primary text-xs">
                          {timeAgo(upload.createdAt)} • {upload.views} views
                        </div>
                      </div>
                    </div>
                    <div class="text-theme-accent-primary flex items-center gap-1">
                      <Eye class="h-3 w-3" />
                      <span class="text-xs">{upload.views}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </Section>

      {/* ShareX Setup */}
      <Section class="py-10 sm:py-16">
        <div class="mx-auto max-w-4xl text-center">
          <h2 class="text-gradient-cute mb-3 flex flex-wrap items-center justify-center gap-2 text-2xl font-bold sm:text-3xl">
            Super Easy ShareX Setup!
            <Wrench class="h-6 w-6 sm:h-8 sm:w-8" />
          </h2>
          <p class="text-theme-text-secondary mb-10 text-lg sm:text-xl">
            Set up ShareX in seconds with our automatic configuration generator~
            So easy even a catboy could do it! (=^･ω･^=)
          </p>
          <Card variant="glass" padding="lg">
            <div class="grid grid-cols-1 gap-6 text-left sm:gap-8 md:grid-cols-3">
              {setupSteps.map((step, i) => (
                <div key={step.title} class="flex items-start gap-4">
                  <div class="pulse-soft from-theme-accent-primary to-theme-accent-secondary flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-lg font-bold text-white">
                    {i + 1}
                  </div>
                  <div>
                    <h3 class="text-theme-text-primary mb-2 flex items-center gap-2 font-semibold">
                      <step.icon class="h-4 w-4" />
                      {step.title}
                    </h3>
                    <p class="text-theme-text-secondary text-sm">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Section>

      {/* Theme Showcase */}
      <Section class="py-10 sm:py-16">
        <h2 class="text-gradient-cute mb-3 flex flex-wrap items-center justify-center gap-2 text-center text-2xl font-bold sm:text-3xl">
          Customize Your Experience
          <Palette class="h-6 w-6 sm:h-8 sm:w-8" />
        </h2>
        <p class="text-theme-text-secondary mb-10 text-center">
          Choose from multiple adorable themes to match your mood~ (◕‿◕)♡
        </p>
        <Card variant="glass" padding="lg" class="mx-auto max-w-4xl">
          <div class="mb-6 text-center">
            <h3 class="text-theme-text-primary mb-2 text-lg font-bold sm:text-xl">
              Try Different Themes!
            </h3>
            <p class="text-theme-text-secondary text-sm sm:text-base">
              Click the theme selector below to see how cute each theme looks~
            </p>
          </div>
          <div class="relative z-10 flex justify-center">
            <ThemeToggle variant="dropdown" showLabel={true} class="scale-110" />
          </div>
          <div class="relative z-0 mt-6 grid grid-cols-2 gap-4 text-center md:grid-cols-3">
            {themePreviews.map((t) => (
              <div key={t.name} class="glass rounded-xl p-4">
                <div
                  class={`mx-auto mb-2 h-8 w-8 rounded-full bg-gradient-to-br ${t.gradient}`}
                />
                <div class="text-theme-text-secondary text-xs">{t.name} Theme</div>
                <div class="text-theme-text-muted text-xs">{t.desc}</div>
              </div>
            ))}
          </div>
          <p class="text-theme-text-muted mt-6 text-center text-xs">
            Your theme preference is saved automatically and syncs across all
            your devices~
          </p>
        </Card>
      </Section>
    </>
  );
});

export const head: DocumentHead = {
  title: "twink.forsale - Cutest File Sharing Ever!",
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
      content: "twink.forsale - Cutest File Sharing Ever!",
    },
    {
      property: "og:description",
      content:
        "The most mrrrp file sharing service! Upload and share files with adorable ShareX integration uwu",
    },
  ],
};
