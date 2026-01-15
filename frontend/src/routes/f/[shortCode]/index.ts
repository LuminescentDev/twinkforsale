import type { RequestHandler } from "@builder.io/qwik-city";

export const onRequest: RequestHandler = async ({ params, redirect, url }) => {
  const shortCode = params.shortCode;
  if (!shortCode) {
    throw redirect(302, "/");
  }

  const apiUrl = process.env.API_URL || "http://localhost:5000";
  const target = `${apiUrl}/f/${shortCode}${url.search || ""}`;
  throw redirect(302, target);
};
