import { component$, useSignal, useResource$, useVisibleTask$, Resource } from "@builder.io/qwik";
import {
  getLanyardData,
  connectLanyardSocket,
  getDiscordAvatarUrl,
  getDiscordGuildIconUrl,
  getDiscordBannerUrl,
  formatActivityType,
  getStatusColor,
  getStatusText,
  getUserBadges,
} from "~/lib/discord";
import { Gamepad2, Eye, Zap, Trophy, Music } from "lucide-icons-qwik";

export interface DiscordProfileProps {
  discordId: string;
  config?: {
    showAvatar?: boolean;
    showStatus?: boolean;
    showActivity?: boolean;
    showSpotify?: boolean;
    showBadges?: boolean;
    showGuild?: boolean;
    useFallbackPolling?: boolean; // fallback to HTTP polling if WebSocket fails
  };
  class?: string;
}

export const DiscordProfile = component$<DiscordProfileProps>(
  ({ discordId, config = {}, class: className = "" }) => {
    const currentTime = useSignal(Date.now());
    
    const {
      showAvatar = true,
      showStatus = true,
      showActivity = true,
      showSpotify = true,
      showBadges = true,
      showGuild = true,
      useFallbackPolling = false,
    } = config;// Use useResource$ for non-blocking data fetching
    const lanyardResource = useResource$(async ({ cleanup }) => {
      try {
        console.log("Fetching Lanyard data for:", discordId);
        
        // Initial data fetch
        const data = await getLanyardData(discordId);
        
        if (data?.success) {          // Set up WebSocket for real-time updates if not using fallback polling
          if (!useFallbackPolling) {
            try {
              const wsCleanup = connectLanyardSocket(
                discordId,
                (data) => {
                  // Handle real-time WebSocket updates
                  console.log("WebSocket update received:", data);
                },
                (error) => {
                  console.warn("WebSocket error:", error);
                }
              );

              // Set up cleanup for WebSocket connection
              cleanup(() => {
                console.log("Cleaning up WebSocket connection");
                wsCleanup();
              });
            } catch (wsError) {
              console.warn("Failed to establish WebSocket connection:", wsError);
            }
          }
          
          return data;
        } else {
          throw new Error(data?.error || "Failed to fetch Discord data");
        }
      } catch (error) {
        console.warn("Failed to fetch Lanyard data:", error);
        throw error;
      }
    });

    // Update current time every second for Spotify progress
    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(() => {
      const timeInterval = setInterval(() => {
        currentTime.value = Date.now();
      }, 1000);

      return () => {
        clearInterval(timeInterval);
      };
    });    return (
      <Resource
        value={lanyardResource}
        onPending={() => (
          <div
            class={`animate-pulse rounded-lg bg-[#5865f2]/10 p-4 ${className}`}
          >
            <div class="flex items-center space-x-3">
              <div class="h-12 w-12 rounded-full bg-[#5865f2]/20"></div>
              <div class="flex-1 space-y-2">
                <div class="h-4 w-24 rounded bg-[#5865f2]/20"></div>
                <div class="h-3 w-16 rounded bg-[#5865f2]/20"></div>
              </div>
            </div>
          </div>
        )}
        onRejected={() => (
          <div class={`rounded-lg bg-red-500/10 p-4 text-red-400 ${className}`}>
            <p class="mb-2 text-sm font-medium">Discord Profile Unavailable</p>
            <p class="text-xs text-red-300">
              Failed to load Discord data. The user might be offline or have privacy settings enabled.
            </p>
          </div>
        )}
        onResolved={(lanyardData) => {
          if (!lanyardData?.success || !lanyardData.data) {
            return (
              <div class={`rounded-lg bg-red-500/10 p-4 text-red-400 ${className}`}>
                <p class="mb-2 text-sm font-medium">Discord Profile Unavailable</p>
                <p class="text-xs text-red-300">No Discord data available.</p>
              </div>
            );
          }

          const { data } = lanyardData;
          const user = data.discord_user;
          const avatarUrl = getDiscordAvatarUrl(user.id, user.avatar, 128);
          const statusColor = getStatusColor(data.discord_status);
          const statusText = getStatusText(data.discord_status);
          
          // Get all activities excluding Spotify and custom status
          const activities = data.activities.filter(
            (activity: any) => activity.type !== 2 && activity.type !== 4,
          );

          // Get custom status
          const customStatus = data.activities.find(
            (activity: any) => activity.type === 4,
          );
          
          // Get user badges
          const allBadges = getUserBadges(user.public_flags);

          // Generate banner URL from user banner or fallback to DSTN proxy
          const getBannerUrl = (user: any): string | null => {
            if (user.banner) {
              const format = user.banner.startsWith("a_") ? "gif" : "png";
              return `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.${format}?size=600`;
            }
            // Use DSTN proxy as fallback for users who might have banners not detected by Lanyard
            return getDiscordBannerUrl(user.id);
          };

          const bannerUrl = getBannerUrl(user);

          // Generate avatar decoration URL
          const getAvatarDecorationUrl = (decoration?: any): string | null => {
            if (!decoration) return null;
            return `https://cdn.discordapp.com/avatar-decoration-presets/${decoration.asset}.png`;
          };

          const avatarDecorationUrl = getAvatarDecorationUrl(
            user.avatar_decoration_data,
          );

          return (
            <div
              class={`discord-profile-card overflow-hidden rounded-2xl border border-white/10 bg-[#2f3136] shadow-2xl ${className}`}
            >
              {/* Banner */}
              <div class="relative h-24 overflow-hidden">
                {bannerUrl ? (
                  <img
                    src={bannerUrl}
                    alt="Discord banner"
                    class="h-full w-full object-cover"
                    width={600}
                    height={240}
                    onError$={(e) => {
                      // If the DSTN banner fails to load, fall back to gradient
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent) {
                        const fallbackDiv = document.createElement("div");
                        fallbackDiv.className = "h-full w-full";
                        fallbackDiv.style.background = user.accent_color
                          ? `#${user.accent_color.toString(16).padStart(6, "0")}`
                          : "linear-gradient(135deg, #5865f2, #7289da)";
                        parent.appendChild(fallbackDiv);
                      }
                    }}
                  />
                ) : (
                  <div
                    class="h-full w-full"
                    style={{
                      background: user.accent_color
                        ? `#${user.accent_color.toString(16).padStart(6, "0")}`
                        : "linear-gradient(135deg, #5865f2, #7289da)",
                    }}
                  />
                )}
              </div>
              {/* Profile Picture positioned between banner and content */}
              {showAvatar && (
                <div class="relative -mt-8 mb-4 flex justify-start pl-6">
                  <div class="relative h-20 w-20">
                    {/* Avatar Decoration Background */}
                    {avatarDecorationUrl && (
                      <img
                        src={avatarDecorationUrl}
                        alt="Avatar decoration"
                        class="absolute inset-0 z-20 h-20 w-20 object-contain"
                        width={80}
                        height={80}
                      />
                    )}

                    {/* Main Avatar */}
                    <img
                      src={avatarUrl}
                      alt={`${user.global_name || user.username}'s avatar`}
                      class="absolute top-1/2 left-1/2 z-10 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-[#2f3136] bg-[#2f3136]"
                      width={64}
                      height={64}
                    />

                    {/* Status indicator */}
                    {showStatus && (
                      <div
                        class="absolute right-1 bottom-1 z-30 h-5 w-5 rounded-full border-2 border-[#2f3136]"
                        style={{ backgroundColor: statusColor }}
                        title={statusText}
                      />
                    )}
                  </div>
                  {/* Custom Status Bubble positioned next to avatar */}
                  {customStatus && (
                    <div class="absolute top-2 left-28">
                      <div class="relative rounded-2xl bg-[#36393f] px-3 py-2 before:absolute before:top-3 before:-left-2 before:h-4 before:w-4 before:rotate-45 before:bg-[#36393f] before:content-['']">
                        <div class="flex items-center gap-2 text-sm whitespace-nowrap">
                          {customStatus.emoji && (
                            <span class="text-base">
                              {customStatus.emoji.id ? (
                                <img
                                  src={`https://cdn.discordapp.com/emojis/${customStatus.emoji.id}.${
                                    customStatus.emoji.animated ? "gif" : "png"
                                  }?size=20`}
                                  width={20}
                                  height={20}
                                  alt={customStatus.emoji.name}
                                  class="inline"
                                />
                              ) : (
                                customStatus.emoji.name
                              )}
                            </span>
                          )}
                          <span class="text-gray-300">
                            {customStatus.state || "Custom Status"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* Profile Content */}
              <div class="px-6 pb-6">
                {/* Display Name */}
                <div class="mb-0.5">
                  <h2 class="text-xl font-bold text-white">
                    {user.global_name || user.display_name || user.username}
                  </h2>
                </div>
                {/* Username & Primary Guild */}
                <div class="mb-2 flex items-center gap-2 text-sm text-gray-300">
                  <span>@{user.username}</span>
                  {/* Add pronouns here if available in user data */}
                  <span class="text-gray-500">•</span>
                  <span class="text-gray-400">{statusText}</span>
                  {showGuild &&
                    user.primary_guild &&
                    user.primary_guild.identity_enabled && (
                      <>
                        <span class="text-gray-500">•</span>
                        <div class="flex items-center gap-1">
                          {user.primary_guild.badge && (
                            <img
                              src={getDiscordGuildIconUrl(
                                user.primary_guild.identity_guild_id,
                                user.primary_guild.badge,
                                16,
                              )}
                              alt={`${user.primary_guild.tag} guild icon`}
                              class="h-4 w-4 rounded-full"
                              width={16}
                              height={16}
                            />
                          )}
                          <span class="font-medium text-white">
                            {user.primary_guild.tag}
                          </span>
                        </div>
                      </>
                    )}
                </div>
                {/* Badges */}
                {showBadges && allBadges.length > 0 && (
                  <div class="mb-3 flex flex-wrap gap-1">
                    {allBadges.map((badge, index) => (
                      <div
                        key={index}
                        class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs"
                        style={{ backgroundColor: `${badge.color}20` }}
                        title={badge.description}
                      >
                        <span class="text-sm">{badge.icon}</span>
                        <span class="text-gray-300">{badge.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                {/* Activities */}
                {showActivity && activities.length > 0 && (
                  <div class="space-y-3">
                    {activities.map((activity: any, index: number) => (
                      <div key={index} class="rounded-lg bg-[#36393f] p-3">
                        <div class="flex items-start gap-3">
                          {/* Activity Image */}
                          {activity.assets?.large_image && (
                            <div class="relative h-12 w-12 flex-shrink-0">
                              <img
                                src={
                                  activity.assets.large_image.startsWith("mp:")
                                    ? `https://media.discordapp.net/${activity.assets.large_image.slice(3)}`
                                    : `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.large_image}.png`
                                }
                                alt={activity.assets.large_text || activity.name}
                                class="h-12 w-12 rounded-lg"
                                width={48}
                                height={48}
                              />
                              {activity.assets?.small_image && (
                                <img
                                  src={
                                    activity.assets.small_image.startsWith("mp:")
                                      ? `https://media.discordapp.net/${activity.assets.small_image.slice(3)}`
                                      : `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.small_image}.png`
                                  }
                                  alt={activity.assets.small_text || "Status"}
                                  class="absolute -right-1 -bottom-1 h-6 w-6 rounded-full border-2 border-[#36393f]"
                                  width={24}
                                  height={24}
                                />
                              )}
                            </div>
                          )}

                          {/* Activity Content */}
                          <div class="min-w-0 flex-1">
                            <div class="mb-1 flex items-center gap-2">
                              {activity.type === 0 && (
                                <Gamepad2 class="h-4 w-4 text-green-400" />
                              )}
                              {activity.type === 1 && (
                                <Zap class="h-4 w-4 text-purple-400" />
                              )}
                              {activity.type === 3 && (
                                <Eye class="h-4 w-4 text-blue-400" />
                              )}
                              {activity.type === 5 && (
                                <Trophy class="h-4 w-4 text-yellow-400" />
                              )}
                              <span class="text-xs font-medium tracking-wider text-gray-400 uppercase">
                                {formatActivityType(activity.type)}
                              </span>
                            </div>

                            <h4 class="mb-1 text-sm font-semibold text-white">
                              {activity.name}
                            </h4>

                            {activity.details && (
                              <p class="mb-1 text-xs text-gray-300">
                                {activity.details}
                              </p>
                            )}

                            {activity.state && (
                              <p class="text-xs text-gray-400">{activity.state}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Spotify */}
                {showSpotify && data.listening_to_spotify && data.spotify && (
                  <div class="mt-3 rounded-lg border border-[#1db954]/20 bg-[#1db954]/10 p-3">
                    <div class="flex items-start gap-3">
                      {data.spotify.album_art_url && (
                        <img
                          src={data.spotify.album_art_url}
                          alt={`${data.spotify.album} cover`}
                          class="h-12 w-12 flex-shrink-0 rounded-lg"
                          width={48}
                          height={48}
                        />
                      )}

                      <div class="min-w-0 flex-1">
                        <div class="mb-1 flex items-center gap-2">
                          <Music class="h-4 w-4 text-[#1db954]" />
                          <span class="text-xs font-medium tracking-wider text-[#1db954] uppercase">
                            Listening to Spotify
                          </span>
                        </div>

                        <h4 class="mb-1 truncate text-sm font-semibold text-white">
                          {data.spotify.song}
                        </h4>

                        <p class="mb-1 truncate text-xs text-gray-300">
                          by {data.spotify.artist}
                        </p>

                        {data.spotify.album && (
                          <p class="truncate text-xs text-gray-400">
                            on {data.spotify.album}
                          </p>
                        )}

                        {data.spotify.timestamps && (
                          <div class="mt-2 space-y-1">
                            <div class="flex justify-between text-xs text-gray-400">
                              <span>
                                {Math.floor(
                                  Math.min(
                                    currentTime.value - data.spotify.timestamps.start,
                                    data.spotify.timestamps.end -
                                      data.spotify.timestamps.start,
                                  ) /
                                    1000 /
                                    60,
                                )}
                                :
                                {String(
                                  Math.floor(
                                    (Math.min(
                                      currentTime.value -
                                        data.spotify.timestamps.start,
                                      data.spotify.timestamps.end -
                                        data.spotify.timestamps.start,
                                    ) /
                                      1000) %
                                      60,
                                  ),
                                ).padStart(2, "0")}
                              </span>
                              <span>
                                {Math.floor(
                                  (data.spotify.timestamps.end -
                                    data.spotify.timestamps.start) /
                                    1000 /
                                    60,
                                )}
                                :
                                {String(
                                  Math.floor(
                                    ((data.spotify.timestamps.end -
                                      data.spotify.timestamps.start) /
                                      1000) %
                                      60,
                                  ),
                                ).padStart(2, "0")}
                              </span>
                            </div>
                            <div class="h-1.5 w-full rounded-full bg-gray-700">
                              <div
                                class="h-1.5 rounded-full bg-[#1db954] transition-all duration-500"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.max(
                                      0,
                                      ((currentTime.value -
                                        data.spotify.timestamps.start) /
                                        (data.spotify.timestamps.end -
                                          data.spotify.timestamps.start)) *
                                        100,
                                    ),
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        }}
      />
    );
  },
);
