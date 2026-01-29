# SSR Fetch Fix - FRONTEND_URL Environment Variable

## Problem

When the frontend was deployed behind a proxy/load balancer (e.g., `twink.stage.bwmp.dev`), SSR code was trying to fetch from the **public domain** using `requestEvent.url.origin`. This caused issues because:

1. The frontend server couldn't reach itself at the public domain
2. Internal networking in Docker uses container names, not public domains
3. Load balancers/proxies might not route internal requests correctly

## Solution

Added a new **`FRONTEND_URL`** environment variable that specifies the internal address the frontend server should use when making SSR requests to itself.

### Environment Variable

```bash
# .env
FRONTEND_URL="http://localhost:3000"  # Development
# FRONTEND_URL="http://frontend:3000"  # Docker
```

### Behavior

- **SSR Fetches**: Use `FRONTEND_URL` (or fallback to `http://localhost:${PORT}`)
- **Display URLs**: Still use `requestEvent.url.origin` (the public domain)

## Files Updated

### Core Utility (NEW)
- ✅ `frontend/src/lib/ssr-fetch.ts` - New utility for SSR fetches

### API Client Helpers
- ✅ `frontend/src/lib/api/server.ts` - Server-side API wrapper
- ✅ `frontend/src/lib/discord.server.ts` - Discord helper
- ✅ `frontend/src/lib/bio-limits.server.ts` - Bio limits helper
- ✅ `frontend/src/lib/bio.server.ts` - Bio helper

### Route Files (routeLoader$ and routeAction$)
- ✅ `frontend/src/routes/index.tsx` - Homepage public stats
- ✅ `frontend/src/routes/admin/bio-limits/index.tsx` - Admin bio limits
- ✅ `frontend/src/routes/admin/events/index.tsx` - Admin events
- ✅ `frontend/src/routes/admin/health/index.tsx` - Admin health (2 occurrences)
- ✅ `frontend/src/routes/dashboard/embed/index.tsx` - Embed settings
- ✅ `frontend/src/routes/dashboard/uploads/index.tsx` - Upload deletion
- ✅ `frontend/src/routes/setup/sharex/index.tsx` - ShareX setup (2 occurrences)
- ✅ `frontend/src/routes/upload/index.tsx` - Upload page

### Configuration Files
- ✅ `frontend/.env.example` - Added `FRONTEND_URL` documentation
- ✅ `docker/docker-compose.yml` - Added `FRONTEND_URL=http://frontend:3000`
- ✅ `frontend/docker-compose.frontend.yml` - Added `FRONTEND_URL` env var

## Code Pattern

### Before (BROKEN)
```typescript
// ❌ Uses public domain - fails behind proxies
const origin = requestEvent.url.origin;
const response = await fetch(`${origin}/api/users/me`, {
  headers: { Cookie: cookies }
});
```

### After (FIXED)
```typescript
// ✅ Uses internal address - works everywhere
const frontendUrl = requestEvent.env.get('FRONTEND_URL');
const origin = frontendUrl || `http://localhost:${requestEvent.env.get('PORT') || '3000'}`;
const response = await fetch(`${origin}/api/users/me`, {
  headers: { Cookie: cookies }
});
```

## When to Use Each

### Use `FRONTEND_URL` (Internal Address)
- ✅ SSR fetches to frontend's own API routes
- ✅ `routeLoader$` and `routeAction$` server-side code
- ✅ Any `await fetch()` in SSR context

### Use `requestEvent.url.origin` (Public Domain)
- ✅ Generating URLs to show to users
- ✅ ShareX config file generation
- ✅ Passing origin to components for display
- ✅ Creating public links

## Testing

### Development
```bash
# .env
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:5000"
```

### Docker
```bash
# docker-compose.yml
FRONTEND_URL="http://frontend:3000"
BACKEND_URL="http://backend:5000"
```

### Production (behind proxy)
```bash
# Example: Caddy/Nginx reverse proxy
FRONTEND_URL="http://localhost:3000"  # Internal address
BACKEND_URL="http://backend:5000"     # Internal backend
# Public domain: https://twink.forsale (handled by proxy)
```

## Verification

After setting `FRONTEND_URL`, check logs for:
```
Fetching public stats from: http://localhost:3000/api/public/stats
```

Instead of:
```
Fetching public stats from: https://twink.stage.bwmp.dev/api/public/stats
```

## Future Improvements

Consider consolidating all the duplicate `serverRequest` functions in route files to use the shared `ssrFetch()` utility from `src/lib/ssr-fetch.ts`.

## Related Issues

- SSR requests timing out when using public domain
- 502 errors on homepage due to failed stats fetch
- Docker container unable to reach itself via public DNS
