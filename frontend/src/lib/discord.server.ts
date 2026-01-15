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
 * Get Discord user ID from OAuth account data
 */
export async function getDiscordIdFromUser(userId: string, requestEvent?: RequestEvent): Promise<string | null> {
  try {
    if (!requestEvent) {
      return null;
    }

    const response = await serverRequest<{ discordId?: string | null }>(`/users/${userId}/discord-id`, requestEvent);
    return response.discordId || null;
  } catch (error) {
    console.error("Error fetching Discord ID:", error);
    return null;
  }
}

/**
 * Auto-populate Discord ID for users who logged in with Discord
 */
export async function autoPopulateDiscordId(userId: string, requestEvent?: RequestEvent): Promise<boolean> {
  try {
    if (!requestEvent) {
      return false;
    }

    await serverRequest(`/users/${userId}/discord-id/auto`, requestEvent, { method: "POST" });
    return true;
  } catch (error) {
    console.error("Error auto-populating Discord ID:", error);
    return false;
  }
}
