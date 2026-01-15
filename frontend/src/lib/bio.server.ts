import { db } from './db';
import { getBioLimits } from './bio-limits.server';
import type { BioPageData } from './bio';

/**
 * Get bio page data by username
 */
export async function getBioPageByUsername(username: string): Promise<BioPageData | null> {
  const user = await db.user.findFirst({
    where: { 
      isApproved: true,    // Only approved users can have public bios
      settings: {
        bioUsername: username,
        bioIsPublic: true,  // Only return public bio pages
      }
    },
    include: {
      bioLinks: {
        where: { isActive: true },
        orderBy: { order: 'asc' }
      },
      settings: true,
    }
  });

  if (!user || !user.settings?.bioUsername) {
    return null;
  }

  return {
    username: user.settings.bioUsername,
    displayName: user.settings.bioDisplayName ?? undefined,
    description: user.settings.bioDescription ?? undefined,
    profileImage: user.settings.bioProfileImage ?? undefined,
    backgroundImage: user.settings.bioBackgroundImage ?? undefined,
    backgroundColor: user.settings.bioBackgroundColor || '#8B5CF6',
    textColor: user.settings.bioTextColor || '#FFFFFF',
    accentColor: user.settings.bioAccentColor || '#F59E0B',
    customCss: user.settings.bioCustomCss ?? undefined,
    spotifyTrack: user.settings.bioSpotifyTrack ?? undefined,
    isPublic: user.settings.bioIsPublic,
    views: user.settings.bioViews,
    links: user.bioLinks.map(link => ({
      id: link.id,
      title: link.title,
      url: link.url,
      icon: link.icon ?? undefined,
      order: link.order,
      isActive: link.isActive
    })),
    gradientConfig: user.settings.bioGradientConfig ?? undefined,
    particleConfig: user.settings.bioParticleConfig ?? undefined,
    discordUserId: user.settings.bioDiscordUserId ?? undefined,
    showDiscord: user.settings.bioShowDiscord ?? false,
    discordConfig: user.settings.bioDiscordConfig ?? undefined,
  };
}

/**
 * Track bio page view
 */
export async function trackBioView(
  username: string, 
  ipAddress?: string, 
  userAgent?: string, 
  referer?: string
): Promise<void> {
  const userSettings = await db.userSettings.findUnique({
    where: { bioUsername: username },
    select: { userId: true }
  });

  if (!userSettings) return;

  // Update view count
  await db.userSettings.update({
    where: { userId: userSettings.userId },
    data: {
      bioViews: { increment: 1 },
      bioLastViewed: new Date()
    }
  });

  // Log the view for analytics
  await db.bioView.create({
    data: {
      userId: userSettings.userId,
      ipAddress,
      userAgent,
      referer,
      viewedAt: new Date()
    }
  });
}

/**
 * Track bio link click
 */
export async function trackLinkClick(linkId: string): Promise<void> {
  await db.bioLink.update({
    where: { id: linkId },
    data: {
      clicks: { increment: 1 }
    }
  });
}

/**
 * Validate bio username availability
 */
export async function isBioUsernameAvailable(username: string, userId?: string): Promise<boolean> {
  const existing = await db.userSettings.findUnique({
    where: { bioUsername: username },
    select: { userId: true }
  });

  if (!existing) return true;

  // If the username belongs to the same user, it's available for them
  return !!userId && existing.userId === userId;
}

/**
 * Validate username format
 */
export async function validateBioUsername(username: string, userId?: string): Promise<{ isValid: boolean; error?: string }> {
  // Get user limits if userId provided
  let maxLength = 20; // Default
  if (userId) {
    const limits = await getBioLimits(userId);
    maxLength = limits.maxUsernameLength;
  }

  // Check length
  if (username.length < 3) {
    return { isValid: false, error: "Username must be at least 3 characters long" };
  }
  
  if (username.length > maxLength) {
    return { isValid: false, error: `Username must be ${maxLength} characters or less` };
  }

  // Check format - only alphanumeric, underscore, and hyphen
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    return { isValid: false, error: "Username can only contain letters, numbers, underscores, and hyphens" };
  }

  // Check for reserved usernames
  const reservedUsernames = [
    'admin', 'api', 'www', 'mail', 'ftp', 'root', 'test', 'demo', 'user',
    'support', 'help', 'about', 'contact', 'dashboard', 'settings', 'profile',
    'login', 'logout', 'register', 'signup', 'signin', 'auth', 'oauth',
    'uploads', 'files', 'cdn', 'static', 'assets', 'public', 'private',
    'terms', 'privacy', 'legal', 'dmca', 'abuse', 'security', 'status'
  ];

  if (reservedUsernames.includes(username.toLowerCase())) {
    return { isValid: false, error: "This username is reserved" };
  }

  return { isValid: true };
}

/**
 * Get bio analytics for a user
 */
export async function getBioAnalytics(userId: string, days: number = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const viewLogs = await db.bioView.findMany({
    where: {
      userId,
      viewedAt: { gte: startDate }
    },
    orderBy: { viewedAt: 'asc' }
  });

  const linkClicks = await db.bioLink.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      url: true,
      clicks: true
    },
    orderBy: { clicks: 'desc' }
  });

  // Group views by date
  const viewsByDate: Record<string, number> = {};
  viewLogs.forEach(log => {
    const date = log.viewedAt.toISOString().split('T')[0];
    viewsByDate[date] = (viewsByDate[date] || 0) + 1;
  });

  return {
    totalViews: viewLogs.length,
    viewsByDate,
    topLinks: linkClicks,
    uniqueIPs: new Set(viewLogs.map(log => log.ipAddress).filter(Boolean)).size
  };
}
