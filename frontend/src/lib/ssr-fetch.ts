/**
 * SSR Fetch Utilities
 * 
 * Helper functions for making server-side requests from Qwik routeLoader$ and routeAction$.
 * These utilities ensure that SSR code can reach the backend API directly using BACKEND_URL,
 * bypassing the need to go through the frontend's reverse proxy.
 */

import type { RequestEventCommon } from '@builder.io/qwik-city';

/**
 * Get the backend origin for SSR fetches
 * Uses BACKEND_URL env var or falls back to localhost:5000
 */
export function getInternalOrigin(requestEvent: RequestEventCommon): string {
  const backendUrl = requestEvent.env.get('BACKEND_URL');
  if (backendUrl) {
    return backendUrl;
  }
  
  // Fallback to localhost backend
  return 'http://localhost:5000';
}

/**
 * Make a server-side request to the backend API
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

  // Build the endpoint URL
  let url = endpoint;

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

  // Use BACKEND_URL for SSR requests to reach the backend directly
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
