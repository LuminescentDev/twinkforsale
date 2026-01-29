import type { RequestHandler } from "@builder.io/qwik-city";

export const onPost: RequestHandler = async ({ request, json }) => {
  const apiUrl = process.env.API_URL || "http://localhost:5000";
  const authHeader = request.headers.get("Authorization") || "";
  const body = await request.text();

  const response = await fetch(`${apiUrl}/shorten`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw json(response.status, { error: errorText || response.statusText });
  }

  const data = await response.json();
  throw json(201, data);
};
