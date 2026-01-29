/**
 * Custom fetcher for Orval-generated API clients
 * Uses relative paths since API is served on same domain at /api/*
 */

export async function customFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  // The URL passed from generated code already includes /api prefix
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Include cookies for JWT auth
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`API Error ${response.status}: ${message}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
