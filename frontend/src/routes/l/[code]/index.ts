import type { RequestHandler } from "@builder.io/qwik-city";

export const onRequest: RequestHandler = async (ev) => {
  const code = ev.params.code;
  if (!code) {
    ev.status(404);
    return;
  }

  const apiUrl = process.env.API_URL || "http://localhost:5000";
  throw ev.redirect(302, `${apiUrl}/l/${code}`);
};
