# Removed /api Prefix from Backend

## What Changed

Removed the `/api` prefix from all backend endpoints to simplify the API structure.

### Before:
```
https://tfsbackend.bwmp.dev/api/public/stats
https://tfsbackend.bwmp.dev/api/auth/discord
https://tfsbackend.bwmp.dev/api/uploads
```

### After:
```
https://tfsbackend.bwmp.dev/public/stats
https://tfsbackend.bwmp.dev/auth/discord
https://tfsbackend.bwmp.dev/uploads
```

---

## Files Changed

### Backend

1. **`backend/Program.cs`**
   - Removed `c.Endpoints.RoutePrefix = "api";`
   - Endpoints now use their own routes directly

### Frontend

2. **`frontend/src/routes/index.tsx`**
   - Updated public stats fetch: `/api/public/stats` → `/public/stats`
   - Updated OAuth link: `/api/auth/discord` → `/auth/discord`

3. **`frontend/src/components/layout/navigation.tsx`**
   - Updated sign-in links: `/api/auth/discord` → `/auth/discord`

4. **`frontend/src/routes/plugin@auth.ts`**
   - Updated redirect URLs: `/api/auth/discord` → `/auth/discord`

5. **`frontend/src/lib/api/client.ts`**
   - Removed `/api` from `API_BASE_URL`

6. **`frontend/src/routes/api/upload/index.ts`**
   - Proxy route: `/api/upload` → `/upload`

7. **`frontend/src/routes/api/shorten/index.ts`**
   - Proxy route: `/api/shorten` → `/shorten`

8. **`frontend/src/routes/api/oembed/index.ts`**
   - Proxy route: `/api/oembed` → `/oembed`

---

## Configuration Updates Required

### 1. Discord OAuth App Configuration

You MUST update your Discord OAuth app redirect URI:

**Old Redirect URI:**
```
https://tfsbackend.bwmp.dev/api/auth/callback
```

**New Redirect URI:**
```
https://tfsbackend.bwmp.dev/auth/callback
```

**How to update:**

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to **OAuth2** → **Redirects**
4. Update the redirect URI to remove `/api`:
   - `https://tfsbackend.bwmp.dev/auth/callback`
5. Click **Save Changes**

### 2. Backend Configuration

Update `backend/appsettings.json`:

```json
{
  "Discord": {
    "ClientId": "your-discord-client-id",
    "ClientSecret": "your-discord-client-secret",
    "RedirectUri": "https://tfsbackend.bwmp.dev/auth/callback"
  }
}
```

### 3. Environment Variables

Your `API_URL` environment variable stays the same:
```env
API_URL=https://tfsbackend.bwmp.dev
```

No `/api` suffix needed anymore.

---

## Deployment Steps

### 1. Deploy Backend

```bash
cd backend
dotnet build
# Restart backend service
```

**Or with Docker:**
```bash
docker-compose up -d --build backend
```

### 2. Deploy Frontend

```bash
cd frontend
pnpm build
# Restart frontend service
```

**Or with Docker:**
```bash
docker-compose up -d --build frontend
```

### 3. Update Discord OAuth Configuration

Follow the steps in "Configuration Updates Required" section above.

---

## Testing

After deploying:

### Test Backend Directly

```bash
# Public stats (no auth required)
curl https://tfsbackend.bwmp.dev/public/stats

# Should return JSON with stats
```

### Test OAuth Flow

1. Visit: https://twink.stage.bwmp.dev/
2. Click "Get Started"
3. Should redirect to Discord OAuth
4. Authorize
5. Should redirect back to your site logged in

### Test API Endpoints

All endpoints work without `/api` prefix:

- ✅ `/auth/discord` - Discord OAuth
- ✅ `/auth/callback` - OAuth callback
- ✅ `/public/stats` - Public statistics
- ✅ `/uploads` - Upload file
- ✅ `/admin/users` - Admin endpoints
- ✅ `/bio/public/{username}` - Public bio pages

---

## Troubleshooting

### Error: "Redirect URI mismatch"

**Cause:** Discord OAuth app still has the old redirect URI with `/api`

**Fix:** Update Discord app redirect URI to `https://tfsbackend.bwmp.dev/auth/callback`

### Error: "404 Not Found" on OAuth callback

**Cause:** Backend configuration still has `/api` in redirect URI

**Fix:** Update `backend/appsettings.json`:
```json
{
  "Discord": {
    "RedirectUri": "https://tfsbackend.bwmp.dev/auth/callback"
  }
}
```

### Error: Frontend can't reach backend

**Cause:** Frontend might be adding `/api` prefix

**Fix:** Check that `API_URL` environment variable doesn't have `/api`:
```env
# Correct:
API_URL=https://tfsbackend.bwmp.dev

# Wrong:
API_URL=https://tfsbackend.bwmp.dev/api
```

---

## API Endpoint List

All endpoints are now at the root level:

### Public Endpoints
- `GET /public/stats` - Public statistics
- `GET /oembed` - oEmbed for rich embeds
- `GET /bio/public/{username}` - Public bio pages
- `GET /files/{shortCode}` - Serve files
- `GET /l/{code}` - Redirect short links

### Authentication
- `GET /auth/discord` - Start Discord OAuth
- `GET /auth/callback` - OAuth callback
- `POST /auth/logout` - Sign out

### User Endpoints (Auth Required)
- `GET /users/me` - Current user
- `GET /uploads` - List uploads
- `POST /upload` - Upload file
- `GET /api-keys` - List API keys
- `POST /api-keys` - Create API key
- `GET /bio` - Get bio settings
- `PUT /bio` - Update bio

### Admin Endpoints (Admin Only)
- `GET /admin/users` - List users
- `PUT /admin/users/{id}` - Update user
- `GET /admin/analytics` - System analytics
- `GET /admin/domains` - List domains

---

## Benefits of Removing /api Prefix

1. **Cleaner URLs** - Shorter, simpler endpoint paths
2. **Less Configuration** - No need to remember to add/remove `/api`
3. **Standard Practice** - Many APIs don't use `/api` prefix
4. **Easier Migration** - Less URL manipulation needed

---

## Summary

- ✅ Backend routes no longer have `/api` prefix
- ✅ Frontend updated to call endpoints without `/api`
- ✅ OAuth redirects updated
- ⚠️ **Action Required:** Update Discord OAuth redirect URI
- ⚠️ **Action Required:** Update backend `appsettings.json`

**After updating Discord OAuth settings and deploying, your app will work perfectly!**
