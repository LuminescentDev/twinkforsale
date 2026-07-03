/**
 * Isomorphic API client for the TwinkForSale C# (FastEndpoints) backend.
 *
 * Works in both the browser and inside Qwik `routeLoader$`/`routeAction$`
 * (SSR). In the browser, requests are sent with credentials so the backend
 * auth cookie is included automatically. During SSR, pass the incoming
 * request's `cookie` header (and optionally an auth bearer token) through
 * `RequestOptions` so the call is authenticated on the user's behalf.
 *
 * The backend serializes responses as camelCase JSON, which the types below
 * mirror. Endpoint paths follow the API map documented in MIGRATION_PLAN.md.
 */

/**
 * Public backend URL used by browser requests. Empty string means same-origin,
 * which is valid in the browser but not in Node SSR.
 */
export const API_BASE_URL = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  (import.meta.env.DEV ? "http://localhost:5000" : "")
).replace(/\/$/, "");

const nodeEnv = (
  globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  }
).process?.env;

const SERVER_API_BASE_URL = (
  nodeEnv?.API_INTERNAL_BASE_URL ||
  nodeEnv?.VITE_API_BASE_URL ||
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  "http://localhost:5000"
).replace(/\/$/, "");

export interface RequestOptions {
  method?: string;
  /** JSON body (auto-stringified) or a FormData instance for uploads. */
  body?: unknown;
  headers?: Record<string, string>;
  /** SSR only: forward the incoming request cookie header for auth. */
  cookie?: string | null;
  /** Optional bearer token (e.g. an API key) for API-key protected calls. */
  token?: string | null;
  /** Query string params; undefined/null values are omitted. */
  query?: Record<string, string | number | boolean | null | undefined>;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  if (/^https?:\/\//i.test(path)) {
    return appendQuery(path, query);
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const baseUrl =
    API_BASE_URL || typeof window !== "undefined"
      ? API_BASE_URL
      : SERVER_API_BASE_URL;
  const base = `${baseUrl}${normalizedPath}`;
  return appendQuery(base, query);
}

function appendQuery(url: string, query?: RequestOptions["query"]): string {
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

/**
 * Core request helper. Returns parsed JSON (or `undefined` for empty/204
 * responses) and throws {@link ApiError} on non-2xx responses.
 */
export async function apiFetch<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, headers = {}, cookie, token, query, signal } =
    opts;

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  const finalHeaders: Record<string, string> = { ...headers };
  if (body !== undefined && !isFormData) {
    finalHeaders["Content-Type"] ??= "application/json";
  }
  if (cookie) finalHeaders["Cookie"] = cookie;
  if (token) finalHeaders["Authorization"] = `Bearer ${token}`;

  const response = await fetch(buildUrl(path, query), {
    method,
    headers: finalHeaders,
    body:
      body === undefined
        ? undefined
        : isFormData
          ? (body as FormData)
          : JSON.stringify(body),
    // Include the auth cookie in browser requests.
    credentials: "include",
    signal,
  });

  const text = await response.text();
  const parsed = text ? safeJson(text) : undefined;

  if (!response.ok) {
    const message =
      (parsed && typeof parsed === "object" && "error" in parsed
        ? String((parsed as Record<string, unknown>).error)
        : undefined) ||
      response.statusText ||
      `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message, parsed ?? text);
  }

  return parsed as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// ---------------------------------------------------------------------------
// Response / request types (camelCase, mirroring backend DTOs)
// ---------------------------------------------------------------------------

export interface MeResponse {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  isApproved: boolean;
  isAdmin: boolean;
  bioUsername: string | null;
}

export interface DashboardSummary {
  totalUploads: number;
  totalViews: number;
  totalDownloads: number;
  shortLinks: number;
  storageUsed: number;
  storageLimit: number;
}

export interface UploadListItem {
  id: string;
  shortCode: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  views: number;
  downloads: number;
  createdAt: string;
  expiresAt: string | null;
}

export interface ShortLinkListItem {
  id: string;
  code: string;
  url: string;
  clicks: number;
  maxClicks: number | null;
  createdAt: string;
  expiresAt: string | null;
  lastClicked: string | null;
}

export interface ApiKeyListItem {
  id: string;
  name: string;
  maskedKey: string;
  createdAt: string;
  lastUsed: string | null;
}

export interface CreateApiKeyResponse {
  id: string;
  name: string;
  key: string;
  createdAt: string;
}

export interface UserSettings {
  maxUploads: number;
  maxFileSize: number;
  maxStorageLimit: number | null;
  storageUsed: number;
  maxShortLinks: number;
  embedTitle: string | null;
  embedDescription: string | null;
  embedColor: string | null;
  embedAuthor: string | null;
  embedFooter: string | null;
  showFileInfo: boolean;
  showUploadDate: boolean;
  showUserStats: boolean;
  customDomain: string | null;
  uploadDomainId: string | null;
  customSubdomain: string | null;
  useCustomWords: boolean;
  defaultExpirationDays: number | null;
  defaultMaxViews: number | null;
  globalParticleConfig: string | null;
}

export interface UpdateSettingsRequest {
  maxUploads?: number | null;
  maxFileSize?: number | null;
  maxStorageLimit?: number | null;
  maxShortLinks?: number | null;
  uploadDomainId?: string | null;
  customSubdomain?: string | null;
  useCustomWords?: boolean | null;
  defaultExpirationDays?: number | null;
  defaultMaxViews?: number | null;
  globalParticleConfig?: string | null;
}

export interface UpdateEmbedSettingsRequest {
  embedTitle?: string | null;
  embedDescription?: string | null;
  embedColor?: string | null;
  embedAuthor?: string | null;
  embedFooter?: string | null;
  showFileInfo?: boolean | null;
  showUploadDate?: boolean | null;
  showUserStats?: boolean | null;
  customDomain?: string | null;
}

export interface BioLinkDto {
  id: string;
  title: string;
  url: string;
  icon: string | null;
  order: number;
  isActive: boolean;
  clicks: number;
}

export interface BioResponse {
  username: string | null;
  displayName: string | null;
  description: string | null;
  profileImage: string | null;
  backgroundImage: string | null;
  backgroundColor: string | null;
  textColor: string | null;
  accentColor: string | null;
  customCss: string | null;
  spotifyTrack: string | null;
  isPublic: boolean;
  views: number;
  gradientConfig: string | null;
  particleConfig: string | null;
  discordUserId: string | null;
  showDiscord: boolean;
  discordConfig: string | null;
  links: BioLinkDto[];
}

export interface UpdateBioRequest {
  username?: string | null;
  displayName?: string | null;
  description?: string | null;
  profileImage?: string | null;
  backgroundImage?: string | null;
  backgroundColor?: string | null;
  textColor?: string | null;
  accentColor?: string | null;
  customCss?: string | null;
  spotifyTrack?: string | null;
  isPublic: boolean;
  gradientConfig?: string | null;
  particleConfig?: string | null;
  discordUserId?: string | null;
  showDiscord: boolean;
  discordConfig?: string | null;
}

export interface CreateBioLinkRequest {
  title: string;
  url: string;
  icon?: string | null;
  order?: number | null;
  isActive?: boolean | null;
}

export type UpdateBioLinkRequest = Partial<CreateBioLinkRequest>;

export interface BioLinkMutationResponse {
  success: boolean;
  id: string | null;
  error: string | null;
}

export interface AdminUserDto {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  createdAt: string;
  isApproved: boolean;
  isAdmin: boolean;
  storageUsed: number;
  uploads: number;
  apiKeys: number;
}

export interface DomainDto {
  id: string;
  domain: string;
  name: string;
  isActive: boolean;
  isDefault: boolean;
  supportsSubdomains: boolean;
}

export interface EventDto {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  metadata: string | null;
  userId: string | null;
  createdAt: string;
}

export interface AdminHealthResponse {
  status: string;
  databaseReachable: boolean;
  checkedAtUtc: string;
}

export interface CreateUploadResponse {
  url: string | null;
  deletionUrl: string | null;
  thumbnailUrl: string | null;
  error: string | null;
}

export interface CreateShortLinkResponse {
  code: string | null;
  url: string | null;
  target: string | null;
  expiresAt: string | null;
  error: string | null;
}

/** One day of aggregated analytics (mirrors backend `DailyMetricDto`). */
export interface DailyMetric {
  date: string;
  totalViews: number;
  uniqueViews: number;
  totalDownloads: number;
  uniqueDownloads: number;
  uploadsCount: number;
  usersRegistered: number;
}

export interface TopUploadAnalytics {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  shortCode: string;
  createdAt: string;
  views: number;
  downloads: number;
  weeklyViews: number;
  weeklyDownloads: number;
  analytics: DailyMetric[];
}

export interface AnalyticsOverviewResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    maxFileSize: number;
    maxStorageLimit: number | null;
    storageUsed: number;
  };
  userAnalytics: DailyMetric[];
  topUploadsAnalytics: TopUploadAnalytics[];
  summary: {
    totalFiles: number;
    totalViews: number;
    totalDownloads: number;
  };
}

export interface AdminAnalyticsResponse {
  analytics: DailyMetric[];
  summary: {
    totalUsers: number;
    approvedUsers: number;
    totalUploads: number;
    totalStorage: number;
    totalViews: number;
    totalDownloads: number;
    totalShortLinks: number;
    activeApiKeys: number;
  };
}

export interface UploadViewLog {
  ipAddress: string;
  userAgent: string | null;
  referer: string | null;
  viewedAt: string;
}

export interface UploadDownloadLog {
  ipAddress: string;
  userAgent: string | null;
  referer: string | null;
  downloadedAt: string;
}

export interface UploadAnalyticsResponse {
  upload: {
    id: string;
    originalName: string;
    mimeType: string;
    size: number;
    shortCode: string;
    createdAt: string;
    views: number;
    downloads: number;
    lastViewed: string | null;
    lastDownloaded: string | null;
  };
  analytics: DailyMetric[];
  viewLogs: UploadViewLog[];
  downloadLogs: UploadDownloadLog[];
  referrerStats: Record<string, number>;
  deviceStats: Record<string, number>;
  hourlyActivity: { hour: number; count: number }[];
  totalViews: number;
  totalDownloads: number;
  origin: string;
}

// ---------------------------------------------------------------------------
// Grouped, typed endpoint methods
// ---------------------------------------------------------------------------

/** Options that only carry SSR pass-through context (cookie/token/signal). */
type CallOpts = Pick<RequestOptions, "cookie" | "token" | "signal">;

export const api = {
  auth: {
    me: (o?: CallOpts) => apiFetch<MeResponse>("/auth/me", o),
    logout: (o?: CallOpts) =>
      apiFetch<void>("/auth/logout", { ...o, method: "POST" }),
    /** URL the browser should navigate to in order to start Discord OAuth. */
    discordLoginUrl: (returnTo?: string) =>
      buildUrl("/auth/discord/login", returnTo ? { returnTo } : undefined),
  },

  dashboard: {
    summary: (o?: CallOpts) =>
      apiFetch<DashboardSummary>("/dashboard/summary", o),
    uploads: (o?: CallOpts) =>
      apiFetch<{ uploads: UploadListItem[] }>("/dashboard/uploads", o),
    deleteUpload: (id: string, o?: CallOpts) =>
      apiFetch<void>(`/dashboard/uploads/${id}`, { ...o, method: "DELETE" }),
  },

  uploads: {
    list: (o?: CallOpts) =>
      apiFetch<{ uploads: UploadListItem[] }>("/uploads", o),
    get: (id: string, o?: CallOpts) =>
      apiFetch<UploadListItem>(`/uploads/${id}`, o),
    delete: (id: string, o?: CallOpts) =>
      apiFetch<void>(`/uploads/${id}`, { ...o, method: "DELETE" }),
    create: (form: FormData, o?: CallOpts) =>
      apiFetch<CreateUploadResponse>("/uploads", {
        ...o,
        method: "POST",
        body: form,
      }),
  },

  shortLinks: {
    list: (o?: CallOpts) =>
      apiFetch<{ links: ShortLinkListItem[] }>("/short-links", o),
    create: (
      body: {
        url: string;
        code?: string | null;
        expiresDays?: number | null;
        maxClicks?: number | null;
      },
      o?: CallOpts,
    ) =>
      apiFetch<CreateShortLinkResponse>("/short-links", {
        ...o,
        method: "POST",
        body,
      }),
    delete: (id: string, o?: CallOpts) =>
      apiFetch<void>(`/short-links/${id}`, { ...o, method: "DELETE" }),
  },

  apiKeys: {
    list: (o?: CallOpts) =>
      apiFetch<{ apiKeys: ApiKeyListItem[] }>("/api-keys", o),
    create: (name: string | null, o?: CallOpts) =>
      apiFetch<CreateApiKeyResponse>("/api-keys", {
        ...o,
        method: "POST",
        body: { name },
      }),
    delete: (id: string, o?: CallOpts) =>
      apiFetch<void>(`/api-keys/${id}`, { ...o, method: "DELETE" }),
  },

  settings: {
    get: (o?: CallOpts) => apiFetch<UserSettings>("/settings", o),
    update: (body: UpdateSettingsRequest, o?: CallOpts) =>
      apiFetch<{ success: boolean }>("/settings", {
        ...o,
        method: "PUT",
        body,
      }),
    updateEmbed: (body: UpdateEmbedSettingsRequest, o?: CallOpts) =>
      apiFetch<{ success: boolean }>("/settings/embed", {
        ...o,
        method: "PUT",
        body,
      }),
    updateParticles: (globalParticleConfig: string | null, o?: CallOpts) =>
      apiFetch<{ success: boolean }>("/settings/particles", {
        ...o,
        method: "PUT",
        body: { globalParticleConfig },
      }),
    deleteAccount: (o?: CallOpts) =>
      apiFetch<void>("/settings/account", { ...o, method: "DELETE" }),
  },

  bio: {
    me: (o?: CallOpts) => apiFetch<BioResponse>("/bio/me", o),
    update: (body: UpdateBioRequest, o?: CallOpts) =>
      apiFetch<{ success: boolean; error?: string | null }>("/bio/me", {
        ...o,
        method: "PUT",
        body,
      }),
    createLink: (body: CreateBioLinkRequest, o?: CallOpts) =>
      apiFetch<BioLinkMutationResponse>("/bio/links", {
        ...o,
        method: "POST",
        body,
      }),
    updateLink: (id: string, body: UpdateBioLinkRequest, o?: CallOpts) =>
      apiFetch<BioLinkMutationResponse>(`/bio/links/${id}`, {
        ...o,
        method: "PUT",
        body,
      }),
    deleteLink: (id: string, o?: CallOpts) =>
      apiFetch<void>(`/bio/links/${id}`, { ...o, method: "DELETE" }),
  },

  publicBio: {
    get: (username: string, o?: CallOpts) =>
      apiFetch<BioResponse>(`/public/bio/${encodeURIComponent(username)}`, o),
    view: (username: string, o?: CallOpts) =>
      apiFetch<void>(
        `/public/bio/${encodeURIComponent(username)}/view`,
        { ...o, method: "POST" },
      ),
    clickLink: (id: string, o?: CallOpts) =>
      apiFetch<void>(`/public/bio-links/${id}/click`, {
        ...o,
        method: "POST",
      }),
  },

  admin: {
    users: (o?: CallOpts) =>
      apiFetch<{ users: AdminUserDto[] }>("/api/admin/users", o),
    updateUser: (
      id: string,
      body: {
        isApproved?: boolean;
        isAdmin?: boolean;
        maxUploads?: number | null;
        maxFileSize?: number | null;
        maxStorageLimit?: number | null;
      },
      o?: CallOpts,
    ) =>
      apiFetch<{ success: boolean }>(`/api/admin/users/${id}`, {
        ...o,
        method: "PUT",
        body,
      }),
    analytics: (o?: CallOpts) =>
      apiFetch<AdminAnalyticsResponse>("/api/admin/analytics", o),
    events: (o?: CallOpts) =>
      apiFetch<{ events: EventDto[] }>("/api/admin/events", o),
    createEvent: (
      body: {
        type: string;
        severity: string;
        title: string;
        message: string;
        metadata?: string | null;
      },
      o?: CallOpts,
    ) =>
      apiFetch<{ id: string }>("/api/admin/events", {
        ...o,
        method: "POST",
        body,
      }),
    deleteEvent: (id: string, o?: CallOpts) =>
      apiFetch<void>(`/api/admin/events/${id}`, { ...o, method: "DELETE" }),
    health: (o?: CallOpts) =>
      apiFetch<AdminHealthResponse>("/api/admin/health", o),
    bioLimits: (o?: CallOpts) => apiFetch<unknown>("/api/admin/bio-limits", o),
    updateBioLimits: (userId: string, body: unknown, o?: CallOpts) =>
      apiFetch<{ success: boolean }>(`/api/admin/bio-limits/${userId}`, {
        ...o,
        method: "PUT",
        body,
      }),
  },

  domains: {
    list: (o?: CallOpts) =>
      apiFetch<{ domains: DomainDto[] }>("/api/admin/domains", o),
    create: (
      body: {
        domain: string;
        name: string;
        isActive?: boolean;
        isDefault?: boolean;
        supportsSubdomains?: boolean;
      },
      o?: CallOpts,
    ) =>
      apiFetch<{ id: string }>("/api/admin/domains", {
        ...o,
        method: "POST",
        body,
      }),
    update: (id: string, body: Partial<DomainDto>, o?: CallOpts) =>
      apiFetch<{ success: boolean }>(`/api/admin/domains/${id}`, {
        ...o,
        method: "PUT",
        body,
      }),
    delete: (id: string, o?: CallOpts) =>
      apiFetch<void>(`/api/admin/domains/${id}`, { ...o, method: "DELETE" }),
  },

  analytics: {
    overview: (o?: CallOpts) =>
      apiFetch<AnalyticsOverviewResponse>("/analytics", o),
    upload: (shortCode: string, o?: CallOpts) =>
      apiFetch<UploadAnalyticsResponse>(
        `/analytics/uploads/${shortCode}`,
        o,
      ),
  },

  oembed: {
    get: (url: string, o?: CallOpts) =>
      apiFetch<unknown>("/oembed", { ...o, query: { url } }),
  },

  stats: {
    /** Anonymized platform stats for the public landing page. */
    public: (o?: CallOpts) =>
      apiFetch<PublicStats>("/public/stats", o),
  },
};

export interface PublicStatsDay {
  date: string;
  totalViews: number;
  uploadsCount: number;
  usersRegistered: number;
}

export interface PublicStats {
  totalUploads: number;
  totalViews: number;
  totalUsers: number;
  weeklyStats: { views: number; uploads: number; users: number };
  analyticsData: PublicStatsDay[];
  recentUploads: {
    id: string;
    createdAt: string;
    mimeType: string;
    views: number;
  }[];
}

/**
 * Build a {@link CallOpts} object that forwards the incoming request's cookie
 * from a Qwik `RequestEventBase`. Use inside `routeLoader$`/`routeAction$`.
 */
export function serverAuth(requestEvent: {
  request: { headers: { get(name: string): string | null } };
}): CallOpts {
  return { cookie: requestEvent.request.headers.get("cookie") };
}
