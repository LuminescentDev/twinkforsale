/*
  Warnings:

  - You are about to drop the column `customUploadDomain` on the `users` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "upload_domains" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "domain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
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
    "useCustomWords" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "users_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "users_uploadDomainId_fkey" FOREIGN KEY ("uploadDomainId") REFERENCES "upload_domains" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("approvedAt", "approvedById", "createdAt", "customDomain", "email", "emailVerified", "embedAuthor", "embedColor", "embedDescription", "embedFooter", "embedTitle", "id", "image", "isAdmin", "isApproved", "maxFileSize", "maxStorageLimit", "maxUploads", "name", "showFileInfo", "showUploadDate", "showUserStats", "storageUsed", "updatedAt", "useCustomWords") SELECT "approvedAt", "approvedById", "createdAt", "customDomain", "email", "emailVerified", "embedAuthor", "embedColor", "embedDescription", "embedFooter", "embedTitle", "id", "image", "isAdmin", "isApproved", "maxFileSize", "maxStorageLimit", "maxUploads", "name", "showFileInfo", "showUploadDate", "showUserStats", "storageUsed", "updatedAt", "useCustomWords" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "upload_domains_domain_key" ON "upload_domains"("domain");
