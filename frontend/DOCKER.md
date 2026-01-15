# Docker Deployment Guide

This application is containerized and ready for deployment with Docker or container platforms like Coolify.

## Quick Start with Docker

### 1. Build and run locally

```bash
# Build the image
docker build -t twink-for-sale .

# Run with docker-compose
docker-compose up -d
```

### 2. Environment Variables

Copy `.env.production` and update the values:

- `AUTH_SECRET`: Generate with `openssl rand -base64 32`
- `DISCORD_CLIENT_ID` & `DISCORD_CLIENT_SECRET`: From Discord Developer Portal
- `ORIGIN` & `BASE_URL`: Your domain URL

## Coolify Deployment

### 1. Repository Setup
- Push your code to a Git repository (GitHub, GitLab, etc.)
- Ensure the Dockerfile is in the root directory

### 2. Coolify Configuration
1. Create a new application in Coolify
2. Connect your Git repository
3. Set build pack to "Dockerfile"
4. Configure environment variables from `.env.production`
5. Set up persistent volumes:
   - `/app/uploads` for file uploads
   - `/app/data` for SQLite database

### 3. Required Environment Variables in Coolify
```
NODE_ENV=production
PORT=3000
DATABASE_URL=file:/app/data/prod.db
AUTH_SECRET=your_secure_auth_secret
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
ORIGIN=https://your-domain.com
BASE_URL=https://your-domain.com
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=524288000
BASE_STORAGE_LIMIT=10737418240
```

### 4. Volume Mounts
- **Uploads**: Mount `/app/uploads` to persist uploaded files
- **Database**: Mount `/app/data` to persist SQLite database

### 5. Health Check
The container includes a health check that pings `http://localhost:3000/`

## Database Migration

On first deployment, the database will be automatically created. For subsequent deployments with schema changes, you may need to run migrations manually:

```bash
# Inside the container
bunx prisma migrate deploy
```

## Troubleshooting

### Container Logs
```bash
docker logs <container_name>
```

### Common Issues
1. **Permission errors**: Ensure volumes have correct permissions
2. **Database locked**: Check if multiple instances are trying to access SQLite
3. **Missing environment variables**: Verify all required vars are set

## Production Considerations

1. **Database**: Consider using PostgreSQL for production instead of SQLite
2. **File Storage**: Consider using S3-compatible storage for uploads
3. **Reverse Proxy**: Use nginx or Cloudflare for SSL termination
4. **Monitoring**: Set up logging and monitoring for the container
