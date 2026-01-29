import type { RequestHandler } from "@builder.io/qwik-city";

export const onRequest: RequestHandler = async ({ params, redirect, url, env }) => {
  const shortCode = params.shortCode;
  if (!shortCode) {
    throw redirect(302, "/");
  }

  // Use internal backend URL (e.g., http://backend:5000 in Docker, or http://localhost:5000 locally)
  const backendUrl = env.get("BACKEND_URL") || "http://localhost:5000";
  const target = `${backendUrl}/f/${shortCode}${url.search || ""}`;
  throw redirect(302, target);
};
