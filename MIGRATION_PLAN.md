# Frontend / Backend Split Migration Plan

Goal: split this Qwik/Qwik City app into a client-focused frontend and a dedicated C# FastEndpoints backend. All API, database, auth, storage, analytics, redirect, and server-side behavior should move to the backend. The frontend should retain UI, client state, browser-safe utilities, and API-client calls only.

> Implementation rule: all UI, styling, layout, responsive design, animation, and UX polish work must be delegated to the UI agent. Backend/API/data-model/integration work stays with the primary engineering agent.

---

## Current State

The current app mixes frontend and backend concerns in one Qwik project.

### Frontend-heavy areas

- `src/components/**`
- `src/routes/**/*.tsx` markup and interactive UI
- `src/global.css`
- client-safe stores/hooks/utilities under `src/lib/**`
- `public/**`

### Backend-heavy areas to migrate

- `src/routes/api/upload/index.ts`
- `src/routes/api/shorten/index.ts`
- `src/routes/api/oembed/index.ts`
- `src/routes/f/[shortCode]/index.ts`
- `src/routes/l/[code]/index.ts`
- `src/routes/plugin@auth.ts`
- Qwik `routeLoader$`, `routeAction$`, `server$`, and `RequestHandler` logic inside pages
- server libraries:
  - `src/lib/db.ts`
  - `src/lib/upload.ts`
  - `src/lib/shortener.ts`
  - `src/lib/storage-server.ts`
  - `src/lib/r2-storage.ts`
  - `src/lib/file-provider.ts`
  - `src/lib/analytics.ts`
  - `src/lib/system-monitoring.ts`
  - `src/lib/system-events.ts`
  - `src/lib/bio.server.ts`
  - `src/lib/bio-limits.server.ts`
  - `src/lib/discord.server.ts`
  - `src/lib/cleanup.ts`
  - `src/lib/env.ts`

---

## Target Repository Structure

```txt
twinkforsale/
  frontend/
    package.json
    vite.config.ts
    src/
      components/
      routes/
      lib/
        api-client.ts
        auth-client.ts
        validation.ts
        utils.ts
        storage-client.ts
      global.css
    public/

  backend/
    TwinkForSale.Api/
      TwinkForSale.Api.csproj
      Program.cs
      appsettings.json
      appsettings.Development.json
      Features/
        Auth/
        Uploads/
        ShortLinks/
        Bio/
        Dashboard/
        Admin/
        Analytics/
        ApiKeys/
        Settings/
        Domains/
        SystemHealth/
        OEmbed/
      Infrastructure/
        Database/
        Storage/
        Auth/
        Discord/
        Monitoring/
        BackgroundJobs/
        Configuration/
      Domain/
        Entities/
        ValueObjects/
      Contracts/
        Requests/
        Responses/

  shared/
    openapi/
      twinkforsale.openapi.json

  docker-compose.yml
  twinkforsale.sln
```

During migration, the existing root Qwik app may temporarily act as `frontend` until code is physically moved.

---

## Frontend Ownership

The frontend keeps only browser/client-safe code:

- UI pages and components
- layout and styling
- Qwik stores and hooks
- browser-safe validation and formatting helpers
- API client wrappers
- static assets

Keep or create:

- `src/lib/api-client.ts`
- `src/lib/auth-client.ts`
- `src/lib/theme-store.ts`
- `src/lib/alert-store.ts`
- `src/lib/image-preview-store.ts`
- `src/lib/global-particle-store.ts`
- `src/lib/use-alert.ts`
- `src/lib/use-image-preview.ts`
- `src/lib/storage-client.ts`
- `src/lib/url-utils.ts`
- `src/lib/utils.ts`
- `src/lib/validation.ts`
- `src/lib/bio-icons.ts`

Remove from frontend after backend parity exists:

- direct Prisma/db imports
- `process.env`/server env usage
- file system access
- server-side storage providers
- auth provider implementation
- Qwik server functions/actions/loaders that mutate or read private backend data

---

## Backend Ownership

The C# backend owns:

- Auth/session/API key validation
- Discord OAuth integration
- database access
- uploads and file serving
- local/R2 storage
- URL shortener redirects
- oEmbed metadata
- dashboard data
- settings mutations
- bio-page data and analytics
- admin operations
- system health/events/monitoring
- cleanup/background jobs

---

## Backend Technology

- ASP.NET Core
- FastEndpoints
- FastEndpoints Swagger
- EF Core
- PostgreSQL
- Cookie or JWT auth
- S3-compatible storage for Cloudflare R2
- ImageSharp for image metadata where needed
- Quartz or hosted services for cleanup jobs

Recommended packages:

```txt
FastEndpoints
FastEndpoints.Swagger
Microsoft.EntityFrameworkCore
Npgsql.EntityFrameworkCore.PostgreSQL
Microsoft.EntityFrameworkCore.Design
Microsoft.AspNetCore.Authentication.JwtBearer
Microsoft.AspNetCore.Authentication.Cookies
AWSSDK.S3
SixLabors.ImageSharp
FluentValidation
Serilog.AspNetCore
Quartz.Extensions.Hosting
```

---

## Database Migration

Current database schema is Prisma SQLite in `prisma/schema.prisma`, but the target backend database is PostgreSQL.

Create EF Core entities equivalent to:

- `User`
- `Account`
- `Session`
- `VerificationToken`
- `UserSettings`
- `Upload`
- `ApiKey`
- `DailyAnalytics`
- `ViewLog`
- `DownloadLog`
- `UploadDomain`
- `SystemEvent`
- `SystemAlert`
- `BioLink`
- `BioView`
- `ShortLink`

Migration rules:

- Preserve existing table names, e.g. `users`, `uploads`, `api_keys`.
- Preserve string IDs for easier migration.
- Convert Prisma `BigInt` to C# `long`.
- Convert Prisma `Json` to string/JSON mapped column.
- Use PostgreSQL for all new backend migrations.
- Existing SQLite data will require a one-time export/import migration if production data needs to be preserved.

---

## API Route Mapping

### Uploads

Existing:

```txt
POST /api/upload
GET  /f/{shortCode}
```

Backend target:

```txt
POST   /api/uploads
POST   /api/upload       compatibility alias
GET    /api/uploads
GET    /api/uploads/{id}
DELETE /api/uploads/{id}
GET    /f/{shortCode}
GET    /f/{shortCode}?direct=true
```

### Short Links

Existing:

```txt
POST /api/shorten
GET  /l/{code}
```

Backend target:

```txt
POST   /api/short-links
POST   /api/shorten      compatibility alias
GET    /api/short-links
DELETE /api/short-links/{id}
GET    /l/{code}
```

### Auth

```txt
GET  /api/auth/me
GET  /api/auth/discord/login
GET  /api/auth/discord/callback
POST /api/auth/logout
```

### Dashboard

```txt
GET    /api/dashboard/summary
GET    /api/dashboard/uploads
DELETE /api/dashboard/uploads/{id}
GET    /api/analytics
GET    /api/analytics/uploads/{shortCode}
```

### API Keys

```txt
GET    /api/api-keys
POST   /api/api-keys
DELETE /api/api-keys/{id}
```

### Settings

```txt
GET /api/settings
PUT /api/settings
PUT /api/settings/embed
PUT /api/settings/particles
```

### Bio

```txt
GET    /api/bio/me
PUT    /api/bio/me
POST   /api/bio/links
PUT    /api/bio/links/{id}
DELETE /api/bio/links/{id}
GET    /api/public/bio/{username}
POST   /api/public/bio/{username}/view
POST   /api/public/bio-links/{id}/click
```

### Admin

```txt
GET    /api/admin/users
PUT    /api/admin/users/{id}
GET    /api/admin/analytics
GET    /api/admin/events
POST   /api/admin/events
DELETE /api/admin/events/{id}
GET    /api/admin/domains
POST   /api/admin/domains
PUT    /api/admin/domains/{id}
DELETE /api/admin/domains/{id}
GET    /api/admin/health
GET    /api/admin/bio-limits
PUT    /api/admin/bio-limits/{userId}
```

### OEmbed

```txt
GET /api/oembed?url={url}
```

---

## Backend Feature Layout

```txt
Features/Uploads/
  CreateUploadEndpoint.cs
  CreateUploadCompatibilityEndpoint.cs
  GetUploadEndpoint.cs
  DeleteUploadEndpoint.cs
  ServeUploadEndpoint.cs
  CreateUploadRequest.cs
  CreateUploadResponse.cs
  UploadService.cs

Features/ShortLinks/
  CreateShortLinkEndpoint.cs
  CreateShortLinkCompatibilityEndpoint.cs
  RedirectShortLinkEndpoint.cs
  ShortLinkService.cs

Features/Auth/
  MeEndpoint.cs
  DiscordLoginEndpoint.cs
  DiscordCallbackEndpoint.cs
  LogoutEndpoint.cs

Infrastructure/Storage/
  IFileStorage.cs
  LocalFileStorage.cs
  R2FileStorage.cs

Infrastructure/Database/
  AppDbContext.cs
  EntityConfigurations/
```

---

## Config

Backend config should use `appsettings.json` plus environment overrides.

```json
{
  "App": {
    "BaseUrl": "https://twink.forsale",
    "FrontendUrl": "http://localhost:5173",
    "BaseStorageLimit": 10737418240
  },
  "ConnectionStrings": {
    "Default": "Host=localhost;Port=5432;Database=twinkforsale;Username=postgres;Password=postgres"
  },
  "Discord": {
    "ClientId": "",
    "ClientSecret": ""
  },
  "Auth": {
    "JwtSecret": ""
  },
  "Storage": {
    "Provider": "Local",
    "LocalPath": "uploads",
    "R2": {
      "AccountId": "",
      "AccessKeyId": "",
      "SecretAccessKey": "",
      "BucketName": "",
      "PublicUrl": ""
    }
  }
}
```

---

## Frontend API Client

Add:

```txt
VITE_API_BASE_URL=http://localhost:5000
```

Create:

```txt
src/lib/api-client.ts
```

Responsibilities:

- centralize `fetch`
- include credentials
- parse API errors
- provide typed methods for each feature

---

## Deployment Routing

Final routing:

```txt
https://twink.forsale/*       -> frontend
https://twink.forsale/api/*   -> backend
https://twink.forsale/f/*     -> backend
https://twink.forsale/l/*     -> backend
```

---

## Implementation Phases

### Phase 1 — Backend Shell

- [x] Create `backend/TwinkForSale.Api`
- [x] Add FastEndpoints
- [x] Add Swagger
- [x] Add CORS for frontend
- [x] Add health endpoint
- [x] Add typed config classes
- [x] Add EF Core package references
- [x] Add project to `twinkforsale.sln`

Deliverable: backend builds and serves `/api/health`.

### Phase 2 — PostgreSQL Data Model Shell

- [x] Add EF Core entities matching Prisma models
- [x] Add `AppDbContext`
- [x] Add PostgreSQL table mappings preserving current table names
- [x] Add first migration or migration strategy

Deliverable: backend can connect to the PostgreSQL database shape.

### Phase 3 — Uploads

- [x] Port file validation
- [x] Port short code generation
- [x] Port local storage
- [x] Port R2 storage
- [x] Port API key auth
- [x] Port `POST /api/upload` compatibility endpoint
- [x] Port `POST /api/uploads`
- [x] Port `/f/{shortCode}` basic direct serving
- [x] Port basic view analytics
- [x] Port download analytics
- [x] Port expiration/max-view behavior

Deliverable: ShareX uploads work through C# backend.

### Phase 4 — Short Links

- [x] Port `POST /api/shorten`
- [x] Port `POST /api/short-links`
- [x] Port `/l/{code}` redirects
- [x] Port duplicate detection and click analytics

Deliverable: URL shortener works through C# backend.

### Phase 5 — Auth

- [x] Implement backend Discord OAuth
- [x] Implement browser session/JWT handling
- [x] Implement `/api/auth/me`
- [x] Implement browser logout
- [x] Update frontend auth calls

Deliverable: frontend auth comes from backend.

### Phase 6 — Dashboard APIs

- [x] Summary data
- [x] Upload listing/deletion
- [x] API key management
- [x] Settings
- [x] Embed settings
- [x] Particle settings
- [x] Analytics

Deliverable: dashboard pages no longer use direct server loaders/actions for backend data.

### Phase 7 — Bio

- [x] Bio settings endpoints
- [x] Bio link CRUD
- [x] Public bio lookup
- [x] View tracking
- [x] Link click tracking
- [x] CSS sanitization hardening

Deliverable: public bio pages render from backend API data.

### Phase 8 — Admin

- [x] User approval/admin updates
- [x] Domain management
- [x] System health
- [x] Events
- [x] Bio limits
- [x] Admin analytics

Deliverable: admin panel is frontend-only and uses backend APIs.

### Phase 9 — Frontend Cleanup

- [x] Remove `src/routes/api/**`
- [x] Remove old `src/routes/f/**` backend handler
- [x] Remove old `src/routes/l/**` backend handler
- [x] Remove old Qwik Auth plugin if backend owns auth
- [x] Remove server-only libraries (`db`, `analytics`, `upload`, `shortener`,
      `storage-server`, `r2-storage`, `file-provider`, `system-monitoring`,
      `system-events`, `discord.server`, `bio.server`, `bio-limits.server`,
      `cleanup`, `discord-notifications`) and drop system-monitoring/auth-env
      wiring from `entry.node-server.tsx`
- [x] Remove Prisma and server-only npm dependencies from `package.json`
      (`@prisma/client`, `prisma`, `@auth/qwik`, `@auth/prisma-adapter`,
      `@aws-sdk/*`, `sharp`, `diskusage`, `dotenv`, `nanoid`, `undici`, `tsx`),
      dropped the prisma/r2 npm scripts and `postinstall`, deleted the `prisma/`
      schema+migrations and the dead `server-utils`/`media-utils` libs, and
      trimmed `.env.example` to frontend-only variables
- [ ] Move app into `frontend/` folder if desired

Deliverable: clear frontend/backend separation.

---

## Progress Log

- [x] Migration plan created.
- [x] Backend shell started.
- [x] Backend project added to solution.
- [x] Backend builds successfully.
- [x] Backend switched to PostgreSQL provider.
- [x] EF Core PostgreSQL entity model and initial migration created.
- [x] Upload endpoints started with local storage and API key auth.
- [x] Short link endpoints started with redirects and click tracking.
- [x] Feature endpoint files reorganized by request type folders.
- [x] API-key protected endpoints moved to claim/policy-based auth instead of `AllowAnonymous`.
- [x] Added `/api/auth/me` for API-key authenticated users.
- [x] Added dashboard summary, upload list/delete, short-link list/delete, and API-key management endpoints.
- [x] Added settings and embed settings endpoints.
- [x] Added bio settings, bio links, public bio lookup, view tracking, and link click tracking endpoints.
- [x] Added admin users, domains, events, and health endpoints.
- [x] Added R2 storage provider with config-based storage selection.
- [x] Added analytics overview/detail endpoints, admin analytics, bio-limit management, particle settings alias, and oEmbed.
- [x] Added upload download tracking plus explicit expiration/max-view enforcement in the backend file route.
- [x] Added backend Discord OAuth login/callback, cookie-backed browser sessions, browser logout, and session-backed `/api/auth/me`.
- [x] Added missing backend endpoints for public landing stats and account deletion.
- [x] Added backend bio custom-CSS sanitization.
- [x] Wired all frontend routes/loaders/actions to the API client and fixed the
      landing page auth (removed leftover Qwik Auth `session`/`Form` usage).
- [x] Typed analytics responses (overview/admin/upload) in the API client and
      rewired the dashboard/admin/analytics pages to consume them.
- [x] Fixed ShareX setup to build configs from the full API key returned at
      creation time (stored keys are masked) and fixed the API-keys page so the
      one-time key display isn't wiped by a page reload.
- [x] Replaced the frontend `@prisma/client` `BioLink` type with a local DTO.
- [x] Completed Phase 9 frontend cleanup (removed old backend routes/libs).
- [x] Removed Prisma + server-only npm deps/scripts, the `prisma/` directory,
      dead server libs, and trimmed `.env.example` to frontend-only vars.
- [x] Verified frontend `tsc`, ESLint, and client + SSR builds all pass.
