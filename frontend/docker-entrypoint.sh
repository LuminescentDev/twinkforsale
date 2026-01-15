#!/bin/sh
set -e

echo "Starting application setup..."

# Wait for database file to be available (in case of volume mounting)
if [ ! -f "/app/data/prod.db" ]; then
    echo "Database file not found, creating new database..."
    mkdir -p /app/data
fi

# Run Prisma migrations
echo "Running Prisma migrations..."
pnpm exec prisma migrate deploy

# Generate Prisma client (in case it wasn't properly copied)
echo "Generating Prisma client..."
pnpm exec prisma generate

echo "Database setup complete, starting application..."

# Start the application
exec "$@"
