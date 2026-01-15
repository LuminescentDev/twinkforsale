import type { RequestEvent } from '@builder.io/qwik-city';
import { getBioLimits } from './bio-limits.server';
import type { BioPageData } from './bio';

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
 * Get bio page data by username
 */
export async function getBioPageByUsername(username: string): Promise<BioPageData | null> {
  try {
    const data = await serverRequest<BioPageData>(`/bio/public/${encodeURIComponent(username)}`);
    return data;
  } catch (error) {
    console.error('Failed to fetch bio page:', error);
    return null;
  }
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
  try {
    await serverRequest(`/bio/public/${encodeURIComponent(username)}/view`, undefined, {
      method: 'POST',
      body: JSON.stringify({ ipAddress, userAgent, referer }),
    });
  } catch (error) {
    console.error('Failed to track bio view:', error);
  }
}

/**
 * Track bio link click
 */
export async function trackLinkClick(linkId: string): Promise<void> {
  await serverRequest(`/bio/links/${linkId}/click`, undefined, { method: 'POST' });
}

/**
 * Validate bio username availability
 */
export async function isBioUsernameAvailable(username: string, userId?: string): Promise<boolean> {
  const result = await serverRequest<{ available: boolean }>("/bio/username-available", undefined, {
    params: { username, userId }
  });

  return result.available;
}

/**
 * Validate username format
 */
export async function validateBioUsername(username: string, userId?: string, requestEvent?: RequestEvent): Promise<{ isValid: boolean; error?: string }> {
  // Get user limits if userId provided
  let maxLength = 20; // Default
  if (userId) {
    const limits = await getBioLimits(userId, requestEvent);
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
export async function getBioAnalytics(userId: string, days: number = 7, requestEvent?: RequestEvent) {
  if (!requestEvent) {
    return {
      totalViews: 0,
      viewsByDate: {},
      topLinks: [],
      uniqueIPs: 0,
    };
  }

  const data = await serverRequest<{
    totalViews: number;
    viewsByDate: Record<string, number>;
    topLinks: Array<{ id: string; title: string; url: string; clicks: number }>;
    uniqueIps: number;
  }>("/bio/analytics", requestEvent, { params: { days } });

  return {
    totalViews: data.totalViews,
    viewsByDate: data.viewsByDate,
    topLinks: data.topLinks,
    uniqueIPs: data.uniqueIps,
  };
}
