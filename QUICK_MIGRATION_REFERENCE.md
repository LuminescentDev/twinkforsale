# Quick Migration Reference

## 🚀 SQLite → PostgreSQL Migration (3 Steps)

### Step 1: Download SQLite Database

```bash
# From your production server
scp user@server:/path/to/database.db ./sqlite-production.db

# Or from Docker
docker cp container:/app/database.db ./sqlite-production.db
```

### Step 2: Run Migration Script

**Linux/Mac:**
```bash
chmod +x migrate-sqlite-to-postgres.sh
./migrate-sqlite-to-postgres.sh sqlite-production.db localhost 5432 twinkforsale postgres
```

**Windows PowerShell:**
```powershell
.\migrate-sqlite-to-postgres.ps1 -SqliteDb "sqlite-production.db"
```

### Step 3: Update Backend Configuration

Edit `backend/appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=twinkforsale;Username=postgres;Password=your_password"
  }
}
```

---

## 📋 Migration Checklist

- [ ] **Backup** SQLite database
- [ ] **Download** SQLite database locally
- [ ] **Ensure** PostgreSQL is running
- [ ] **Run** migration script
- [ ] **Verify** record counts match
- [ ] **Test** application locally
- [ ] **Update** production connection strings
- [ ] **Monitor** for issues
- [ ] **Keep** SQLite backup for 30 days

---

## ✅ Verify Migration Success

```sql
-- Connect to PostgreSQL
psql -h localhost -U postgres -d twinkforsale

-- Check record counts
SELECT 'users' AS table, COUNT(*) FROM users
UNION ALL SELECT 'uploads', COUNT(*) FROM uploads
UNION ALL SELECT 'api_keys', COUNT(*) FROM api_keys
UNION ALL SELECT 'bio_links', COUNT(*) FROM bio_links;

-- Check foreign keys
SELECT COUNT(*) FROM uploads WHERE "UserId" IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM users WHERE "Id" = uploads."UserId");
-- Should return 0
```

---

## 🆘 Common Issues

### "psql: command not found"
**Fix:** Install PostgreSQL client tools
- **Windows:** https://www.postgresql.org/download/windows/
- **Mac:** `brew install postgresql`
- **Linux:** `sudo apt install postgresql-client`

### "sqlite3: command not found"
**Fix:** Install SQLite tools
- **Windows:** Download from https://www.sqlite.org/download.html
- **Mac:** `brew install sqlite3` (usually pre-installed)
- **Linux:** `sudo apt install sqlite3`

### "Connection refused"
**Fix:** Check PostgreSQL is running
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Start PostgreSQL (if not running)
# Linux: sudo systemctl start postgresql
# Mac: brew services start postgresql
# Windows: Check Services app
```

### "Permission denied"
**Fix:** Check PostgreSQL user permissions
```sql
-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE twinkforsale TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
```

### Record count mismatch
**Fix:** Check for import errors
```bash
# Look for errors in migration output
# Re-run migration with fresh database
# Check CSV files for data issues
```

---

## 🔄 Rollback

If migration fails:

```bash
# Drop and recreate PostgreSQL database
dropdb twinkforsale
createdb twinkforsale

# Reapply EF Core migrations
cd backend
dotnet ef database update

# Try migration again
```

---

## 📞 Full Documentation

For detailed instructions, troubleshooting, and alternative methods, see:
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Complete migration guide

---

## ⚡ Production Migration

When ready for production:

1. **Schedule maintenance window** (30-60 minutes)
2. **Announce downtime** to users
3. **Stop application** services
4. **Backup everything** (database + files)
5. **Run migration** on production server
6. **Update connection strings** in production
7. **Start services** with PostgreSQL
8. **Monitor logs** for errors
9. **Test critical features** (login, upload, etc.)
10. **Keep SQLite backup** for 30 days

---

## 🎯 Success Criteria

Migration is successful when:
- ✅ All table record counts match
- ✅ No orphaned foreign key references
- ✅ Users can log in
- ✅ File uploads work
- ✅ Old files are still accessible
- ✅ Analytics show historical data
- ✅ No errors in application logs

---

**Remember:** Always test locally before migrating production!
