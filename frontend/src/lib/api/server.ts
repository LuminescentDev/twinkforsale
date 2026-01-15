// Server-side API Client wrapper for Qwik routeLoader$ functions
import type { RequestEvent } from '@builder.io/qwik-city';
import type {
  CurrentUserResponse,
  ListUploadsResponse,
  ApiKeyDto,
  ShortLinkDto,
  UserSettingsDto,
  BioSettingsDto,
  ListUsersResponse,
  AdminUserDto,
  DomainDto,
  SystemAnalyticsDto,
  CreateApiKeyResponse,
  ShortenResponse,
  UpdateBioRequest,
  UpdateUserRequest,
  PublicDomainDto,
} from './client';

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function serverRequest<T>(
  requestEvent: RequestEvent,
  endpoint: string,
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

  // Forward cookies from the incoming request
  const cookies = requestEvent.request.headers.get('cookie') || '';

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies,
      ...fetchOptions.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(response.status, message || response.statusText);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Server-side API functions that can be used in routeLoader$
export function createServerApi(requestEvent: RequestEvent) {
  return {
    auth: {
      getCurrentUser: () =>
        serverRequest<CurrentUserResponse>(requestEvent, '/users/me'),
    },

    uploads: {
      list: (params?: { page?: number; pageSize?: number; search?: string }) =>
        serverRequest<ListUploadsResponse>(requestEvent, '/uploads', { params }),
    },

    apiKeys: {
      list: () =>
        serverRequest<ApiKeyDto[]>(requestEvent, '/api-keys'),
    },

    shortLinks: {
      list: () =>
        serverRequest<ShortLinkDto[]>(requestEvent, '/short-links'),
    },

    settings: {
      get: () =>
        serverRequest<UserSettingsDto>(requestEvent, '/settings'),
    },

    bio: {
      get: () =>
        serverRequest<BioSettingsDto>(requestEvent, '/bio'),
    },

    domains: {
      list: () =>
        serverRequest<PublicDomainDto[]>(requestEvent, '/domains'),
    },

    admin: {
      users: {
        list: (params?: { page?: number; pageSize?: number; search?: string; isApproved?: boolean }) =>
          serverRequest<ListUsersResponse>(requestEvent, '/admin/users', { params }),
      },

      domains: {
        list: () =>
          serverRequest<DomainDto[]>(requestEvent, '/admin/domains'),
      },

      analytics: () =>
        serverRequest<SystemAnalyticsDto>(requestEvent, '/admin/analytics'),
    },
  };
}

export { ApiError };

export type {
  CurrentUserResponse,
  ListUploadsResponse,
  ApiKeyDto,
  ShortLinkDto,
  UserSettingsDto,
  BioSettingsDto,
  ListUsersResponse,
  AdminUserDto,
  DomainDto,
  SystemAnalyticsDto,
  CreateApiKeyResponse,
  ShortenResponse,
  UpdateBioRequest,
  UpdateUserRequest,
  PublicDomainDto,
};
