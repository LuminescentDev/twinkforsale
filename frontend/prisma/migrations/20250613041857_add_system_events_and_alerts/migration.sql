-- CreateTable
CREATE TABLE "system_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "userId" TEXT,
    "cpuUsage" REAL,
    "memoryUsage" REAL,
    "diskUsage" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "system_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "system_alerts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventType" TEXT NOT NULL,
    "threshold" REAL NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cooldownMinutes" INTEGER NOT NULL DEFAULT 60,
    "notifyAdmins" BOOLEAN NOT NULL DEFAULT true,
    "notifyUser" BOOLEAN NOT NULL DEFAULT false,
    "lastTriggered" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "system_events_type_idx" ON "system_events"("type");

-- CreateIndex
CREATE INDEX "system_events_severity_idx" ON "system_events"("severity");

-- CreateIndex
CREATE INDEX "system_events_userId_idx" ON "system_events"("userId");

-- CreateIndex
CREATE INDEX "system_events_createdAt_idx" ON "system_events"("createdAt");
