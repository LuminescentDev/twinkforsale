# Environment Configuration Guide

This document describes all environment variables and configuration options for both the backend and frontend applications.

## Backend Configuration

The backend uses `appsettings.json` for configuration. Copy `appsettings.example.json` to `appsettings.json` and customize for your environment.

### Connection Strings

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=twinkforsale;Username=your_username;Password=your_password;SSL Mode=Disable"
  }
}
```

**Database Options:**

- **PostgreSQL (Production):**
  ```
  Host=your-host;Port=5432;Database=twinkforsale;Username=user;Password=pass;SSL Mode=Require;Trust Server Certificate=true
  ```

- **SQLite (Development):**
  ```
  Data Source=./app.db
  ```
  
  To use SQLite, update `Program.cs` to use `UseSqlite` instead of `UseNpgsql`.

### Application Settings

```json
{
  "App": {
    "Name": "TwinkForSale",
    "BaseUrl": "http://localhost:5000"
  }
}
```

- **Name**: Application name (used in logs and responses)
- **BaseUrl**: Base URL for the backend API

### JWT Configuration

```json
{
  "Jwt": {
    "Secret": "your-super-secret-jwt-key-change-in-production-minimum-32-characters",
    "Issuer": "twinkforsale",
    "Audience": "twinkforsale",
    "ExpiryMinutes": 15,
    "RefreshExpiryDays": 7
  }
}
```

- **Secret**: JWT signing key (minimum 32 characters, use a strong random string)
- **Issuer**: JWT issuer claim
- **Audience**: JWT audience claim
- **ExpiryMinutes**: Access token expiration time (default: 15 minutes)
- **RefreshExpiryDays**: Refresh token expiration time (default: 7 days)

**Generate a secure secret:**
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### Discord OAuth

```json
{
  "Discord": {
    "ClientId": "your-discord-client-id",
    "ClientSecret": "your-discord-client-secret",
    "RedirectUri": "http://localhost:5000/api/auth/callback"
  }
}
```

**Setup Instructions:**

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Navigate to OAuth2 settings
4. Add redirect URI: `http://localhost:5000/api/auth/callback` (or your production URL)
5. Copy Client ID and Client Secret
6. Enable necessary OAuth2 scopes: `identify`, `email`

### Grafana Loki (Optional)

```json
{
  "Loki": {
    "Url": "http://localhost:3100"
  }
}
```

- **Url**: Grafana Loki instance URL for structured logging
- If not configured, logs will only go to console

### Storage Configuration

```json
{
  "Storage": {
    "LocalPath": "./uploads",
    "BaseUrl": "/files",
    "MaxFileSize": 104857600,
    "BaseStorageLimit": 10737418240,
    "AllowedMimeTypes": "image/png,image/jpeg,image/gif,image/webp,video/mp4,video/webm,text/plain,application/pdf"
  }
}
```

- **LocalPath**: Directory for uploaded files (local storage)
- **BaseUrl**: URL path prefix for file access
- **MaxFileSize**: Maximum file size in bytes (default: 100MB)
- **BaseStorageLimit**: Default per-user storage limit in bytes (default: 10GB)
- **AllowedMimeTypes**: Comma-separated list of allowed MIME types

**Common File Size Values:**
```
5MB   = 5242880
10MB  = 10485760
50MB  = 52428800
100MB = 104857600
500MB = 524288000
1GB   = 1073741824
```

**Common Storage Limit Values:**
```
1GB   = 1073741824
5GB   = 5368709120
10GB  = 10737418240
50GB  = 53687091200
100GB = 107374182400
```

### CORS Configuration

```json
{
  "Cors": {
    "Origins": "http://localhost:3000,http://localhost:5173"
  }
}
```

- **Origins**: Comma-separated list of allowed frontend origins
- Add your production frontend URL here

### Logging

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Warning"
    }
  }
}
```

**Log Levels:**
- `Trace`: Very detailed logs
- `Debug`: Debug information
- `Information`: General informational messages (recommended)
- `Warning`: Warning messages
- `Error`: Error messages
- `Critical`: Critical failures

### Development vs Production

Create separate files for different environments:

- `appsettings.json` - Shared settings
- `appsettings.Development.json` - Development overrides
- `appsettings.Production.json` - Production overrides

The backend automatically loads the appropriate file based on `ASPNETCORE_ENVIRONMENT`.

---

## Frontend Configuration

The frontend uses a `.env` file. Copy `frontend/.env.example` to `frontend/.env` and customize.

### Required Variables

```env
# Backend API URL (required)
API_URL="http://localhost:5000"
```

- **API_URL**: Full URL to the backend API
  - Development: `http://localhost:5000`
  - Production: `https://api.your-domain.com`

### Optional Variables

```env
# Public URL for ShareX configs (optional)
PUBLIC_URL="https://twink.forsale"
```

- **PUBLIC_URL**: Override the public-facing URL used in ShareX configurations
- If not set, will use the request origin

```env
# Node environment
NODE_ENV="development"
```

- **NODE_ENV**: Environment mode
  - `development`: Development mode with hot reload
  - `production`: Production build

```env
# Port for frontend server
PORT=3000
```

- **PORT**: Port for the frontend dev server (default: 3000)

```env
# Discord Webhook for system notifications
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
```

- **DISCORD_WEBHOOK_URL**: Discord webhook for system monitoring notifications
- Optional, only needed if using system monitoring features

---

## Docker Configuration

When using Docker Compose, environment variables are configured in the compose files:

### Backend (`docker/docker-compose.yml` or `backend/docker-compose.backend.yml`)

```yaml
backend:
  environment:
    - ASPNETCORE_ENVIRONMENT=Production
    - ConnectionStrings__DefaultConnection=Host=postgres;Database=twinkforsale;...
    - Jwt__Secret=your-secret-key
    - Discord__ClientId=your-client-id
    - Discord__ClientSecret=your-client-secret
```

### Frontend (`docker/docker-compose.yml` or `frontend/docker-compose.frontend.yml`)

```yaml
frontend:
  environment:
    - API_URL=http://backend:5000
    - PUBLIC_URL=https://your-domain.com
    - NODE_ENV=production
```

---

## Security Best Practices

### Secrets Management

1. **Never commit secrets to version control**
   - Add `appsettings.json` and `.env` to `.gitignore`
   - Only commit `.example` files

2. **Use strong, random secrets**
   - JWT secrets should be at least 32 characters
   - Use cryptographically secure random generators

3. **Rotate secrets regularly**
   - Change JWT secrets periodically
   - Update Discord OAuth credentials if compromised

4. **Environment-specific secrets**
   - Use different secrets for dev/staging/production
   - Never reuse production secrets in development

### Database Security

1. **Use strong passwords**
   - Minimum 16 characters
   - Mix of letters, numbers, symbols

2. **Enable SSL for production**
   - PostgreSQL: `SSL Mode=Require`
   - Use valid SSL certificates

3. **Restrict database access**
   - Use firewall rules
   - Allow connections only from application servers

### CORS Configuration

1. **Restrict origins in production**
   - Only allow your frontend domain
   - Don't use wildcards (`*`) in production

2. **Use HTTPS in production**
   - Enforce HTTPS for all requests
   - Set `Secure` flag on cookies

---

## Environment Variable Checklist

### Backend (Required)

- [ ] `ConnectionStrings.DefaultConnection` - Database connection
- [ ] `Jwt.Secret` - JWT signing key (32+ characters)
- [ ] `Discord.ClientId` - Discord OAuth client ID
- [ ] `Discord.ClientSecret` - Discord OAuth client secret
- [ ] `Discord.RedirectUri` - OAuth callback URL
- [ ] `Storage.LocalPath` - Upload directory path

### Backend (Optional)

- [ ] `Loki.Url` - Grafana Loki logging endpoint
- [ ] `Storage.MaxFileSize` - Maximum upload size
- [ ] `Storage.BaseStorageLimit` - Per-user storage limit
- [ ] `Cors.Origins` - Allowed frontend origins

### Frontend (Required)

- [ ] `API_URL` - Backend API URL

### Frontend (Optional)

- [ ] `PUBLIC_URL` - Override public URL
- [ ] `NODE_ENV` - Environment mode
- [ ] `PORT` - Dev server port
- [ ] `DISCORD_WEBHOOK_URL` - System notifications webhook

---

## Troubleshooting

### Backend won't start

1. **Check database connection**
   ```bash
   # Test PostgreSQL connection
   psql -h host -p port -U username -d database
   ```

2. **Verify JWT secret length**
   - Must be at least 32 characters

3. **Check port availability**
   ```bash
   # Windows
   netstat -ano | findstr :5000
   
   # Linux/Mac
   lsof -i :5000
   ```

### Frontend can't connect to backend

1. **Verify API_URL in `.env`**
   ```bash
   cd frontend
   cat .env
   ```

2. **Check CORS configuration**
   - Backend `Cors.Origins` must include frontend URL

3. **Test backend directly**
   ```bash
   curl http://localhost:5000/api/health
   ```

### Database migrations fail

1. **Check connection string**
   - Verify host, port, database name, credentials

2. **Ensure database exists**
   ```sql
   CREATE DATABASE twinkforsale;
   ```

3. **Check EF Core version compatibility**
   ```bash
   dotnet ef --version
   ```

### File uploads fail

1. **Check upload directory permissions**
   ```bash
   # Linux/Mac
   ls -la ./uploads
   chmod 755 ./uploads
   
   # Windows
   icacls .\uploads
   ```

2. **Verify storage limits**
   - Check `Storage.MaxFileSize`
   - Check user storage quota

3. **Check allowed MIME types**
   - Verify file type is in `AllowedMimeTypes`

---

## Quick Start Commands

### Backend Development
```bash
cd backend
cp appsettings.example.json appsettings.json
# Edit appsettings.json
dotnet restore
dotnet ef database update
dotnet run
```

### Frontend Development
```bash
cd frontend
cp .env.example .env
# Edit .env
pnpm install
pnpm dev
```

### Docker Development
```bash
cd docker
# Edit docker-compose.yml with your values
docker-compose up -d
```

---

For more information, see:
- [README.md](./README.md) - Project overview and setup
- [CLAUDE.md](./CLAUDE.md) - AI assistant instructions
