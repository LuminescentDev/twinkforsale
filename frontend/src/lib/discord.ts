export interface LanyardData {
  success: boolean;
  error?: string;
  data?: {
    discord_user: {
      id: string;
      username: string;
      avatar: string;
      discriminator: string;
      bot: boolean;
      global_name: string | null;
      display_name: string | null;
      public_flags: number;
      premium_type?: number;
      accent_color?: number;
      banner?: string;
      avatar_decoration?: string;
      clan?: any;
      primary_guild?: {
        tag: string;
        identity_guild_id: string;
        badge: string;
        identity_enabled: boolean;
      };
      avatar_decoration_data?: {
        sku_id: string;
        asset: string;
        expires_at: string | null;
      };
      collectibles?: {
        nameplate?: {
          label: string;
          sku_id: string;
          asset: string;
          expires_at: string | null;
          palette: string;
        };
      };
    };
    discord_status: "online" | "idle" | "dnd" | "offline";
    active_on_discord_web: boolean;
    active_on_discord_desktop: boolean;
    active_on_discord_mobile: boolean;
    active_on_discord_embedded: boolean;
    activities: Array<{
      id: string;
      name: string;
      type: number;
      state?: string;
      details?: string;
      session_id?: string;
      timestamps?: {
        start?: number;
        end?: number;
      };
      emoji?: {
        name: string;
        id?: string;
        animated?: boolean;
      };
      party?: {
        id?: string;
        size?: [number, number];
      };
      assets?: {
        large_image?: string;
        large_text?: string;
        small_image?: string;
        small_text?: string;
      };
      secrets?: {
        join?: string;
        spectate?: string;
        match?: string;
      };
      instance?: boolean;
      flags?: number;
      buttons?: Array<string>;
      application_id?: string;
      created_at?: number;
    }>;
    spotify?: {
      track_id: string;
      timestamps: {
        start: number;
        end: number;
      };
      song: string;
      artist: string;
      album_art_url: string;
      album: string;
    };
    listening_to_spotify: boolean;
    kv?: Record<string, string>;
  };
}

/**
 * Fetch Lanyard data for a Discord user (fallback for initial load)
 */
export async function getLanyardData(discordId: string): Promise<LanyardData> {
  try {
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`https://lanyard.twink.forsale/v1/users/${discordId}`, {
      headers: {
        "User-Agent": "twink.forsale/1.0",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 404) {
      return {
        success: false,
        error: "Discord user not found. You need to either join our Discord server (https://discord.gg/TDsQpa9tdT) or invite the bot to your Discord server to use this feature."
      };
    }

    if (!response.ok || response.status !== 200) {
      return { 
        success: false, 
        error: `Request failed with status ${response.status}` 
      };
    }

    const data = await response.json();

    // Check if discord_user data is missing
    if (!data.data?.discord_user) {
      return {
        success: false,
        error: "Discord user data not available. You need to either join our Discord server (https://discord.gg/TDsQpa9tdT) or invite the bot to your Discord server to use this feature."
      };
    }

    return data;
  } catch (error) {
    console.error("Error fetching Lanyard data:", error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { 
          success: false, 
          error: "Request timed out. Please try again later." 
        };
      }
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return { 
          success: false, 
          error: "Network error. Please check your connection and try again." 
        };
      }
    }
    
    return { 
      success: false, 
      error: "Failed to fetch Discord data. Please try again later." 
    };
  }
}

/**
 * Connect to Lanyard WebSocket for real-time updates
 */
export function connectLanyardSocket(
  discordId: string,
  onData: (data: LanyardData) => void,
  onError?: (error: string) => void
): () => void {
  let ws: WebSocket | null = null;
  let heartbeatInterval: NodeJS.Timeout | null = null;
  let reconnectTimeout: NodeJS.Timeout | null = null;
  let connectionTimeout: NodeJS.Timeout | null = null;
  let isReconnecting = false;
  let connectionAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 3;

  const connect = () => {
    try {
      // Don't try to reconnect indefinitely
      if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.log("Max reconnection attempts reached, giving up");
        onError?.("Failed to establish WebSocket connection after multiple attempts");
        return;
      }

      connectionAttempts++;
      ws = new WebSocket("wss://lanyard.twink.forsale/socket");

      // Set a connection timeout
      connectionTimeout = setTimeout(() => {
        if (ws && ws.readyState === WebSocket.CONNECTING) {
          console.log("WebSocket connection timeout");
          ws.close();
          onError?.("WebSocket connection timed out");
        }
      }, 10000); // 10 second connection timeout

      ws.onopen = () => {
        console.log("Lanyard WebSocket connected");
        connectionAttempts = 0; // Reset on successful connection
        
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          connectionTimeout = null;
        }
        
        // Subscribe to user
        ws?.send(JSON.stringify({
          op: 2,
          d: {
            subscribe_to_id: discordId
          }
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          switch (message.op) {
            case 1: // Hello
              // Set up heartbeat
              if (heartbeatInterval) clearInterval(heartbeatInterval);
              heartbeatInterval = setInterval(() => {
                ws?.send(JSON.stringify({ op: 3 }));
              }, message.d.heartbeat_interval);
              break;
            case 0: // Event
              if (message.t === "INIT_STATE" || message.t === "PRESENCE_UPDATE") {
                // Check if discord_user data is missing
                if (!message.d?.discord_user) {
                  onData({
                    success: false,
                    error: "Discord user data not available. You need to either join the Lanyard Discord server (https://discord.gg/lanyard) or invite the Lanyard bot to your Discord server to use this feature."
                  });
                  return;
                }

                onData({
                  success: true,
                  data: message.d
                });
              }
              break;
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onclose = () => {
        console.log("Lanyard WebSocket disconnected");
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }

        // Attempt to reconnect if not manually closed
        if (!isReconnecting) {
          isReconnecting = true;
          reconnectTimeout = setTimeout(() => {
            isReconnecting = false;
            connect();
          }, 5000);
        }
      };

      ws.onerror = (error) => {
        console.error("Lanyard WebSocket error:", error);
        onError?.("WebSocket connection error");
      };

    } catch (error) {
      console.error("Error connecting to Lanyard WebSocket:", error);
      onError?.("Failed to connect to WebSocket");
    }
  };

  // Initial connection
  connect();
  // Return cleanup function
  return () => {
    isReconnecting = true; // Prevent reconnection
    connectionAttempts = MAX_RECONNECT_ATTEMPTS; // Prevent further attempts
    
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
    }
    if (ws) {
      ws.close();
    }
  };
}

/**
 * Get Discord avatar URL
 */
export function getDiscordAvatarUrl(
  userId: string,
  avatarHash: string | null,
  size: number = 128
): string {
  if (!avatarHash) {
    // Default Discord avatar
    const defaultNum = parseInt(userId) % 5;
    return `https://cdn.discordapp.com/embed/avatars/${defaultNum}.png`;
  }

  const format = avatarHash.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${format}?size=${size}`;
}

/**
 * Get Discord guild icon URL
 */
export function getDiscordGuildIconUrl(guildId: string, iconHash?: string, size = 128): string {
  if (!iconHash) {
    return `https://cdn.discordapp.com/embed/avatars/0.png`;
  }
  return `https://cdn.discordapp.com/clan-badges/${guildId}/${iconHash}.png?size=${size}`;
}

/**
 * Get Discord banner URL using DSTN proxy
 */
export function getDiscordBannerUrl(userId: string): string {
  return `https://dcdn.dstn.to/banners/${userId}`;
}

/**
 * Format activity type for display
 */
export function formatActivityType(type: number): string {
  switch (type) {
    case 0:
      return "Playing";
    case 1:
      return "Streaming";
    case 2:
      return "Listening to";
    case 3:
      return "Watching";
    case 4:
      return "Custom Status";
    case 5:
      return "Competing in";
    default:
      return "Unknown";
  }
}

/**
 * Get status color for Discord status
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case "online":
      return "#23a55a";
    case "idle":
      return "#f0b232";
    case "dnd":
      return "#f23f43";
    case "offline":
    default:
      return "#80848e";
  }
}

/**
 * Get status text for Discord status
 */
export function getStatusText(status: string): string {
  switch (status) {
    case "online":
      return "Online";
    case "idle":
      return "Idle";
    case "dnd":
      return "Do Not Disturb";
    case "offline":
    default:
      return "Offline";
  }
}

/**
 * Discord badge flags mapping
 */
export const DISCORD_FLAGS = {
  STAFF: 1 << 0,
  PARTNER: 1 << 1,
  HYPESQUAD: 1 << 2,
  BUG_HUNTER_LEVEL_1: 1 << 3,
  HYPESQUAD_ONLINE_HOUSE_1: 1 << 6, // Bravery
  HYPESQUAD_ONLINE_HOUSE_2: 1 << 7, // Brilliance
  HYPESQUAD_ONLINE_HOUSE_3: 1 << 8, // Balance
  PREMIUM_EARLY_SUPPORTER: 1 << 9,
  BUG_HUNTER_LEVEL_2: 1 << 14,
  VERIFIED_BOT: 1 << 16,
  VERIFIED_DEVELOPER: 1 << 17,
  CERTIFIED_MODERATOR: 1 << 18,
  BOT_HTTP_INTERACTIONS: 1 << 19,
  ACTIVE_DEVELOPER: 1 << 22,
} as const;

/**
 * Get user badges from public flags
 */
export function getUserBadges(publicFlags: number): Array<{
  name: string;
  icon: string;
  color: string;
  description: string;
}> {
  const badges = [];

  if (publicFlags & DISCORD_FLAGS.STAFF) {
    badges.push({
      name: "Discord Staff",
      icon: "🛡️",
      color: "#5865f2",
      description: "Discord Staff member"
    });
  }

  if (publicFlags & DISCORD_FLAGS.PARTNER) {
    badges.push({
      name: "Discord Partner",
      icon: "🤝",
      color: "#5865f2",
      description: "Discord Partner"
    });
  }

  if (publicFlags & DISCORD_FLAGS.HYPESQUAD) {
    badges.push({
      name: "HypeSquad Events",
      icon: "🎉",
      color: "#f47fff",
      description: "HypeSquad Events member"
    });
  }

  if (publicFlags & DISCORD_FLAGS.BUG_HUNTER_LEVEL_1) {
    badges.push({
      name: "Bug Hunter",
      icon: "🐛",
      color: "#3e8d46",
      description: "Discord Bug Hunter"
    });
  }

  if (publicFlags & DISCORD_FLAGS.HYPESQUAD_ONLINE_HOUSE_1) {
    badges.push({
      name: "HypeSquad Bravery",
      icon: "⚔️",
      color: "#9c84ef",
      description: "HypeSquad House of Bravery"
    });
  }

  if (publicFlags & DISCORD_FLAGS.HYPESQUAD_ONLINE_HOUSE_2) {
    badges.push({
      name: "HypeSquad Brilliance",
      icon: "💎",
      color: "#f47fff",
      description: "HypeSquad House of Brilliance"
    });
  }

  if (publicFlags & DISCORD_FLAGS.HYPESQUAD_ONLINE_HOUSE_3) {
    badges.push({
      name: "HypeSquad Balance",
      icon: "⚖️",
      color: "#45ddc0",
      description: "HypeSquad House of Balance"
    });
  }

  if (publicFlags & DISCORD_FLAGS.PREMIUM_EARLY_SUPPORTER) {
    badges.push({
      name: "Early Supporter",
      icon: "⭐",
      color: "#ff73fa",
      description: "Early Nitro Supporter"
    });
  }

  if (publicFlags & DISCORD_FLAGS.BUG_HUNTER_LEVEL_2) {
    badges.push({
      name: "Bug Hunter Level 2",
      icon: "🏆",
      color: "#3e8d46",
      description: "Discord Bug Hunter Level 2"
    });
  }

  if (publicFlags & DISCORD_FLAGS.VERIFIED_BOT) {
    badges.push({
      name: "Verified Bot",
      icon: "✅",
      color: "#5865f2",
      description: "Verified Bot"
    });
  }

  if (publicFlags & DISCORD_FLAGS.VERIFIED_DEVELOPER) {
    badges.push({
      name: "Verified Bot Developer",
      icon: "👨‍💻",
      color: "#5865f2",
      description: "Early Verified Bot Developer"
    });
  }

  if (publicFlags & DISCORD_FLAGS.CERTIFIED_MODERATOR) {
    badges.push({
      name: "Certified Moderator",
      icon: "🛡️",
      color: "#5865f2",
      description: "Discord Certified Moderator"
    });
  }

  if (publicFlags & DISCORD_FLAGS.ACTIVE_DEVELOPER) {
    badges.push({
      name: "Active Developer",
      icon: "🔨",
      color: "#5865f2",
      description: "Active Bot Developer"
    });
  }

  return badges;
}

/**
 * Get guild information from activity (if user is representing a guild)
 */
export function getRepresentingGuild(activities?: Array<any>) {
  if (!activities) return null;

  // Look for rich presence activities that might represent a server/guild
  const potentialGuildActivity = activities.find((activity: any) => {
    // Check for activities with server/guild-like assets and details
    if (activity.assets?.large_image && activity.details) {
      // Skip common gaming platforms
      const gamingPlatforms = ['steam', 'epic', 'battlenet', 'origin', 'uplay'];
      const activityName = activity.name?.toLowerCase() || '';
      const isGaming = gamingPlatforms.some((platform: string) => activityName.includes(platform));

      if (!isGaming) {
        // Look for server/community indicators
        const serverIndicators = ['server', 'guild', 'community', 'discord', 'bot'];
        const hasServerIndicator = serverIndicators.some((indicator: string) =>
          activityName.includes(indicator) ||
          (activity.details?.toLowerCase() || '').includes(indicator) ||
          (activity.state?.toLowerCase() || '').includes(indicator)
        );

        if (hasServerIndicator) {
          return true;
        }

        // Check if it has rich presence with guild-like structure
        if (activity.party && activity.assets.large_image && activity.type === 0) {
          return true;
        }
      }
    }

    // Check for custom status with Discord invite links
    if (activity.type === 4 && activity.state) {
      return activity.state.includes('discord.gg/') || activity.state.includes('discord.com/invite/');
    }

    return false;
  });

  if (potentialGuildActivity) {
    let iconUrl = '';

    if (potentialGuildActivity.assets?.large_image) {
      if (potentialGuildActivity.assets.large_image.startsWith('mp:')) {
        iconUrl = `https://media.discordapp.net/${potentialGuildActivity.assets.large_image.slice(3)}`;
      } else if (potentialGuildActivity.application_id) {
        iconUrl = `https://cdn.discordapp.com/app-assets/${potentialGuildActivity.application_id}/${potentialGuildActivity.assets.large_image}.png`;
      }
    }

    return {
      name: potentialGuildActivity.details || potentialGuildActivity.name || "Discord Server",
      iconUrl,
      description: potentialGuildActivity.state || undefined
    };
  }

  return null;
}
