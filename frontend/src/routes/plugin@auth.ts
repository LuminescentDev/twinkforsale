import type { RequestHandler } from "@builder.io/qwik-city";
import { routeLoader$, globalAction$ } from "@builder.io/qwik-city";
import { createServerApi, type CurrentUserResponse } from "~/lib/api/server";

// Extend the shared map type
declare module "@builder.io/qwik-city" {
  interface SharedMap {
    user: CurrentUserResponse | null;
  }
}

// Auth middleware that checks JWT cookie with the backend
export const onRequest: RequestHandler = async (requestEvent) => {
  const { sharedMap, cookie, redirect, url } = requestEvent;

  // Skip auth check for public routes
  const publicPaths = ["/", "/privacy", "/terms", "/dmca", "/acceptable-use", "/f/", "/l/"];
  const isPublicPath = publicPaths.some(path =>
    url.pathname === path || url.pathname.startsWith(path)
  );

  // Also allow the auth callback route
  if (url.pathname.startsWith("/api/auth/")) {
    return;
  }

  // Check if user has access token cookie
  const accessToken = cookie.get("access_token");

  if (!accessToken && !isPublicPath) {
    // No token and accessing protected route - redirect to login
    const rawApiUrl = requestEvent.env.get("API_URL") || "http://localhost:5000";
    const apiUrl = rawApiUrl.replace(/\/+$/, '').replace(/\/api$/, ''); // Remove trailing slashes and /api
    throw redirect(302, `${apiUrl}/api/auth/discord`);
  }

  if (accessToken) {
    try {
      // Validate token with the backend
      const api = createServerApi(requestEvent);
      const user = await api.auth.getCurrentUser();
      sharedMap.set("user", user);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Token invalid or expired
      sharedMap.set("user", null);

      if (!isPublicPath) {
        // Clear invalid cookies and redirect to login
        cookie.delete("access_token", { path: "/" });
        cookie.delete("refresh_token", { path: "/" });
        const rawApiUrl = requestEvent.env.get("API_URL") || "http://localhost:5000";
        const apiUrl = rawApiUrl.replace(/\/+$/, '').replace(/\/api$/, ''); // Remove trailing slashes and /api
        throw redirect(302, `${apiUrl}/api/auth/discord`);
      }
    }
  } else {
    sharedMap.set("user", null);
  }
};

// Session loader - gets current user from shared map
export const useSession = routeLoader$(async (requestEvent) => {
  const user = requestEvent.sharedMap.get("user");
  return user;
});

// Sign in action - redirects to Discord OAuth
export const useSignIn = globalAction$(async (_, requestEvent) => {
  const rawApiUrl = requestEvent.env.get("API_URL") || "http://localhost:5000";
  const apiUrl = rawApiUrl.replace(/\/+$/, '').replace(/\/api$/, ''); // Remove trailing slashes and /api
  throw requestEvent.redirect(302, `${apiUrl}/api/auth/discord`);
});

// Sign out action - clears cookies and redirects to home
export const useSignOut = globalAction$(async (_, requestEvent) => {
  const { cookie } = requestEvent;

  // Clear auth cookies
  cookie.delete("access_token", { path: "/" });
  cookie.delete("refresh_token", { path: "/" });

  // Redirect to home
  throw requestEvent.redirect(302, "/");
});
