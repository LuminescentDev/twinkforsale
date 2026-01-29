#!/bin/bash

# SQLite to PostgreSQL Migration Script for twink.forsale
# This script exports data from SQLite and imports it into PostgreSQL

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=== SQLite to PostgreSQL Migration ==="
echo

# Configuration
SQLITE_DB="${1:-sqlite-production.db}"
POSTGRES_HOST="${2:-localhost}"
POSTGRES_PORT="${3:-5432}"
POSTGRES_DB="${4:-twinkforsale}"
POSTGRES_USER="${5:-postgres}"

# Check if SQLite database exists
if [ ! -f "$SQLITE_DB" ]; then
    echo -e "${RED}Error: SQLite database not found: $SQLITE_DB${NC}"
    echo "Usage: $0 <sqlite-db-path> [postgres-host] [postgres-port] [postgres-db] [postgres-user]"
    exit 1
fi

echo "Configuration:"
echo "  SQLite Database: $SQLITE_DB"
echo "  PostgreSQL: $POSTGRES_USER@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB"
echo

# Create temp directory for exports
EXPORT_DIR="./migration-export-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$EXPORT_DIR"
echo -e "${GREEN}Created export directory: $EXPORT_DIR${NC}"

# Export tables from SQLite
echo
echo "Exporting tables from SQLite..."

tables=("users" "user_settings" "accounts" "uploads" "api_keys" "short_links" "bio_links" "bio_views" "view_logs" "download_logs" "upload_domains" "daily_analytics" "system_events" "system_alerts" "click_logs")

for table in "${tables[@]}"; do
    echo "  Exporting $table..."
    sqlite3 "$SQLITE_DB" <<EOF
.headers on
.mode csv
.output $EXPORT_DIR/$table.csv
SELECT * FROM $table;
EOF
    count=$(tail -n +2 "$EXPORT_DIR/$table.csv" | wc -l)
    echo -e "${GREEN}    ✓ Exported $count records${NC}"
done

echo
echo -e "${GREEN}Export completed! Files saved to: $EXPORT_DIR${NC}"
echo

# Ask for PostgreSQL password
echo "Please enter PostgreSQL password for user $POSTGRES_USER:"
read -s POSTGRES_PASSWORD
export PGPASSWORD="$POSTGRES_PASSWORD"

# Test PostgreSQL connection
echo
echo "Testing PostgreSQL connection..."
if psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PostgreSQL connection successful${NC}"
else
    echo -e "${RED}✗ PostgreSQL connection failed${NC}"
    exit 1
fi

# Confirm before importing
echo
echo -e "${YELLOW}WARNING: This will import data into $POSTGRES_DB database.${NC}"
echo -e "${YELLOW}Existing data may be affected. Make sure you have a backup!${NC}"
echo
read -p "Continue with import? (yes/no): " confirm
if [ "$confirm" != "yes" ] && [ "$confirm" != "y" ]; then
    echo "Import cancelled."
    exit 0
fi

# Import into PostgreSQL
echo
echo "Importing data into PostgreSQL..."

# Disable triggers during import
psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<EOF
SET session_replication_role = 'replica';
EOF

# Import each table
for table in "${tables[@]}"; do
    if [ -f "$EXPORT_DIR/$table.csv" ]; then
        echo "  Importing $table..."
        
        # Check if file has data (more than just header)
        line_count=$(wc -l < "$EXPORT_DIR/$table.csv")
        if [ "$line_count" -gt 1 ]; then
            psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<EOF
\copy $table FROM '$EXPORT_DIR/$table.csv' WITH (FORMAT csv, HEADER true, NULL '');
EOF
            echo -e "${GREEN}    ✓ Imported successfully${NC}"
        else
            echo -e "${YELLOW}    ⊘ Table is empty, skipped${NC}"
        fi
    fi
done

# Re-enable triggers
psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<EOF
SET session_replication_role = 'origin';
EOF

# Update sequences
echo
echo "Updating PostgreSQL sequences..."
psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<'EOF'
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND column_default LIKE 'nextval%'
    LOOP
        BEGIN
            EXECUTE format('SELECT setval(pg_get_serial_sequence(''%I'', ''%I''), COALESCE(MAX("%I"), 1)) FROM "%I"',
                r.table_name, r.column_name, r.column_name, r.table_name);
            RAISE NOTICE 'Updated sequence for %.%', r.table_name, r.column_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not update sequence for %.%: %', r.table_name, r.column_name, SQLERRM;
        END;
    END LOOP;
END $$;
EOF

echo -e "${GREEN}✓ Sequences updated${NC}"

# Verification
echo
echo "=== Verification ==="
psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<'EOF'
SELECT 
    'users' AS table_name, COUNT(*) AS count FROM users
UNION ALL SELECT 'user_settings', COUNT(*) FROM user_settings
UNION ALL SELECT 'accounts', COUNT(*) FROM accounts
UNION ALL SELECT 'uploads', COUNT(*) FROM uploads
UNION ALL SELECT 'api_keys', COUNT(*) FROM api_keys
UNION ALL SELECT 'short_links', COUNT(*) FROM short_links
UNION ALL SELECT 'bio_links', COUNT(*) FROM bio_links
UNION ALL SELECT 'bio_views', COUNT(*) FROM bio_views
UNION ALL SELECT 'view_logs', COUNT(*) FROM view_logs
UNION ALL SELECT 'download_logs', COUNT(*) FROM download_logs
UNION ALL SELECT 'upload_domains', COUNT(*) FROM upload_domains
UNION ALL SELECT 'daily_analytics', COUNT(*) FROM daily_analytics
UNION ALL SELECT 'system_events', COUNT(*) FROM system_events
UNION ALL SELECT 'system_alerts', COUNT(*) FROM system_alerts
UNION ALL SELECT 'click_logs', COUNT(*) FROM click_logs
ORDER BY table_name;
EOF

echo
echo -e "${GREEN}=== Migration Complete! ===${NC}"
echo
echo "Next steps:"
echo "  1. Verify the data in PostgreSQL"
echo "  2. Test your application with PostgreSQL"
echo "  3. Update production connection strings"
echo "  4. Keep SQLite backup for 30 days"
echo
echo "Export files saved in: $EXPORT_DIR"
echo "(You can delete this directory after verifying the migration)"

# Clear password
unset PGPASSWORD
