import type { RequestHandler } from "@builder.io/qwik-city";

export const onGet: RequestHandler = async ({ url, json }) => {
  const apiUrl = process.env.API_URL || "http://localhost:5000";
  const query = url.searchParams.toString();
  const response = await fetch(`${apiUrl}/oembed${query ? `?${query}` : ""}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw json(response.status, { error: errorText || response.statusText });
  }

  const data = await response.json();
  throw json(200, data);
};
