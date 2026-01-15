import type { RequestEvent } from "@builder.io/qwik-city";

const API_BASE_URL = process.env.API_URL || "http://localhost:5000/api";

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

  const cookies = requestEvent?.request.headers.get("cookie") || "";

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
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
 * Cleanup expired files and files that exceeded view limits
 */
export async function cleanupExpiredFiles(requestEvent?: RequestEvent) {
  try {
    if (!requestEvent) {
      return { cleaned: 0 };
    }

    return await serverRequest<{ cleaned: number }>("/admin/uploads/cleanup", requestEvent, {
      method: "POST",
    });
  } catch (error: any) {
    console.error('Cleanup process failed:', error);
    throw error;
  }
}

/**
 * Auto-cleanup function that can be called periodically
 */
export async function autoCleanup(requestEvent?: RequestEvent) {
  try {
    const result = await cleanupExpiredFiles(requestEvent);
    console.log(`Auto-cleanup completed: ${result.cleaned} files cleaned`);
    return result;
  } catch (error: any) {
    console.error('Auto-cleanup failed:', error);
    return { cleaned: 0, error: error.message };
  }
}
