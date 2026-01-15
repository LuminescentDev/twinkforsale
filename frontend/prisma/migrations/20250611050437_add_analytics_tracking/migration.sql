-- CreateTable
CREATE TABLE "daily_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "uniqueViews" INTEGER NOT NULL DEFAULT 0,
    "uploadsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "view_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uploadId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referer" TEXT,
    "viewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "view_logs_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "uploads" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_analytics_date_key" ON "daily_analytics"("date");

-- CreateIndex
CREATE INDEX "view_logs_uploadId_idx" ON "view_logs"("uploadId");

-- CreateIndex
CREATE INDEX "view_logs_viewedAt_idx" ON "view_logs"("viewedAt");

-- CreateIndex
CREATE INDEX "view_logs_ipAddress_uploadId_viewedAt_idx" ON "view_logs"("ipAddress", "uploadId", "viewedAt");
