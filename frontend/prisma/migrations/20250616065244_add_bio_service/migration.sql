-- CreateTable
CREATE TABLE "bio_links" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "bio_links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bio_views" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referer" TEXT,
    "viewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bio_views_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" DATETIME,
    "approvedById" TEXT,
    "maxUploads" INTEGER NOT NULL DEFAULT 100,
    "maxFileSize" INTEGER NOT NULL DEFAULT 10485760,
    "maxStorageLimit" INTEGER,
    "storageUsed" INTEGER NOT NULL DEFAULT 0,
    "embedTitle" TEXT DEFAULT 'File Upload',
    "embedDescription" TEXT DEFAULT 'Uploaded via twink.forsale',
    "embedColor" TEXT DEFAULT '#8B5CF6',
    "embedAuthor" TEXT,
    "embedFooter" TEXT DEFAULT 'twink.forsale',
    "showFileInfo" BOOLEAN NOT NULL DEFAULT true,
    "showUploadDate" BOOLEAN NOT NULL DEFAULT true,
    "showUserStats" BOOLEAN NOT NULL DEFAULT false,
    "customDomain" TEXT,
    "uploadDomainId" TEXT,
    "customSubdomain" TEXT,
    "useCustomWords" BOOLEAN NOT NULL DEFAULT false,
    "defaultExpirationDays" INTEGER,
    "defaultMaxViews" INTEGER,
    "bioUsername" TEXT,
    "bioDisplayName" TEXT,
    "bioDescription" TEXT,
    "bioProfileImage" TEXT,
    "bioBackgroundImage" TEXT,
    "bioBackgroundColor" TEXT DEFAULT '#8B5CF6',
    "bioTextColor" TEXT DEFAULT '#FFFFFF',
    "bioAccentColor" TEXT DEFAULT '#F59E0B',
    "bioCustomCss" TEXT,
    "bioSpotifyTrack" TEXT,
    "bioIsPublic" BOOLEAN NOT NULL DEFAULT false,
    "bioViews" INTEGER NOT NULL DEFAULT 0,
    "bioLastViewed" DATETIME,
    CONSTRAINT "users_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "users_uploadDomainId_fkey" FOREIGN KEY ("uploadDomainId") REFERENCES "upload_domains" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("approvedAt", "approvedById", "createdAt", "customDomain", "customSubdomain", "defaultExpirationDays", "defaultMaxViews", "email", "emailVerified", "embedAuthor", "embedColor", "embedDescription", "embedFooter", "embedTitle", "id", "image", "isAdmin", "isApproved", "maxFileSize", "maxStorageLimit", "maxUploads", "name", "showFileInfo", "showUploadDate", "showUserStats", "storageUsed", "updatedAt", "uploadDomainId", "useCustomWords") SELECT "approvedAt", "approvedById", "createdAt", "customDomain", "customSubdomain", "defaultExpirationDays", "defaultMaxViews", "email", "emailVerified", "embedAuthor", "embedColor", "embedDescription", "embedFooter", "embedTitle", "id", "image", "isAdmin", "isApproved", "maxFileSize", "maxStorageLimit", "maxUploads", "name", "showFileInfo", "showUploadDate", "showUserStats", "storageUsed", "updatedAt", "uploadDomainId", "useCustomWords" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_bioUsername_key" ON "users"("bioUsername");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "bio_links_userId_order_idx" ON "bio_links"("userId", "order");

-- CreateIndex
CREATE INDEX "bio_views_userId_idx" ON "bio_views"("userId");

-- CreateIndex
CREATE INDEX "bio_views_viewedAt_idx" ON "bio_views"("viewedAt");

-- CreateIndex
CREATE INDEX "bio_views_ipAddress_userId_viewedAt_idx" ON "bio_views"("ipAddress", "userId", "viewedAt");
