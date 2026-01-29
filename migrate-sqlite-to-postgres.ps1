# SQLite to PostgreSQL Migration Script for twink.forsale (PowerShell)
# This script exports data from SQLite and imports it into PostgreSQL

param(
    [Parameter(Mandatory=$false)]
    [string]$SqliteDb = "sqlite-production.db",
    
    [Parameter(Mandatory=$false)]
    [string]$PostgresHost = "localhost",
    
    [Parameter(Mandatory=$false)]
    [int]$PostgresPort = 5432,
    
    [Parameter(Mandatory=$false)]
    [string]$PostgresDb = "twinkforsale",
    
    [Parameter(Mandatory=$false)]
    [string]$PostgresUser = "postgres"
)

Write-Host "=== SQLite to PostgreSQL Migration ===" -ForegroundColor Cyan
Write-Host ""

# Check if SQLite database exists
if (-not (Test-Path $SqliteDb)) {
    Write-Host "Error: SQLite database not found: $SqliteDb" -ForegroundColor Red
    Write-Host "Usage: .\migrate-sqlite-to-postgres.ps1 -SqliteDb <path> [-PostgresHost <host>] [-PostgresPort <port>] [-PostgresDb <db>] [-PostgresUser <user>]"
    exit 1
}

Write-Host "Configuration:"
Write-Host "  SQLite Database: $SqliteDb"
Write-Host "  PostgreSQL: $PostgresUser@$PostgresHost:$PostgresPort/$PostgresDb"
Write-Host ""

# Check if sqlite3 is available
$sqlite3Path = Get-Command sqlite3 -ErrorAction SilentlyContinue
if (-not $sqlite3Path) {
    Write-Host "Error: sqlite3 command not found. Please install SQLite tools." -ForegroundColor Red
    Write-Host "Download from: https://www.sqlite.org/download.html"
    exit 1
}

# Check if psql is available
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "Error: psql command not found. Please install PostgreSQL client tools." -ForegroundColor Red
    Write-Host "Download from: https://www.postgresql.org/download/"
    exit 1
}

# Create temp directory for exports
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$exportDir = "./migration-export-$timestamp"
New-Item -ItemType Directory -Path $exportDir | Out-Null
Write-Host "Created export directory: $exportDir" -ForegroundColor Green
Write-Host ""

# Export tables from SQLite
Write-Host "Exporting tables from SQLite..."

$tables = @(
    "users", "user_settings", "accounts", "uploads", "api_keys", 
    "short_links", "bio_links", "bio_views", "view_logs", "download_logs",
    "upload_domains", "daily_analytics", "system_events", "system_alerts", "click_logs"
)

foreach ($table in $tables) {
    Write-Host "  Exporting $table..." -NoNewline
    
    $exportQuery = @"
.headers on
.mode csv
.output $exportDir\$table.csv
SELECT * FROM $table;
"@
    
    $exportQuery | sqlite3 $SqliteDb
    
    $csvPath = Join-Path $exportDir "$table.csv"
    if (Test-Path $csvPath) {
        $count = (Get-Content $csvPath | Measure-Object -Line).Lines - 1  # Subtract header
        Write-Host " ✓ Exported $count records" -ForegroundColor Green
    } else {
        Write-Host " ✗ Export failed" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Export completed! Files saved to: $exportDir" -ForegroundColor Green
Write-Host ""

# Get PostgreSQL password
$securePassword = Read-Host "Please enter PostgreSQL password for user $PostgresUser" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$postgresPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)

# Set environment variable for psql
$env:PGPASSWORD = $postgresPassword

# Test PostgreSQL connection
Write-Host "Testing PostgreSQL connection..."
try {
    $testQuery = "SELECT 1;"
    $result = & psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d $PostgresDb -c $testQuery 2>&1
    Write-Host "✓ PostgreSQL connection successful" -ForegroundColor Green
} catch {
    Write-Host "✗ PostgreSQL connection failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Confirm before importing
Write-Host "WARNING: This will import data into $PostgresDb database." -ForegroundColor Yellow
Write-Host "Existing data may be affected. Make sure you have a backup!" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Continue with import? (yes/no)"
if ($confirm -ne "yes" -and $confirm -ne "y") {
    Write-Host "Import cancelled."
    exit 0
}

# Import into PostgreSQL
Write-Host ""
Write-Host "Importing data into PostgreSQL..."

# Disable triggers during import
$disableTriggersQuery = "SET session_replication_role = 'replica';"
& psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d $PostgresDb -c $disableTriggersQuery | Out-Null

# Import each table
foreach ($table in $tables) {
    $csvPath = Join-Path $exportDir "$table.csv"
    if (Test-Path $csvPath) {
        Write-Host "  Importing $table..." -NoNewline
        
        # Check if file has data (more than just header)
        $lineCount = (Get-Content $csvPath | Measure-Object -Line).Lines
        if ($lineCount -gt 1) {
            $fullCsvPath = Resolve-Path $csvPath
            $importQuery = "\copy $table FROM '$fullCsvPath' WITH (FORMAT csv, HEADER true, NULL '')"
            
            try {
                & psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d $PostgresDb -c $importQuery | Out-Null
                Write-Host " ✓ Imported successfully" -ForegroundColor Green
            } catch {
                Write-Host " ✗ Import failed: $($_.Exception.Message)" -ForegroundColor Red
            }
        } else {
            Write-Host " ⊘ Table is empty, skipped" -ForegroundColor Yellow
        }
    }
}

# Re-enable triggers
$enableTriggersQuery = "SET session_replication_role = 'origin';"
& psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d $PostgresDb -c $enableTriggersQuery | Out-Null

# Update sequences
Write-Host ""
Write-Host "Updating PostgreSQL sequences..."

$updateSequencesQuery = @"
DO `$`$
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
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END LOOP;
END `$`$;
"@

& psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d $PostgresDb -c $updateSequencesQuery | Out-Null
Write-Host "✓ Sequences updated" -ForegroundColor Green

# Verification
Write-Host ""
Write-Host "=== Verification ===" -ForegroundColor Cyan

$verifyQuery = @"
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
"@

& psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d $PostgresDb -c $verifyQuery

Write-Host ""
Write-Host "=== Migration Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Verify the data in PostgreSQL"
Write-Host "  2. Test your application with PostgreSQL"
Write-Host "  3. Update production connection strings"
Write-Host "  4. Keep SQLite backup for 30 days"
Write-Host ""
Write-Host "Export files saved in: $exportDir"
Write-Host "(You can delete this directory after verifying the migration)"

# Clear password
$env:PGPASSWORD = $null
