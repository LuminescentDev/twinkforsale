/**
 * SSR Fetch Utilities
 * 
 * Helper functions for making server-side requests from Qwik routeLoader$ and routeAction$.
 * These utilities ensure that SSR code can reach the frontend's own API routes by using
 * localhost instead of the public domain, which avoids issues with proxies and load balancers.
 */

import type { RequestEventCommon } from '@builder.io/qwik-city';

/**
 * Get the internal origin for SSR fetches
 * Uses FRONTEND_URL env var or falls back to localhost with PORT
 */
export function getInternalOrigin(requestEvent: RequestEventCommon): string {
  const frontendUrl = requestEvent.env.get('FRONTEND_URL');
  if (frontendUrl) {
    return frontendUrl;
  }
  
  // Fallback to localhost with PORT
  const port = requestEvent.env.get('PORT') || '3000';
  return `http://localhost:${port}`;
}

/**
 * Make a server-side request to the frontend's own API routes
 * 
 * @param requestEvent - The request event from routeLoader$ or routeAction$
 * @param endpoint - The API endpoint (e.g., '/users/me')
 * @param options - Fetch options and optional query params
 * @returns The response data
 */
export async function ssrFetch<T>(
  requestEvent: RequestEventCommon,
  endpoint: string,
  options: RequestInit & { params?: Record<string, string | number | boolean | undefined> } = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Use relative path with /api/ prefix
  let url = `/api${endpoint}`;

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

  // Use localhost for internal SSR requests instead of the public domain
  const origin = getInternalOrigin(requestEvent);
  const absoluteUrl = `${origin}${url}`;

  // Forward cookies from the incoming request
  const cookies = requestEvent.request.headers.get('cookie') || '';

  const response = await fetch(absoluteUrl, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies,
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
 * Get the public origin (the domain the user sees)
 * Use this for generating URLs to show to users, NOT for SSR fetches
 */
export function getPublicOrigin(requestEvent: RequestEventCommon): string {
  return requestEvent.url.origin;
}
