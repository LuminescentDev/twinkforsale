# SQLite to PostgreSQL Migration Guide

This guide will help you migrate data from your production SQLite database to the new PostgreSQL database.

## Overview

You have three main options for migration:

1. **C# Migration Tool** (Recommended) - Custom tool using Entity Framework Core
2. **pgloader** - Automated migration tool
3. **Manual Export/Import** - Using SQL dumps

---

## Prerequisites

Before starting the migration:

- [ ] Backup your SQLite database
- [ ] Have PostgreSQL database running and accessible
- [ ] Update `backend/appsettings.json` with PostgreSQL connection string
- [ ] Test PostgreSQL connection

### Backup Your SQLite Database

```bash
# On your production server
cp /path/to/your/database.db /path/to/backup/database-backup-$(date +%Y%m%d).db

# Or download it locally
scp user@server:/path/to/database.db ./sqlite-backup.db
```

---

## Option 1: Migration Scripts (Recommended)

I've created migration scripts for both Linux/Mac (Bash) and Windows (PowerShell) that:
- Export all tables from SQLite to CSV
- Import CSV files into PostgreSQL
- Update sequences automatically
- Verify record counts

### Step 1: Download SQLite Database

Download your SQLite database from production to your local machine:

```bash
# Example using SCP
scp user@your-server:/path/to/database.db ./sqlite-production.db

# Or if using Docker
docker cp container_name:/app/database.db ./sqlite-production.db
```

### Step 2: Run the Migration Script

**On Linux/Mac:**

```bash
# Make script executable
chmod +x migrate-sqlite-to-postgres.sh

# Run migration
./migrate-sqlite-to-postgres.sh sqlite-production.db localhost 5432 twinkforsale postgres
```

**On Windows:**

```powershell
# Run in PowerShell
.\migrate-sqlite-to-postgres.ps1 -SqliteDb "sqlite-production.db" -PostgresHost "localhost" -PostgresPort 5432 -PostgresDb "twinkforsale" -PostgresUser "postgres"
```

The migration script will:
1. Export all tables from SQLite to CSV files
2. Prompt for PostgreSQL password
3. Test PostgreSQL connection
4. Ask for confirmation before importing
5. Import all data into PostgreSQL
6. Update sequences
7. Show verification counts

### Step 3: Verify the Migration

The script automatically verifies record counts. You can also manually verify:

```bash
# Connect to PostgreSQL
psql -h localhost -U postgres -d twinkforsale

# Check a few tables
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM uploads;
SELECT COUNT(*) FROM bio_links;
```

---

## Option 2: pgloader (Automated)

`pgloader` is a tool that automatically migrates databases.

### Installation

**Linux/Mac:**
```bash
# Ubuntu/Debian
sudo apt-get install pgloader

# Mac
brew install pgloader
```

**Windows:**
- Download from: https://github.com/dimitri/pgloader/releases
- Or use WSL/Docker

### Step 1: Create pgloader Configuration

Create a file `migration.load`:

```lisp
LOAD DATABASE
    FROM sqlite://./sqlite-production.db
    INTO postgresql://username:password@localhost:5432/twinkforsale

WITH include drop, create tables, create indexes, reset sequences

SET work_mem to '16MB',
    maintenance_work_mem to '512 MB';
```

### Step 2: Run pgloader

```bash
pgloader migration.load
```

### Limitations
- May not handle some custom types correctly
- Requires manual schema adjustments
- Foreign key relationships may need fixing

---

## Option 3: Manual Export/Import

This is the most manual but gives you full control.

### Step 1: Export Data from SQLite

Create an export script `export-sqlite.sql`:

```sql
.headers on
.mode csv
.output users.csv
SELECT * FROM User;

.output uploads.csv
SELECT * FROM Upload;

.output api_keys.csv
SELECT * FROM ApiKey;

.output bio_links.csv
SELECT * FROM BioLink;

.output bio_views.csv
SELECT * FROM BioView;

.output short_links.csv
SELECT * FROM ShortLink;

.output view_logs.csv
SELECT * FROM ViewLog;

.output download_logs.csv
SELECT * FROM DownloadLog;

.output domains.csv
SELECT * FROM Domain;

.output system_events.csv
SELECT * FROM SystemEvent;
```

Run the export:

```bash
sqlite3 sqlite-production.db < export-sqlite.sql
```

### Step 2: Import into PostgreSQL

Create an import script `import-postgres.sql`:

```sql
-- Disable triggers temporarily
SET session_replication_role = 'replica';

-- Import users
\copy "Users" FROM 'users.csv' WITH (FORMAT csv, HEADER true);

-- Import uploads
\copy "Uploads" FROM 'uploads.csv' WITH (FORMAT csv, HEADER true);

-- Import API keys
\copy "ApiKeys" FROM 'api_keys.csv' WITH (FORMAT csv, HEADER true);

-- Import bio links
\copy "BioLinks" FROM 'bio_links.csv' WITH (FORMAT csv, HEADER true);

-- Import bio views
\copy "BioViews" FROM 'bio_views.csv' WITH (FORMAT csv, HEADER true);

-- Import short links
\copy "ShortLinks" FROM 'short_links.csv' WITH (FORMAT csv, HEADER true);

-- Import view logs
\copy "ViewLogs" FROM 'view_logs.csv' WITH (FORMAT csv, HEADER true);

-- Import download logs
\copy "DownloadLogs" FROM 'download_logs.csv' WITH (FORMAT csv, HEADER true);

-- Import domains
\copy "Domains" FROM 'domains.csv' WITH (FORMAT csv, HEADER true);

-- Import system events
\copy "SystemEvents" FROM 'system_events.csv' WITH (FORMAT csv, HEADER true);

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Update sequences
SELECT setval(pg_get_serial_sequence('"Users"', 'Id'), COALESCE(MAX("Id"), 1)) FROM "Users";
SELECT setval(pg_get_serial_sequence('"Uploads"', 'Id'), COALESCE(MAX("Id"), 1)) FROM "Uploads";
-- Add more sequence updates for other tables...
```

Run the import:

```bash
psql -h localhost -U username -d twinkforsale -f import-postgres.sql
```

### Challenges
- Need to handle data type conversions manually
- Boolean values (SQLite uses 0/1, PostgreSQL uses true/false)
- Timestamp formats may differ
- Foreign keys need to be handled carefully

---

## Post-Migration Steps

### 1. Verify Data Integrity

```sql
-- Check record counts
SELECT 'Users' AS table_name, COUNT(*) AS count FROM "Users"
UNION ALL
SELECT 'Uploads', COUNT(*) FROM "Uploads"
UNION ALL
SELECT 'ApiKeys', COUNT(*) FROM "ApiKeys"
UNION ALL
SELECT 'BioLinks', COUNT(*) FROM "BioLinks"
UNION ALL
SELECT 'ShortLinks', COUNT(*) FROM "ShortLinks";
```

### 2. Verify Foreign Keys

```sql
-- Check for orphaned records
SELECT u.* FROM "Uploads" u
LEFT JOIN "Users" usr ON u."UserId" = usr."Id"
WHERE usr."Id" IS NULL;

-- Should return 0 rows
```

### 3. Test Application

```bash
# Start the backend
cd backend
dotnet run

# Check health endpoint
curl http://localhost:5000/api/health

# Try logging in
# Upload a test file
# Check if old uploads are visible
```

### 4. Verify File Storage

Make sure uploaded files are accessible:

```bash
# Check if uploads directory exists
ls -la backend/uploads/

# Verify file count matches database
find backend/uploads/ -type f | wc -l
```

### 5. Update Production

Once verified locally:

1. Schedule maintenance window
2. Backup production database one more time
3. Stop production services
4. Run migration on production
5. Update connection strings to PostgreSQL
6. Start services
7. Monitor logs for errors
8. Test critical functionality

---

## Troubleshooting

### Migration Fails with Foreign Key Errors

**Solution:** Disable foreign key checks temporarily

```sql
-- PostgreSQL
SET CONSTRAINTS ALL DEFERRED;
-- Run your import
SET CONSTRAINTS ALL IMMEDIATE;
```

### Data Type Mismatch Errors

**Common conversions needed:**

| SQLite | PostgreSQL | Fix |
|--------|------------|-----|
| `0`/`1` (bool) | `true`/`false` | Convert in migration |
| `INTEGER` (date) | `TIMESTAMP` | Parse Unix timestamp |
| `TEXT` (JSON) | `JSONB` | Cast to JSONB |

### Sequence Out of Sync

After manual import, sequences may be wrong:

```sql
-- Fix all sequences
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
        EXECUTE format('SELECT setval(pg_get_serial_sequence(''%I'', ''%I''), COALESCE(MAX("%I"), 1)) FROM "%I"',
            r.table_name, r.column_name, r.column_name, r.table_name);
    END LOOP;
END $$;
```

### Character Encoding Issues

Ensure UTF-8 encoding:

```sql
-- Check database encoding
SELECT datname, pg_encoding_to_char(encoding) FROM pg_database;

-- Set client encoding
SET client_encoding = 'UTF8';
```

---

## Rollback Plan

If migration fails:

1. **Keep SQLite database as backup**
2. **Restore from PostgreSQL backup:**
   ```bash
   dropdb twinkforsale
   createdb twinkforsale
   psql twinkforsale < backup.sql
   ```
3. **Revert connection string to SQLite** (if needed)

---

## Performance Tips

### For Large Databases

1. **Disable indexes during import:**
   ```sql
   DROP INDEX IF EXISTS idx_name;
   -- Run import
   CREATE INDEX idx_name ON table(column);
   ```

2. **Increase PostgreSQL work memory:**
   ```sql
   SET work_mem = '256MB';
   SET maintenance_work_mem = '512MB';
   ```

3. **Use COPY instead of INSERT:**
   - Much faster for bulk data
   - Already used in manual method above

4. **Batch the migration:**
   - Migrate tables in order of dependencies
   - Start with tables that have no foreign keys

---

## Migration Checklist

- [ ] Backup SQLite database
- [ ] Download SQLite database locally
- [ ] Set up PostgreSQL connection
- [ ] Run Entity Framework migrations on PostgreSQL
- [ ] Choose migration method (C# tool recommended)
- [ ] Run migration
- [ ] Verify record counts match
- [ ] Check foreign key relationships
- [ ] Test critical application features
- [ ] Verify uploaded files are accessible
- [ ] Update production connection strings
- [ ] Monitor production for issues
- [ ] Keep SQLite backup for 30 days

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review backend logs: `backend/logs/`
3. Check PostgreSQL logs
4. Verify connection strings in `appsettings.json`

---

## Next Steps

After successful migration:

1. ✅ Database migrated to PostgreSQL
2. Update production `appsettings.json` with PostgreSQL connection
3. Deploy backend with new configuration
4. Monitor for any issues
5. After 30 days of stable operation, can remove SQLite database

**Remember:** Keep the SQLite backup for at least 30 days after migration in case you need to roll back!
