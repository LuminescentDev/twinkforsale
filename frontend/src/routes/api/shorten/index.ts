import type { RequestHandler } from "@builder.io/qwik-city";
import { db } from "~/lib/db";
import { generateUniqueLinkCode, isValidHttpUrl } from "~/lib/shortener";

export const onPost: RequestHandler = async ({ request, json }) => {
  // API key auth (same as uploads)
  const authHeader = request.headers.get("Authorization");
  const apiKey = authHeader?.replace("Bearer ", "");
  if (!apiKey) throw json(401, { error: "API key required in Authorization header" });

  const keyRecord = await db.apiKey.findUnique({
    where: { key: apiKey, isActive: true }
  });
  if (!keyRecord) throw json(401, { error: "Invalid or inactive API key." });

  const user = await db.user.findUnique({
    where: { id: keyRecord.userId },
    include: { settings: true }
  });
  if (!user) throw json(401, { error: "User not found" });
  if (!user.isApproved) throw json(403, { error: "Account pending approval." });

  const userId = user.id;

  // Update last used timestamp (best-effort)
  await db.apiKey.update({ where: { id: keyRecord.id }, data: { lastUsed: new Date() } });

  const body = await request.json().catch(() => null);
  if (!body || typeof body.url !== 'string') {
    throw json(400, { error: "Missing 'url' in request body" });
  }

  const targetUrl = body.url.trim();
  const desiredCode = typeof body.code === 'string' ? body.code.trim() : undefined;
  const expiresDays = typeof body.expiresDays === 'number' ? body.expiresDays : undefined;
  const maxClicks = typeof body.maxClicks === 'number' ? body.maxClicks : undefined;

  if (!isValidHttpUrl(targetUrl)) {
    throw json(400, { error: "Invalid URL. Must start with http(s)://" });
  }

  // Check for existing link for this URL for this user
  const existing = await (db as any).shortLink.findFirst({ where: { userId, url: targetUrl } });
  if (existing) {
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    const base = host ? `${proto}://${host}` : '';
    const existingShortUrl = base ? `${base}/l/${existing.code}` : `/l/${existing.code}`;
    throw json(409, { error: 'duplicate_url', message: 'A short link already exists for this URL', existing: { code: existing.code, url: targetUrl, shortUrl: existingShortUrl } });
  }

  // Enforce per-user limit
  const maxShort = (user.settings as any)?.maxShortLinks ?? 500;
  const currentCount = await (db as any).shortLink.count({ where: { userId } });
  if (currentCount >= maxShort) {
    throw json(429, { error: "Short link limit exceeded" });
  }

  // Generate or validate code
  let code: string;
  if (desiredCode) {
    if (!/^[a-zA-Z0-9_-]{3,32}$/.test(desiredCode)) {
      throw json(400, { error: "Custom code must be 3-32 characters: letters, numbers, - or _" });
    }
  const exists = await (db as any).shortLink.findUnique({ where: { code: desiredCode } });
    if (exists) throw json(409, { error: "Code already in use" });
    code = desiredCode;
  } else {
  const useCuteWords = user.settings?.useCustomWords ?? false;
    code = await generateUniqueLinkCode(useCuteWords);
  }

  const expiresAt = typeof expiresDays === 'number' && expiresDays > 0
    ? new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000)
    : null;

  // Create record
  await (db as any).shortLink.create({
    data: {
      code,
      url: targetUrl,
      userId,
      expiresAt,
      maxClicks: typeof maxClicks === 'number' ? maxClicks : null,
    }
  });

  // Build short URL based on current origin if available in headers
  // Fallback to environment base URL if needed
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const base = host ? `${proto}://${host}` : '';
  const shortUrl = base ? `${base}/l/${code}` : `/l/${code}`;

  throw json(201, { code, url: shortUrl, target: targetUrl, expiresAt });
};
