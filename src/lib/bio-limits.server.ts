import { db } from './db';
import { DEFAULT_BIO_LIMITS } from './bio-limits';

/**
 * Get bio limits for a user
 */
export async function getBioLimits(userId: string) {
  const user = await db.userSettings.findUnique({
    where: { userId: userId },
    select: {
      maxBioLinks: true,
      maxUsernameLength: true,
      maxDisplayNameLength: true,
      maxDescriptionLength: true,
      maxUrlLength: true,
      maxLinkTitleLength: true,
      maxIconLength: true,
    },
  });

  if (!user) {
    return DEFAULT_BIO_LIMITS;
  }

  return {
    maxBioLinks: user.maxBioLinks ?? DEFAULT_BIO_LIMITS.maxBioLinks,
    maxUsernameLength: user.maxUsernameLength ?? DEFAULT_BIO_LIMITS.maxUsernameLength,
    maxDisplayNameLength: user.maxDisplayNameLength ?? DEFAULT_BIO_LIMITS.maxDisplayNameLength,
    maxDescriptionLength: user.maxDescriptionLength ?? DEFAULT_BIO_LIMITS.maxDescriptionLength,
    maxUrlLength: user.maxUrlLength ?? DEFAULT_BIO_LIMITS.maxUrlLength,
    maxLinkTitleLength: user.maxLinkTitleLength ?? DEFAULT_BIO_LIMITS.maxLinkTitleLength,
    maxIconLength: user.maxIconLength ?? DEFAULT_BIO_LIMITS.maxIconLength,
  };
}

/**
 * Validate bio data against user limits
 */
export async function validateBioData(userId: string, data: {
  bioUsername?: string;
  bioDisplayName?: string;
  bioDescription?: string;
  bioProfileImage?: string;
  bioBackgroundImage?: string;
  bioSpotifyTrack?: string;
}) {
  const limits = await getBioLimits(userId);
  const errors: string[] = [];

  // Validate username length
  if (data.bioUsername && data.bioUsername.length > limits.maxUsernameLength) {
    errors.push(`Username must be ${limits.maxUsernameLength} characters or less`);
  }

  // Validate display name length
  if (data.bioDisplayName && data.bioDisplayName.length > limits.maxDisplayNameLength) {
    errors.push(`Display name must be ${limits.maxDisplayNameLength} characters or less`);
  }

  // Validate description length
  if (data.bioDescription && data.bioDescription.length > limits.maxDescriptionLength) {
    errors.push(`Description must be ${limits.maxDescriptionLength} characters or less`);
  }

  // Validate URL lengths
  if (data.bioProfileImage && data.bioProfileImage.length > limits.maxUrlLength) {
    errors.push(`Profile image URL must be ${limits.maxUrlLength} characters or less`);
  }

  if (data.bioBackgroundImage && data.bioBackgroundImage.length > limits.maxUrlLength) {
    errors.push(`Background image URL must be ${limits.maxUrlLength} characters or less`);
  }

  if (data.bioSpotifyTrack && data.bioSpotifyTrack.length > limits.maxUrlLength) {
    errors.push(`Spotify track URL must be ${limits.maxUrlLength} characters or less`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    limits,
  };
}

/**
 * Validate bio link data against user limits
 */
export async function validateBioLinkData(userId: string, data: {
  title: string;
  url: string;
  icon?: string;
}) {
  const limits = await getBioLimits(userId);
  const errors: string[] = [];

  // Validate title length
  if (data.title.length > limits.maxLinkTitleLength) {
    errors.push(`Link title must be ${limits.maxLinkTitleLength} characters or less`);
  }

  // Validate URL length
  if (data.url.length > limits.maxUrlLength) {
    errors.push(`URL must be ${limits.maxUrlLength} characters or less`);
  }

  // Validate icon length
  if (data.icon && data.icon.length > limits.maxIconLength) {
    errors.push(`Icon must be ${limits.maxIconLength} characters or less`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    limits,
  };
}

/**
 * Check if user can create more bio links
 */
export async function canCreateBioLink(userId: string): Promise<{ canCreate: boolean; currentCount: number; maxAllowed: number }> {
  const limits = await getBioLimits(userId);
  
  const currentCount = await db.bioLink.count({
    where: { userId },
  });

  return {
    canCreate: currentCount < limits.maxBioLinks,
    currentCount,
    maxAllowed: limits.maxBioLinks,
  };
}

/**
 * Admin function to update user bio limits
 */
export async function updateUserBioLimits(userId: string, limits: {
  maxBioLinks?: number;
  maxUsernameLength?: number;
  maxDisplayNameLength?: number;
  maxDescriptionLength?: number;
  maxUrlLength?: number;
  maxLinkTitleLength?: number;
  maxIconLength?: number;
}) {
  return await db.userSettings.update({
    where: { id: userId },
    data: limits,
  });
}
