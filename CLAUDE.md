# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**twink.forsale** is a file hosting service with ShareX integration, built with Qwik and TypeScript. Features Discord OAuth authentication with admin approval workflow, bio pages (Linktree-style), URL shortening, and analytics dashboards.

This project is AI-generated as an experiment in AI-driven development.

## Development Commands

```bash
# Development server with SSR
pnpm run dev

# Type checking
pnpm run build.types

# Linting and formatting
pnpm run lint
pnpm run fmt

# Database operations
pnpm run prisma:migrate    # Run migrations in dev
pnpm run prisma:generate   # Generate Prisma client

# Production build
pnpm run build
pnpm run build.server
pnpm run deploy            # Migrations + full build
```

**Package manager**: Use `pnpm` exclusively (not npm or yarn).

## Tech Stack

- **Framework**: Qwik 1.14.1 with Qwik City (file-based routing)
- **Database**: Prisma ORM with SQLite (dev) / PostgreSQL (prod)
- **Auth**: Auth.js with Discord OAuth, session-based with Prisma adapter
- **Styling**: Tailwind CSS v4 with Vite plugin
- **Storage**: Local filesystem with AWS S3 SDK available
- **Build**: Vite 5.3.5

## Architecture

### Routing
Routes are file-based in `src/routes/`. Dynamic routes use `[param]` syntax (e.g., `[username]/index.tsx`).

### Key directories
- `src/routes/api/` - API endpoints (upload, shorten, oembed)
- `src/routes/f/` - File serving by shortcode
- `src/routes/dashboard/` - User dashboard pages
- `src/routes/admin/` - Admin panel
- `src/lib/` - Business logic and utilities
- `src/components/` - Reusable UI components

### Server-only code
Files ending in `.server.ts` are server-only. Use `$` prefix for server functions in Qwik.

### Database models (prisma/schema.prisma)
- **User** - Auth with approval workflow (isApproved flag)
- **Upload** - File metadata with shortcode, deletion key, analytics
- **ApiKey** - Bearer token auth for API uploads
- **BioLink/BioView** - Bio page links and analytics
- **ShortLink** - URL shortener
- **ViewLog/DownloadLog** - File analytics tracking

### State management
Uses Qwik signals and stores in `src/lib/` (alert-store.ts, global-particle-store.ts).

### File storage
Abstracted via `src/lib/file-provider.ts` - supports local filesystem with S3 ready.

## TypeScript Configuration

- Strict mode enabled
- Path alias: `~/*` maps to `./src/*`
- ESLint 9+ flat config format

## Key Environment Variables

```
DATABASE_URL              # SQLite: "file:./dev.db"
AUTH_SECRET              # 32+ char random string
DISCORD_CLIENT_ID        # Discord OAuth app ID
DISCORD_CLIENT_SECRET    # Discord OAuth secret
BASE_URL                 # Application URL
UPLOAD_DIR               # File storage directory
MAX_FILE_SIZE            # Max bytes per upload
```

See `.env.example` for full list.

## API Authentication

Upload API (`POST /api/upload`) requires Bearer token authentication using API keys generated in user dashboard.

## User Approval Flow

New users authenticate via Discord OAuth but require admin approval (isApproved=true) before accessing features.
