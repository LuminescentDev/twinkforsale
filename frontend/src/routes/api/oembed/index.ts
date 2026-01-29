import type { RequestHandler } from "@builder.io/qwik-city";

export const onGet: RequestHandler = async ({ url, json, env }) => {
  // Use internal backend URL (e.g., http://backend:5000 in Docker, or http://localhost:5000 locally)
  const backendUrl = env.get("BACKEND_URL") || "http://localhost:5000";
  const query = url.searchParams.toString();
  const response = await fetch(`${backendUrl}/oembed${query ? `?${query}` : ""}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw json(response.status, { error: errorText || response.statusText });
  }

  const data = await response.json();
  throw json(200, data);
};
