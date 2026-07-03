import { $ } from "@builder.io/qwik";

/**
 * Cookie utility functions for client-side cookie management
 * These functions are wrapped with $() to make them serializable for Qwik
 */

/**
 * Get a cookie value by name
 * @param name - The name of the cookie to retrieve
 * @returns The cookie value or null if not found
 */
export const getCookie = $((name: string): string | null => {
  if (typeof document === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue || null;
  }

  return null;
});

/**
 * Set a cookie with optional expiration and path
 * @param name - The name of the cookie
 * @param value - The value to store
 * @param days - Number of days until expiration (default: 365)
 * @param path - Cookie path (default: '/')
 * @param domain - Cookie domain (optional)
 * @param secure - Whether cookie should only be sent over HTTPS (default: false)
 * @param sameSite - SameSite attribute (default: 'Lax')
 */
export const setCookie = $((
  name: string,
  value: string,
  options: {
    days?: number;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
  } = {}
) => {
  if (typeof document === 'undefined') return;

  const {
    days = 365,
    path = '/',
    domain,
    secure = false,
    sameSite = 'Lax'
  } = options;

  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));

  let cookieString = `${name}=${value}`;
  cookieString += `; expires=${expires.toUTCString()}`;
  cookieString += `; path=${path}`;
  cookieString += `; SameSite=${sameSite}`;

  if (domain) {
    cookieString += `; domain=${domain}`;
  }

  if (secure) {
    cookieString += `; Secure`;
  }

  document.cookie = cookieString;
});

/**
 * Delete a cookie by setting it to expire in the past
 * @param name - The name of the cookie to delete
 * @param path - Cookie path (default: '/')
 * @param domain - Cookie domain (optional)
 */
export const deleteCookie = $((
  name: string,
  options: {
    path?: string;
    domain?: string;
  } = {}
) => {
  if (typeof document === 'undefined') return;

  const { path = '/', domain } = options;

  let cookieString = `${name}=`;
  cookieString += `; expires=Thu, 01 Jan 1970 00:00:00 UTC`;
  cookieString += `; path=${path}`;

  if (domain) {
    cookieString += `; domain=${domain}`;
  }

  document.cookie = cookieString;
});

/**
 * Check if a cookie exists
 * @param name - The name of the cookie to check
 * @returns True if the cookie exists, false otherwise
 */
export const hasCookie = $((name: string): boolean => {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some(cookie =>
    cookie.trim().startsWith(`${name}=`)
  );
});

/**
 * Get all cookies as an object
 * @returns Object with cookie names as keys and values as values
 */
export const getAllCookies = $(() => {
  if (typeof document === 'undefined') return {};

  const cookies: Record<string, string> = {};

  document.cookie.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name && rest.length > 0) {
      cookies[name] = rest.join('=');
    }
  });

  return cookies;
});

/**
 * Cookie storage keys used throughout the application
 * This helps maintain consistency and avoid typos
 */
export const COOKIE_KEYS = {
  UPLOADS_VIEW_MODE: 'uploads-view-mode',
  THEME_PREFERENCE: 'theme-preference',
  THEME_VARIANT: 'theme-variant', // For storing theme variants
  SIDEBAR_COLLAPSED: 'sidebar-collapsed',
  ANALYTICS_PERIOD: 'analytics-period',
  TABLE_PAGE_SIZE: 'table-page-size',
} as const;

/**
 * Type-safe cookie getters and setters for specific application cookies
 */

/**
 * Get the uploads view mode preference
 * @returns Promise<'grid' | 'list' | null>
 */
export const getUploadsViewMode = $(async (): Promise<'grid' | 'list' | null> => {
  const value = await getCookie(COOKIE_KEYS.UPLOADS_VIEW_MODE);
  return value as 'grid' | 'list' | null;
});

/**
 * Set the uploads view mode preference
 * @param mode - 'grid' or 'list'
 */
export const setUploadsViewMode = $((mode: 'grid' | 'list') => {
  return setCookie(COOKIE_KEYS.UPLOADS_VIEW_MODE, mode);
});

/**
 * Get the theme preference
 * @returns Promise<'light' | 'dark' | 'auto' | 'pastel' | 'neon' | 'valentine' | null>
 */
export const getThemePreference = $(async (): Promise<'light' | 'dark' | 'auto' | 'pastel' | 'neon' | 'valentine' | null> => {
  const value = await getCookie(COOKIE_KEYS.THEME_PREFERENCE);
  return value as 'light' | 'dark' | 'auto' | 'pastel' | 'neon' | 'valentine' | null;
});

/**
 * Set the theme preference
 * @param theme - 'light', 'dark', 'auto', 'pastel', 'neon', or 'valentine'
 */
export const setThemePreference = $((theme: 'light' | 'dark' | 'auto' | 'pastel' | 'neon' | 'valentine') => {
  return setCookie(COOKIE_KEYS.THEME_PREFERENCE, theme);
});

/**
 * Get the sidebar collapsed state
 * @returns Promise<boolean>
 */
export const getSidebarCollapsed = $(async (): Promise<boolean> => {
  const value = await getCookie(COOKIE_KEYS.SIDEBAR_COLLAPSED);
  return value === 'true';
});

/**
 * Set the sidebar collapsed state
 * @param collapsed - boolean
 */
export const setSidebarCollapsed = $((collapsed: boolean) => {
  return setCookie(COOKIE_KEYS.SIDEBAR_COLLAPSED, collapsed.toString());
});

/**
 * Get the analytics period preference
 * @returns Promise<number | null>
 */
export const getAnalyticsPeriod = $(async (): Promise<number | null> => {
  const value = await getCookie(COOKIE_KEYS.ANALYTICS_PERIOD);
  return value ? parseInt(value, 10) : null;
});

/**
 * Set the analytics period preference
 * @param days - number of days
 */
export const setAnalyticsPeriod = $((days: number) => {
  return setCookie(COOKIE_KEYS.ANALYTICS_PERIOD, days.toString());
});

/**
 * Get the table page size preference
 * @returns Promise<number | null>
 */
export const getTablePageSize = $(async (): Promise<number | null> => {
  const value = await getCookie(COOKIE_KEYS.TABLE_PAGE_SIZE);
  return value ? parseInt(value, 10) : null;
});

/**
 * Set the table page size preference
 * @param size - number of items per page
 */
export const setTablePageSize = $((size: number) => {
  return setCookie(COOKIE_KEYS.TABLE_PAGE_SIZE, size.toString());
});

/**
 * Server-side cookie reading utility
 * This function works in server contexts where document is not available
 * @param cookieHeader - The cookie header from the request
 * @param name - The name of the cookie to retrieve
 * @returns The cookie value or null if not found
 */
export function getServerCookie(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
  const targetCookie = cookies.find(cookie => cookie.startsWith(`${name}=`));

  if (targetCookie) {
    return targetCookie.split('=')[1] || null;
  }

  return null;
}

/**
 * Get the theme preference from server-side cookie header
 * @param cookieHeader - The cookie header from the request
 * @returns The theme preference or null if not found
 */
export function getServerThemePreference(cookieHeader: string | undefined): 'light' | 'dark' | 'auto' | 'pastel' | 'neon' | 'valentine' | null {
  const value = getServerCookie(cookieHeader, COOKIE_KEYS.THEME_PREFERENCE);
  return value as 'light' | 'dark' | 'auto' | 'pastel' | 'neon' | 'valentine' | null;
}

export function getServerUploadsViewMode(cookieHeader: string | undefined): 'grid' | 'list' | null {
  const value = getServerCookie(cookieHeader, COOKIE_KEYS.UPLOADS_VIEW_MODE);
  return value as 'grid' | 'list' | null;
}