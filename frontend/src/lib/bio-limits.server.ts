import type { RequestEvent } from '@builder.io/qwik-city';
import { DEFAULT_BIO_LIMITS } from './bio-limits';

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

async function serverRequest<T>(
  endpoint: string,
  requestEvent?: RequestEvent,
  options: RequestInit & { params?: Record<string, string | number | boolean | undefined> } = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_BASE_URL}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const cookies = requestEvent?.request.headers.get('cookie') || '';

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(cookies ? { Cookie: cookies } : {}),
      ...fetchOptions.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || response.statusText);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/**
 * Get bio limits for a user
 */
export async function getBioLimits(userId?: string, requestEvent?: RequestEvent) {
  if (!requestEvent) {
    return DEFAULT_BIO_LIMITS;
  }

  if (userId) {
    try {
      const user = await serverRequest<{
        limits?: {
          maxBioLinks?: number | null;
          maxUsernameLength?: number | null;
          maxDisplayNameLength?: number | null;
          maxDescriptionLength?: number | null;
          maxUrlLength?: number | null;
          maxLinkTitleLength?: number | null;
          maxIconLength?: number | null;
        };
      }>(`/admin/bio-limits/${userId}`, requestEvent);

      return {
        maxBioLinks: user.limits?.maxBioLinks ?? DEFAULT_BIO_LIMITS.maxBioLinks,
        maxUsernameLength: user.limits?.maxUsernameLength ?? DEFAULT_BIO_LIMITS.maxUsernameLength,
        maxDisplayNameLength: user.limits?.maxDisplayNameLength ?? DEFAULT_BIO_LIMITS.maxDisplayNameLength,
        maxDescriptionLength: user.limits?.maxDescriptionLength ?? DEFAULT_BIO_LIMITS.maxDescriptionLength,
        maxUrlLength: user.limits?.maxUrlLength ?? DEFAULT_BIO_LIMITS.maxUrlLength,
        maxLinkTitleLength: user.limits?.maxLinkTitleLength ?? DEFAULT_BIO_LIMITS.maxLinkTitleLength,
        maxIconLength: user.limits?.maxIconLength ?? DEFAULT_BIO_LIMITS.maxIconLength,
      };
    } catch {
      // Fall back to current user's limits if admin endpoint is not available
    }
  }

  const limits = await serverRequest<{
    maxBioLinks: number;
    maxUsernameLength: number;
    maxDisplayNameLength: number;
    maxDescriptionLength: number;
    maxUrlLength: number;
    maxLinkTitleLength: number;
    maxIconLength: number;
  }>("/bio/limits", requestEvent);

  return {
    maxBioLinks: limits.maxBioLinks ?? DEFAULT_BIO_LIMITS.maxBioLinks,
    maxUsernameLength: limits.maxUsernameLength ?? DEFAULT_BIO_LIMITS.maxUsernameLength,
    maxDisplayNameLength: limits.maxDisplayNameLength ?? DEFAULT_BIO_LIMITS.maxDisplayNameLength,
    maxDescriptionLength: limits.maxDescriptionLength ?? DEFAULT_BIO_LIMITS.maxDescriptionLength,
    maxUrlLength: limits.maxUrlLength ?? DEFAULT_BIO_LIMITS.maxUrlLength,
    maxLinkTitleLength: limits.maxLinkTitleLength ?? DEFAULT_BIO_LIMITS.maxLinkTitleLength,
    maxIconLength: limits.maxIconLength ?? DEFAULT_BIO_LIMITS.maxIconLength,
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
}, requestEvent?: RequestEvent) {
  const limits = await getBioLimits(userId, requestEvent);
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
}, requestEvent?: RequestEvent) {
  const limits = await getBioLimits(userId, requestEvent);
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
export async function canCreateBioLink(userId: string, requestEvent?: RequestEvent): Promise<{ canCreate: boolean; currentCount: number; maxAllowed: number }> {
  if (!requestEvent) {
    return { canCreate: true, currentCount: 0, maxAllowed: DEFAULT_BIO_LIMITS.maxBioLinks };
  }

  const limits = await serverRequest<{ maxBioLinks: number; currentBioLinks: number }>("/bio/limits", requestEvent);

  return {
    canCreate: limits.currentBioLinks < limits.maxBioLinks,
    currentCount: limits.currentBioLinks,
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
}, requestEvent?: RequestEvent) {
  if (!requestEvent) {
    throw new Error("Request event required to update bio limits");
  }

  return serverRequest(`/admin/bio-limits/${userId}`, requestEvent, {
    method: 'PUT',
    body: JSON.stringify(limits),
  });
}
