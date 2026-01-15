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
    "storageUsed" INTEGER NOT NULL DEFAULT 0,
    "embedTitle" TEXT DEFAULT 'File Upload',
    "embedDescription" TEXT DEFAULT 'Uploaded via twink.forsale',
    "embedColor" TEXT DEFAULT '#8B5CF6',
    "embedAuthor" TEXT,
    "embedFooter" TEXT DEFAULT 'twink.forsale',
    "showFileInfo" BOOLEAN NOT NULL DEFAULT true,
    "showUploadDate" BOOLEAN NOT NULL DEFAULT true,
    "customDomain" TEXT,
    CONSTRAINT "users_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("createdAt", "customDomain", "email", "emailVerified", "embedAuthor", "embedColor", "embedDescription", "embedFooter", "embedTitle", "id", "image", "maxFileSize", "maxUploads", "name", "showFileInfo", "showUploadDate", "storageUsed", "updatedAt") SELECT "createdAt", "customDomain", "email", "emailVerified", "embedAuthor", "embedColor", "embedDescription", "embedFooter", "embedTitle", "id", "image", "maxFileSize", "maxUploads", "name", "showFileInfo", "showUploadDate", "storageUsed", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
