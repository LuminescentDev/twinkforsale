-- CreateTable
CREATE TABLE "download_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uploadId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referer" TEXT,
    "downloadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "download_logs_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "uploads" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_daily_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "uniqueViews" INTEGER NOT NULL DEFAULT 0,
    "totalDownloads" INTEGER NOT NULL DEFAULT 0,
    "uniqueDownloads" INTEGER NOT NULL DEFAULT 0,
    "uploadsCount" INTEGER NOT NULL DEFAULT 0,
    "usersRegistered" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_daily_analytics" ("createdAt", "date", "id", "totalViews", "uniqueViews", "updatedAt", "uploadsCount", "usersRegistered") SELECT "createdAt", "date", "id", "totalViews", "uniqueViews", "updatedAt", "uploadsCount", "usersRegistered" FROM "daily_analytics";
DROP TABLE "daily_analytics";
ALTER TABLE "new_daily_analytics" RENAME TO "daily_analytics";
CREATE UNIQUE INDEX "daily_analytics_date_key" ON "daily_analytics"("date");
CREATE TABLE "new_uploads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "deletionKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "userId" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "lastViewed" DATETIME,
    "lastDownloaded" DATETIME,
    CONSTRAINT "uploads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_uploads" ("createdAt", "deletionKey", "expiresAt", "filename", "id", "lastViewed", "mimeType", "originalName", "shortCode", "size", "url", "userId", "views") SELECT "createdAt", "deletionKey", "expiresAt", "filename", "id", "lastViewed", "mimeType", "originalName", "shortCode", "size", "url", "userId", "views" FROM "uploads";
DROP TABLE "uploads";
ALTER TABLE "new_uploads" RENAME TO "uploads";
CREATE UNIQUE INDEX "uploads_url_key" ON "uploads"("url");
CREATE UNIQUE INDEX "uploads_shortCode_key" ON "uploads"("shortCode");
CREATE UNIQUE INDEX "uploads_deletionKey_key" ON "uploads"("deletionKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "download_logs_uploadId_idx" ON "download_logs"("uploadId");

-- CreateIndex
CREATE INDEX "download_logs_downloadedAt_idx" ON "download_logs"("downloadedAt");

-- CreateIndex
CREATE INDEX "download_logs_ipAddress_uploadId_downloadedAt_idx" ON "download_logs"("ipAddress", "uploadId", "downloadedAt");
