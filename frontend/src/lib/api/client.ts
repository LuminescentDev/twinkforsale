// API Client for TwinkForSale Backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

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

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
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

  const response = await fetch(url, {
    ...fetchOptions,
    credentials: 'include', // Include cookies for JWT auth
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(response.status, message || response.statusText);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Auth API
export const auth = {
  getCurrentUser: () => request<CurrentUserResponse>('/users/me'),

  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
};

// Uploads API
export const uploads = {
  list: (params?: { page?: number; pageSize?: number; search?: string }) =>
    request<ListUploadsResponse>('/uploads', { params }),

  delete: (id: string) =>
    request<void>(`/uploads/${id}`, { method: 'DELETE' }),
};

// API Keys API
export const apiKeys = {
  list: () => request<ApiKeyDto[]>('/api-keys'),

  create: (data: { name: string; expiresAt?: string }) =>
    request<CreateApiKeyResponse>('/api-keys', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/api-keys/${id}`, { method: 'DELETE' }),
};

// Short Links API
export const shortLinks = {
  list: () => request<ShortLinkDto[]>('/short-links'),

  create: (data: { url: string; customCode?: string }) =>
    request<ShortenResponse>('/shorten', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/short-links/${id}`, { method: 'DELETE' }),
};

// Settings API
export const settings = {
  get: () => request<UserSettingsDto>('/settings'),

  update: (data: Partial<UserSettingsDto>) =>
    request<UserSettingsDto>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Bio API
export const bio = {
  get: () => request<BioSettingsDto>('/bio'),

  update: (data: Partial<UpdateBioRequest>) =>
    request<BioSettingsDto>('/bio', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  links: {
    create: (data: { title: string; url: string; icon?: string }) =>
      request<BioLinkDto>('/bio/links', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: { title: string; url: string; icon?: string; isActive: boolean }) =>
      request<BioLinkDto>(`/bio/links/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ id, ...data }),
      }),

    delete: (id: string) =>
      request<void>(`/bio/links/${id}`, { method: 'DELETE' }),
  },
};

// Domains API (public, for authenticated users)
export const domains = {
  list: () => request<PublicDomainDto[]>('/domains'),
};

// Account API
export const account = {
  delete: (confirmationText: string) =>
    request<void>('/users/me', {
      method: 'DELETE',
      body: JSON.stringify({ confirmationText }),
    }),
};

// Admin API
export const admin = {
  users: {
    list: (params?: { page?: number; pageSize?: number; search?: string; isApproved?: boolean }) =>
      request<ListUsersResponse>('/admin/users', { params }),

    update: (id: string, data: UpdateUserRequest) =>
      request<AdminUserDto>(`/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  domains: {
    list: () => request<DomainDto[]>('/admin/domains'),

    create: (data: { domain: string; isDefault?: boolean }) =>
      request<DomainDto>('/admin/domains', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: { domain: string; isDefault: boolean; isActive: boolean }) =>
      request<DomainDto>(`/admin/domains/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ id, ...data }),
      }),

    delete: (id: string) =>
      request<void>(`/admin/domains/${id}`, { method: 'DELETE' }),
  },

  analytics: () => request<SystemAnalyticsDto>('/admin/analytics'),
};

// Types
export interface CurrentUserResponse {
  id: string;
  email: string;
  name?: string;
  image?: string;
  isApproved: boolean;
  isAdmin: boolean;
  createdAt: string;
  settings?: UserSettingsResponse;
}

export interface UserSettingsResponse {
  maxUploads: number;
  maxFileSize: number;
  maxStorageLimit?: number;
  storageUsed: number;
  maxShortLinks: number;
  embedTitle?: string;
  embedColor?: string;
  useCustomWords: boolean;
}

export interface ListUploadsResponse {
  items: UploadDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UploadDto {
  id: string;
  fileName: string;
  originalName: string;
  shortCode: string;
  contentType: string;
  size: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  url: string;
  viewCount: number;
  isPublic: boolean;
  createdAt: string;
}

export interface ApiKeyDto {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface CreateApiKeyResponse {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  expiresAt?: string;
}

export interface ShortLinkDto {
  id: string;
  code: string;
  shortUrl: string;
  targetUrl: string;
  isActive: boolean;
  clickCount: number;
  lastClickedAt?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface ShortenResponse {
  shortUrl: string;
  code: string;
  originalUrl: string;
}

export interface UserSettingsDto {
  maxUploads: number;
  maxFileSize: number;
  maxStorageLimit?: number;
  storageUsed: number;
  maxShortLinks: number;
  embedTitle?: string;
  embedDescription?: string;
  embedColor?: string;
  embedAuthor?: string;
  embedFooter?: string;
  showFileInfo: boolean;
  showUploadDate: boolean;
  showUserStats: boolean;
  useCustomWords: boolean;
  customWords?: string;
  customDomain?: string;
  uploadDomainId?: string;
  customSubdomain?: string;
  defaultExpirationDays?: number;
  defaultMaxViews?: number;
}

export interface BioLinkDto {
  id: string;
  title: string;
  url: string;
  icon?: string;
  order: number;
  isActive: boolean;
  clicks?: number;
}

export interface BioSettingsDto {
  username?: string;
  displayName?: string;
  description?: string;
  profileImage?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  customCss?: string;
  spotifyTrack?: string;
  isPublic: boolean;
  views: number;
  gradientConfig?: string;
  particleConfig?: string;
  discordUserId?: string;
  showDiscord: boolean;
  discordConfig?: string;
  links: BioLinkDto[];
}

export interface UpdateBioRequest {
  username?: string;
  displayName?: string;
  description?: string;
  profileImage?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  customCss?: string;
  spotifyTrack?: string;
  isPublic?: boolean;
  gradientConfig?: string;
  particleConfig?: string;
  discordUserId?: string;
  showDiscord?: boolean;
  discordConfig?: string;
}

export interface ListUsersResponse {
  items: AdminUserDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminUserDto {
  id: string;
  email: string;
  name?: string;
  image?: string;
  isApproved: boolean;
  isAdmin: boolean;
  createdAt: string;
  approvedAt?: string;
  approvedById?: string;
  uploadCount: number;
  storageUsed: number;
}

export interface UpdateUserRequest {
  isApproved?: boolean;
  isAdmin?: boolean;
  maxUploads?: number;
  maxFileSize?: number;
  maxStorageLimit?: number;
  maxShortLinks?: number;
}

export interface DomainDto {
  id: string;
  domain: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  userCount: number;
}

export interface SystemAnalyticsDto {
  totalUsers: number;
  approvedUsers: number;
  pendingUsers: number;
  totalUploads: number;
  totalStorageUsed: number;
  totalShortLinks: number;
  todayUploads: number;
  todayViews: number;
  todayClicks: number;
  recentStats: DailyStatDto[];
}

export interface DailyStatDto {
  date: string;
  uploads: number;
  views: number;
  uniqueVisitors: number;
  downloads: number;
  usersRegistered: number;
}

export interface PublicDomainDto {
  id: string;
  domain: string;
  name: string;
  isDefault: boolean;
  supportsSubdomains: boolean;
}

export { ApiError };
