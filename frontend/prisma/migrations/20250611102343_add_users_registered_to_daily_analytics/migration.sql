-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_daily_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "uniqueViews" INTEGER NOT NULL DEFAULT 0,
    "uploadsCount" INTEGER NOT NULL DEFAULT 0,
    "usersRegistered" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_daily_analytics" ("createdAt", "date", "id", "totalViews", "uniqueViews", "updatedAt", "uploadsCount") SELECT "createdAt", "date", "id", "totalViews", "uniqueViews", "updatedAt", "uploadsCount" FROM "daily_analytics";
DROP TABLE "daily_analytics";
ALTER TABLE "new_daily_analytics" RENAME TO "daily_analytics";
CREATE UNIQUE INDEX "daily_analytics_date_key" ON "daily_analytics"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
