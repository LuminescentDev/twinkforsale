import type { RequestHandler } from "@builder.io/qwik-city";

export const onRequest: RequestHandler = async (ev) => {
  const code = ev.params.code;
  if (!code) {
    ev.status(404);
    return;
  }

  // Use internal backend URL (e.g., http://backend:5000 in Docker, or http://localhost:5000 locally)
  const backendUrl = ev.env.get("BACKEND_URL") || "http://localhost:5000";
  throw ev.redirect(302, `${backendUrl}/l/${code}`);
};
