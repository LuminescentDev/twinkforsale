import type { RequestHandler } from "@builder.io/qwik-city";
import { db } from "~/lib/db";

export const onRequest: RequestHandler = async (ev) => {
  const { params } = ev;
  const code = params.code;
  if (!code) {
    ev.status(404);
    return;
  }

  const link = await (db as any).shortLink.findUnique({ where: { code } });

  if (!link) {
    ev.status(404);
    return;
  }

  // Expiration / click limit checks
  const now = new Date();
  if (link.expiresAt && new Date(link.expiresAt) < now) {
    ev.status(404);
    return;
  }
  if (typeof link.maxClicks === 'number' && link.maxClicks >= 0 && link.clicks >= link.maxClicks) {
    ev.status(404);
    return;
  }

  // Increment click analytics (best-effort)
  try {
    await (db as any).shortLink.update({
      where: { id: link.id },
      data: { clicks: { increment: 1 }, lastClicked: new Date() }
    });
  } catch (e) {
    console.error('Failed to update short link clicks', e);
  }

  // Redirect to target URL
  throw ev.redirect(302, link.url);
};
