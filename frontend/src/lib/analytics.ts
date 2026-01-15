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
      if (value !== undefined) searchParams.append(key, String(value));
    });
    const queryString = searchParams.toString();
    if (queryString) url += `?${queryString}`;
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
 * Updates daily analytics for the current date
 * This function aggregates view logs and uploads for today
 */
export async function updateDailyAnalytics(): Promise<void> {
  // Daily analytics are computed server-side in the backend.
  return;
}

/**
 * Gets real-time analytics data for today
 */
export async function getTodayAnalytics() {
  const data = await serverRequest<Array<{
    date: string;
    totalViews: number;
    uniqueViews: number;
    totalDownloads: number;
    uniqueDownloads: number;
    uploadsCount: number;
    usersRegistered: number;
  }>>("/analytics/daily", undefined, { params: { days: 1 } });

  return data[0] ?? {
    date: new Date().toISOString().split("T")[0],
    totalViews: 0,
    uniqueViews: 0,
    totalDownloads: 0,
    uniqueDownloads: 0,
    uploadsCount: 0,
    usersRegistered: 0,
  };
}

/**
 * Gets analytics data for the last N days with real-time data for today
 */
export async function getAnalyticsData(days: number = 7) {
  return serverRequest<Array<{
    date: string;
    totalViews: number;
    uniqueViews: number;
    totalDownloads: number;
    uniqueDownloads: number;
    uploadsCount: number;
    usersRegistered: number;
  }>>("/analytics/daily", undefined, { params: { days } });
}

/**
 * Gets real-time analytics for a specific upload for today
 */
export async function getUploadTodayAnalytics(uploadId: string, requestEvent?: RequestEvent) {
  const data = await serverRequest<Array<{
    date: string;
    totalViews: number;
    uniqueViews: number;
    totalDownloads: number;
    uniqueDownloads: number;
  }>>(`/analytics/uploads/${uploadId}`, requestEvent, { params: { days: 1 } });

  return data[0] ?? {
    date: new Date().toISOString().split("T")[0],
    totalViews: 0,
    uniqueViews: 0,
    totalDownloads: 0,
    uniqueDownloads: 0,
  };
}

/**
 * Gets analytics data for a specific upload over N days
 */
export async function getUploadAnalytics(uploadId: string, days: number = 7, requestEvent?: RequestEvent) {
  return serverRequest<Array<{
    date: string;
    totalViews: number;
    uniqueViews: number;
    totalDownloads: number;
    uniqueDownloads: number;
  }>>(`/analytics/uploads/${uploadId}`, requestEvent, { params: { days } });
}

/**
 * Gets real-time analytics for a user for today
 */
export async function getUserTodayAnalytics(userId: string, requestEvent?: RequestEvent) {
  const data = await serverRequest<Array<{
    date: string;
    totalViews: number;
    uniqueViews: number;
    uploadsCount: number;
    usersRegistered: number;
  }>>(`/analytics/users/${userId}`, requestEvent, { params: { days: 1 } });

  return data[0] ?? {
    date: new Date().toISOString().split("T")[0],
    totalViews: 0,
    uniqueViews: 0,
    uploadsCount: 0,
    usersRegistered: 0,
  };
}

/**
 * Gets analytics data for a specific user over N days
 */
export async function getUserAnalytics(userId: string, days: number = 7, requestEvent?: RequestEvent) {
  return serverRequest<Array<{
    date: string;
    totalViews: number;
    uniqueViews: number;
    uploadsCount: number;
    usersRegistered: number;
  }>>(`/analytics/users/${userId}`, requestEvent, { params: { days } });
}
