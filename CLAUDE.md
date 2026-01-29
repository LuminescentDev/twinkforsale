# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**twink.forsale** is a file hosting service with ShareX integration, split into separate **backend** (C# .NET) and **frontend** (Qwik TypeScript) applications that can run independently.

**Key Features:**
- File upload & hosting with ShareX integration
- Discord OAuth authentication with admin approval workflow
- Bio pages (Linktree-style) with custom links
- URL shortening service
- Analytics dashboards for uploads and bio pages
- oEmbed support for rich Discord/Twitter embeds
- System monitoring with Discord notifications

**Development Philosophy:** This project is AI-generated as an experiment in AI-driven development.

## Architecture

### Split Application
The project is split into two independent applications:

1. **Backend** (`backend/`) - C# .NET 10.0 REST API
2. **Frontend** (`frontend/`) - Qwik TypeScript SSR application

Communication happens via REST API with auto-generated TypeScript client.

### Backend (C# .NET 10.0)

**Location:** `backend/`

**Tech Stack:**
- Framework: ASP.NET Core with .NET 10.0
- API Framework: FastEndpoints v5.31.0
- Database: Entity Framework Core with PostgreSQL (prod) / SQLite (dev)
- Auth: JWT Bearer tokens + API Key authentication
- Image Processing: ImageSharp
- Storage: AWS S3 SDK (supports local filesystem + S3)
- Logging: Serilog with Grafana Loki integration

**Key Directories:**
- `Endpoints/` - FastEndpoints-style endpoint handlers (grouped by feature)
- `Entities/` - EF Core database models
- `Services/` - Business logic layer
  - `Auth/` - JWT, Discord OAuth, API Key authentication
  - `Storage/` - Storage abstraction (IStorageService: Local vs S3)
  - `Image/` - Image processing (IImageService: ImageSharp)
- `Data/` - AppDbContext (EF Core)
- `Models/` - DTOs (Requests/ and Responses/)
- `Middleware/` - Custom middleware

**Entry Point:** `Program.cs` - Configures DI, services, middleware, FastEndpoints

**Database:**
- ORM: Entity Framework Core
- Migrations: Automatic on startup (configurable in Program.cs)
- Schema: See `Entities/` for models

**Running:**
```bash
cd backend
dotnet restore
dotnet run  # Starts on port 5000
```

**Build Commands:**
```bash
dotnet build                       # Build project
dotnet ef migrations add <Name>   # Create migration
dotnet ef database update         # Apply migrations
```

### Frontend (Qwik + TypeScript)

**Location:** `frontend/`

**Tech Stack:**
- Framework: Qwik 1.14.1 with Qwik City
- Styling: Tailwind CSS v4 with Vite plugin
- Build: Vite 5.3.5
- Package Manager: **pnpm** (use exclusively, not npm/yarn)
- UI Library: @luminescent/ui-qwik
- Icons: lucide-icons-qwik
- API Client: Auto-generated from backend OpenAPI

**Key Directories:**
- `src/routes/` - File-based routing (Qwik City)
  - `[username]/` - Public bio pages
  - `dashboard/` - User dashboard (7 pages)
  - `admin/` - Admin panel (6 pages)
  - `f/[shortCode]/` - File viewing
  - `l/[code]/` - Link redirection
  - `api/` - **API proxy routes** (forwards to backend, needed for ShareX/CORS)
  - `layout.tsx` - Root layout
  - `plugin@auth.ts` - Auth plugin
- `src/components/` - Reusable UI components
  - `bio/` - Bio page components
  - `charts/` - Analytics charts
  - `effects/` - Particle effects
  - `layout/` - Navigation, footer
  - `ui/` - Shared UI elements
- `src/lib/` - Utilities and client-side logic
  - `api/generated/` - **Auto-generated TypeScript API client**
  - `*.server.ts` - **Server-side API client helpers** (for Qwik SSR)
  - Stores: `alert-store.ts`, `theme-store.ts`, `global-particle-store.ts`
  - Utilities: `validation.ts`, `sharex-config.ts`, `analytics.ts`

**Running:**
```bash
cd frontend
pnpm install
pnpm dev  # Starts on port 3000
```

**Build Commands:**
```bash
pnpm dev                # Development server with SSR
pnpm build              # Production build
pnpm preview            # Preview production build
pnpm fmt                # Format code
pnpm lint               # Lint code
```

**IMPORTANT:** Always use `pnpm`, never `npm` or `yarn`.

## Development Workflow

### Working on Backend
- Language: C#
- IDE: Visual Studio, Rider, or VS Code with C# extension
- Database changes: Use EF Core migrations
- API documentation: Available at `/swagger` when running
- Authentication: JWT tokens stored in cookies, API keys for uploads

### Working on Frontend
- Language: TypeScript
- Framework: Qwik (reactive, resumable)
- API calls: Use generated client from `src/lib/api/generated/`
- Server-side rendering: Use `*.server.ts` files for SSR API calls
- Routing: File-based, use `[param]` syntax for dynamic routes

### API Proxy Routes

**IMPORTANT:** The frontend has API routes at `src/routes/api/*` that **should be kept**. They:
- Forward requests to the backend API
- Enable ShareX integration (same-domain uploads)
- Handle CORS properly
- Allow upload monitoring (`monitorFailedUpload`)

**DO NOT** remove these proxy routes. They're intentional for ShareX compatibility.

### Server-Side Files (`*.server.ts`)

Files ending in `.server.ts` in the frontend are **NOT** duplicated backend logic. They are:
- **Server-side API client helpers** for Qwik SSR
- Used during server-side rendering to fetch data from backend
- Forward cookies for authentication
- Provide type-safe wrappers for backend endpoints

**DO NOT** move these to the backend. They belong in the frontend for SSR.

### Communication Between Frontend and Backend

1. **Frontend Client-Side:**
   - Uses generated API client: `src/lib/api/generated/`
   - Client code in `src/lib/api/client.ts`
   - API URL from environment: `API_URL` (e.g., `https://tfsbackend.bwmp.dev/`)

2. **Frontend Server-Side (SSR):**
   - Uses `*.server.ts` helper files
   - Makes direct fetch calls to backend with cookie forwarding
   - Renders pages with pre-fetched data

3. **Backend:**
   - Exposes REST API via FastEndpoints
   - Returns JSON responses
   - OpenAPI/Swagger spec auto-generated

## Database Models

**Location:** `backend/Entities/`

**Key Entities:**
- `User` - Auth with Discord, approval workflow (`isApproved` flag)
- `Upload` - File metadata with shortcode, deletion key, analytics
- `ApiKey` - Bearer token auth for API uploads
- `BioLink` - Individual links on bio pages
- `BioView` - Analytics for bio page views
- `ShortLink` - URL shortener entries
- `ViewLog` - File view analytics
- `DownloadLog` - File download analytics
- `Domain` - Custom upload domains
- `SystemEvent` - System monitoring events

**Database Provider:**
- Development: SQLite (`appsettings.Development.json`)
- Production: PostgreSQL (`appsettings.json`)

## Environment Variables

### Backend (`backend/appsettings.json`)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=twinkforsale;..."
  },
  "Jwt": {
    "Secret": "your-secret-key-minimum-32-characters",
    "Issuer": "twink.forsale",
    "Audience": "twink.forsale-api"
  },
  "Discord": {
    "ClientId": "...",
    "ClientSecret": "...",
    "RedirectUri": "http://localhost:5000/auth/discord/callback"
  },
  "Storage": {
    "Provider": "Local",  // or "S3"
    "BasePath": "./uploads",
    "MaxFileSize": 104857600
  }
}
```

### Frontend (`frontend/.env`)

```env
API_URL=http://localhost:5000    # Backend API URL
PUBLIC_URL=http://localhost:3000  # Optional: Override for ShareX configs
```

## Running the Full Stack

### Option 1: Docker Compose (Recommended)
```bash
cd docker
docker-compose up -d
```
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000`
- PostgreSQL: `localhost:2345`

### Option 2: Run Independently

**Terminal 1 (Backend):**
```bash
cd backend
dotnet run
```

**Terminal 2 (Frontend):**
```bash
cd frontend
pnpm dev
```

Ensure `frontend/.env` has `API_URL=http://localhost:5000`.

## User Approval Flow

New users authenticate via Discord OAuth but require **admin approval** (`isApproved=true` in User table) before accessing features. Admins approve users at `/admin/users`.

## API Authentication

- **Upload API** (`POST /api/upload`): Requires `Authorization: Bearer <api-key>` header
- **Admin Endpoints**: Require JWT token (from Discord OAuth login)
- **Public Endpoints**: `/api/files/{shortCode}`, `/api/oembed`, bio pages

## File Storage

Storage is abstracted via `IStorageService` in `backend/Services/Storage/`:
- **LocalStorageService**: Filesystem storage (default)
- **S3StorageService**: AWS S3 storage

Configure via `appsettings.json` → `Storage.Provider`.

## Important Notes for AI Assistants

1. **Package Manager:** Use `pnpm` for frontend, never `npm` or `yarn`
2. **API Proxy Routes:** Do NOT remove `frontend/src/routes/api/*` - they're intentional
3. **Server-Side Files:** `*.server.ts` belong in frontend for SSR, not backend
4. **Database Changes:** Use EF Core migrations in backend (not Prisma)
5. **API Client:** Frontend uses auto-generated client from backend OpenAPI
6. **Two Separate Apps:** Backend and frontend are independent - they have separate dependencies, build processes, and deployment
7. **System Monitoring:** Currently runs in frontend (should eventually move to backend)

## Known Issues / Future Improvements

1. **System Monitoring:** `frontend/src/lib/system-monitoring.ts` should eventually move to backend
2. **Shared Types:** Consider extracting common types into a shared package
3. **Testing:** Add end-to-end tests for critical flows
4. **Real-time Updates:** Consider WebSockets for live analytics

## Code Style

### Backend (C#)
- Use PascalCase for classes, methods, properties
- Use camelCase for local variables
- Follow Microsoft C# conventions
- Use async/await for all I/O operations
- Inject dependencies via constructor

### Frontend (TypeScript)
- Use camelCase for variables, functions
- Use PascalCase for components
- Follow Qwik component patterns
- Use signals and stores for state
- Prefer `$` suffix for server functions

## Path Aliases

- **Frontend:** `~/*` maps to `./src/*` (e.g., `~/lib/utils`)
- **Backend:** Standard C# namespace resolution

## Additional Resources

- **Qwik Docs:** https://qwik.dev/
- **FastEndpoints Docs:** https://fast-endpoints.com/
- **Entity Framework Core:** https://learn.microsoft.com/ef/core/
- **Tailwind CSS v4:** https://tailwindcss.com/

---

When making changes:
1. Understand which app (backend vs frontend) needs the change
2. Use the correct package manager (`dotnet` vs `pnpm`)
3. Test both apps independently
4. Ensure API contracts match (backend OpenAPI ↔ frontend generated client)
5. Update this file if architectural decisions change
