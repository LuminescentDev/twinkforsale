import { db } from "~/lib/db";

/**
 * Get Discord user ID from OAuth account data
 */
export async function getDiscordIdFromUser(userId: string): Promise<string | null> {
  try {
    const discordAccount = await db.account.findFirst({
      where: {
        userId: userId,
        provider: "discord",
      },
      select: {
        providerAccountId: true,
      },
    });

    return discordAccount?.providerAccountId || null;
  } catch (error) {
    console.error("Error fetching Discord ID:", error);
    return null;
  }
}

/**
 * Auto-populate Discord ID for users who logged in with Discord
 */
export async function autoPopulateDiscordId(userId: string): Promise<boolean> {
  try {
    const discordId = await getDiscordIdFromUser(userId);

    if (!discordId) {
      return false;
    }

    // Update user with Discord ID if not already set
    const user = await db.userSettings.findUnique({
      where: { userId: userId },
      select: { bioDiscordUserId: true },
    });

    if (!user?.bioDiscordUserId) {
      await db.userSettings.update({
        where: { userId: userId },
        data: {
          bioDiscordUserId: discordId,
        },
      });
    }

    return true;
  } catch (error) {
    console.error("Error auto-populating Discord ID:", error);
    return false;
  }
}
