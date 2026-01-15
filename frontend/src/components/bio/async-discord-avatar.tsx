import { component$, useResource$, Resource } from "@builder.io/qwik";
import { getLanyardData, getDiscordAvatarUrl } from "~/lib/discord";

export interface AsyncDiscordAvatarProps {
  discordUserId: string;
  size?: number;
  class?: string;
}

export const AsyncDiscordAvatar = component$<AsyncDiscordAvatarProps>(
  ({ discordUserId, size = 128, class: className = "" }) => {
    const avatarResource = useResource$<string | null>(async ({ track }) => {
      // This runs in the background and doesn't block page render
      track(() => discordUserId);

      if (!discordUserId) return null;

      try {
        const lanyardData = await getLanyardData(discordUserId);

        if (lanyardData.success && lanyardData.data) {
          return getDiscordAvatarUrl(
            lanyardData.data.discord_user.id,
            lanyardData.data.discord_user.avatar,
            size,
          );
        }
      } catch (error) {
        console.warn("Failed to fetch Discord avatar:", error);
      }

      return null;
    });

    return (
      <Resource
        value={avatarResource}
        onPending={() => null} // No loading state, just don't show anything
        onRejected={() => null} // Silent failure
        onResolved={(avatarUrl) => {
          if (avatarUrl) {
            return (
              <img
                src={avatarUrl}
                alt="Discord Avatar"
                class={`rounded-full object-cover ${className}`}
                width={size}
                height={size}
              />
            );
          }
          return null;
        }}
      />
    );
  },
);
