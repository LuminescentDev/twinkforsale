# 🔴 URGENT: Fix Database Schema Missing Error

## The Problem

Your backend is trying to query PostgreSQL tables that don't exist:
```
42P01: relation "uploads" does not exist
```

This means the database schema hasn't been created in PostgreSQL yet.

## The Solution

You need to create and apply Entity Framework Core migrations to create all the database tables.

---

## 🚀 Quick Fix (3 Commands)

Run these commands on your backend server or locally:

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create initial migration (creates migration files)
dotnet ef migrations add InitialCreate

# 3. Apply migration to database (creates tables)
dotnet ef database update
```

That's it! Your database will be created.

---

## 📋 Detailed Instructions

### Step 1: Install EF Core Tools (if not already installed)

```bash
dotnet tool install --global dotnet-ef
# Or update if already installed:
dotnet tool update --global dotnet-ef
```

### Step 2: Create the Initial Migration

```bash
cd backend
dotnet ef migrations add InitialCreate
```

This creates migration files in `backend/Migrations/` that define your database schema.

### Step 3: Apply the Migration

```bash
dotnet ef database update
```

This runs the migrations against your PostgreSQL database and creates all tables.

### Step 4: Verify Tables Were Created

Connect to PostgreSQL and check:

```bash
psql -h your-host -U postgres -d twinkforsale -c "\dt"
```

You should see tables like:
- users
- user_settings
- uploads
- api_keys
- bio_links
- short_links
- view_logs
- download_logs
- etc.

### Step 5: Restart Your Backend

```bash
# If running with Docker
docker restart your-backend-container

# If running directly
# Stop the backend (Ctrl+C) and restart:
dotnet run
```

---

## 🐳 If Running in Docker

If your backend is running in Docker, you need to run the migrations inside the container:

```bash
# Option 1: Exec into container and run migrations
docker exec -it your-backend-container bash
cd /app
dotnet ef database update
exit

# Option 2: Run migration command directly
docker exec your-backend-container dotnet ef database update

# Then restart the container
docker restart your-backend-container
```

---

## ⚙️ Alternative: Let Backend Auto-Migrate on Startup

Your backend already has auto-migration enabled in `Program.cs` (line 129), but it needs migration files to exist first.

After creating the initial migration with `dotnet ef migrations add InitialCreate`, just restart your backend and it will auto-apply the migration.

---

## 🔍 Troubleshooting

### Error: "No DbContext was found"

**Solution:** Make sure you're in the `backend/` directory when running commands.

### Error: "Build failed"

**Solution:** Build the project first:
```bash
dotnet build
dotnet ef migrations add InitialCreate
```

### Error: "Could not connect to database"

**Solution:** Check your `appsettings.json` connection string:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=your-host;Port=5432;Database=twinkforsale;Username=postgres;Password=your-password"
  }
}
```

Test the connection:
```bash
psql -h your-host -U postgres -d twinkforsale
```

### Error: "Database does not exist"

**Solution:** Create the database first:

```bash
psql -h your-host -U postgres
CREATE DATABASE twinkforsale;
\q
```

Then run migrations:
```bash
dotnet ef database update
```

---

## 📝 What Gets Created

The migration will create these tables:

1. **users** - User accounts
2. **user_settings** - User preferences and bio settings
3. **accounts** - OAuth provider accounts
4. **uploads** - File uploads
5. **api_keys** - API authentication keys
6. **short_links** - URL shortener
7. **bio_links** - Bio page links
8. **bio_views** - Bio page analytics
9. **view_logs** - File view tracking
10. **download_logs** - File download tracking
11. **upload_domains** - Custom domains
12. **daily_analytics** - Daily statistics
13. **system_events** - System event logs
14. **system_alerts** - System alerts
15. **click_logs** - Link click tracking

---

## ✅ Verification

After applying migrations, verify everything works:

1. **Check tables exist:**
   ```bash
   psql -h your-host -U postgres -d twinkforsale -c "\dt"
   ```

2. **Check backend starts without errors:**
   ```bash
   # Look for this line in logs:
   # "Database migrations applied successfully"
   ```

3. **Test the API endpoint:**
   ```bash
   curl http://your-backend/api/public/stats
   ```
   
   Should return JSON instead of 500 error.

4. **Check frontend loads:**
   - Visit your frontend URL
   - Should load without "Failed to fetch public stats" errors

---

## 🎯 Quick Command Reference

```bash
# Create migration
dotnet ef migrations add InitialCreate

# Apply migration
dotnet ef database update

# List migrations
dotnet ef migrations list

# Rollback last migration
dotnet ef database update PreviousMigrationName

# Remove last migration (if not applied)
dotnet ef migrations remove

# Generate SQL script (for review)
dotnet ef migrations script
```

---

## 🚨 For Production

If this is a production server:

1. **Backup first** (even though database is empty):
   ```bash
   pg_dump -h host -U postgres twinkforsale > backup.sql
   ```

2. **Test migrations locally first** with the same PostgreSQL version

3. **Schedule maintenance window** if the site is live

4. **Run migrations:**
   ```bash
   dotnet ef database update
   ```

5. **Monitor logs** after restart for any errors

6. **Test critical functionality:**
   - User login
   - File upload
   - API endpoints

---

## 📞 After Fixing

Once migrations are applied:

1. ✅ Frontend will load without errors
2. ✅ API calls will work
3. ✅ You can start using the application
4. ✅ Ready to migrate data from SQLite (if needed)

Then you can proceed with the SQLite → PostgreSQL data migration using the scripts in `MIGRATION_GUIDE.md`.

---

**Need help?** Check the troubleshooting section above or review Entity Framework Core migration docs.
