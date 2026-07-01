/**
 * Browser-side auth helpers that talk to the backend auth endpoints.
 *
 * The backend owns Discord OAuth and the browser session (cookie/JWT). The
 * frontend only needs to (a) start the OAuth flow, (b) read the current user,
 * and (c) log out. All server-side user resolution happens through
 * `api.auth.me()` inside route loaders (see `api-client.ts`).
 */
import { api, ApiError, type MeResponse } from "./api-client";

/** Start Discord OAuth by navigating the browser to the backend login route. */
export function loginWithDiscord(returnTo?: string): void {
  if (typeof window === "undefined") return;
  window.location.href = api.auth.discordLoginUrl(
    returnTo ?? window.location.pathname,
  );
}

/** Log out via the backend, then send the user home. */
export async function logout(): Promise<void> {
  try {
    await api.auth.logout();
  } finally {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  }
}

/**
 * Fetch the current user, returning `null` when unauthenticated (401/404)
 * instead of throwing. Safe to call from loaders (pass cookie via opts) or the
 * browser.
 */
export async function getCurrentUser(opts?: {
  cookie?: string | null;
}): Promise<MeResponse | null> {
  try {
    return await api.auth.me(opts);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 404)) {
      return null;
    }
    throw err;
  }
}
