import type { RequestHandler } from "@builder.io/qwik-city";
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
    const apiUrl = process.env.API_URL || "http://localhost:5000";
    throw redirect(302, `${apiUrl}/api/auth/discord`);
  }

  if (accessToken) {
    try {
      // Validate token with the backend
      const api = createServerApi(requestEvent);
      const user = await api.auth.getCurrentUser();
      sharedMap.set("user", user);
    } catch (error) {
      // Token invalid or expired
      sharedMap.set("user", null);

      if (!isPublicPath) {
        // Clear invalid cookies and redirect to login
        cookie.delete("access_token", { path: "/" });
        cookie.delete("refresh_token", { path: "/" });
        const apiUrl = process.env.API_URL || "http://localhost:5000";
        throw redirect(302, `${apiUrl}/api/auth/discord`);
      }
    }
  } else {
    sharedMap.set("user", null);
  }
};

// Helper hooks for components
import { routeLoader$ } from "@builder.io/qwik-city";

export const useSession = routeLoader$(async (requestEvent) => {
  const user = requestEvent.sharedMap.get("user");
  return { user };
});

export const useSignOut = routeLoader$(async () => {
  // This will be called client-side to sign out
  return {
    signOut: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      window.location.href = "/";
    },
  };
});
