/*
  Warnings:

  - You are about to drop the column `bioAccentColor` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `bioBackgroundColor` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `bioBackgroundImage` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `bioCustomCss` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `bioDescription` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `bioDiscordConfig` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `bioDiscordUserId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `bioDisplayName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `bioGradientConfig` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `bioIsPublic` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `bioLastViewed` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `bioParticleConfig` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `bioProfileImage` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `bioShowDiscord` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `bioSpotifyTrack` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `bioTextColor` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `bioUsername` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `bioViews` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `customDomain` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `customSubdomain` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `defaultExpirationDays` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `defaultMaxViews` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `embedAuthor` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `embedColor` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `embedDescription` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `embedFooter` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `embedTitle` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `globalParticleConfig` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `maxBioLinks` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `maxDescriptionLength` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `maxDisplayNameLength` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `maxFileSize` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `maxIconLength` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `maxLinkTitleLength` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `maxStorageLimit` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `maxUploads` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `maxUrlLength` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `maxUsernameLength` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `showFileInfo` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `showUploadDate` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `showUserStats` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `storageUsed` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `uploadDomainId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `useCustomWords` on the `users` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "maxUploads" INTEGER NOT NULL DEFAULT 100,
    "maxFileSize" BIGINT NOT NULL DEFAULT 10485760,
    "maxStorageLimit" BIGINT,
    "storageUsed" BIGINT NOT NULL DEFAULT 0,
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
    "globalParticleConfig" TEXT,
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
    "bioGradientConfig" TEXT,
    "bioParticleConfig" TEXT,
    "bioDiscordUserId" TEXT,
    "bioShowDiscord" BOOLEAN NOT NULL DEFAULT false,
    "bioDiscordConfig" TEXT,
    "maxBioLinks" INTEGER DEFAULT 10,
    "maxUsernameLength" INTEGER DEFAULT 20,
    "maxDisplayNameLength" INTEGER DEFAULT 20,
    "maxDescriptionLength" INTEGER DEFAULT 1000,
    "maxUrlLength" INTEGER DEFAULT 200,
    "maxLinkTitleLength" INTEGER DEFAULT 50,
    "maxIconLength" INTEGER DEFAULT 20,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_settings_uploadDomainId_fkey" FOREIGN KEY ("uploadDomainId") REFERENCES "upload_domains" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Migrate existing user data to user_settings table
INSERT INTO "user_settings" (
    "id", 
    "userId", 
    "maxUploads", 
    "maxFileSize", 
    "maxStorageLimit", 
    "storageUsed",
    "embedTitle",
    "embedDescription",
    "embedColor",
    "embedAuthor",
    "embedFooter",
    "showFileInfo",
    "showUploadDate",
    "showUserStats",
    "customDomain",
    "uploadDomainId",
    "customSubdomain",
    "useCustomWords",
    "defaultExpirationDays",
    "defaultMaxViews",
    "globalParticleConfig",
    "bioUsername",
    "bioDisplayName",
    "bioDescription",
    "bioProfileImage",
    "bioBackgroundImage",
    "bioBackgroundColor",
    "bioTextColor",
    "bioAccentColor",
    "bioCustomCss",
    "bioSpotifyTrack",
    "bioIsPublic",
    "bioViews",
    "bioLastViewed",
    "bioGradientConfig",
    "bioParticleConfig",
    "bioDiscordUserId",
    "bioShowDiscord",
    "bioDiscordConfig",
    "maxBioLinks",
    "maxUsernameLength",
    "maxDisplayNameLength",
    "maxDescriptionLength",
    "maxUrlLength",
    "maxLinkTitleLength",
    "maxIconLength",
    "createdAt",
    "updatedAt"
)
SELECT 
    lower(hex(randomblob(12))) as id,
    "id" as userId,
    "maxUploads",
    "maxFileSize",
    "maxStorageLimit",
    "storageUsed",
    "embedTitle",
    "embedDescription",
    "embedColor",
    "embedAuthor",
    "embedFooter",
    "showFileInfo",
    "showUploadDate",
    "showUserStats",
    "customDomain",
    "uploadDomainId",
    "customSubdomain",
    "useCustomWords",
    "defaultExpirationDays",
    "defaultMaxViews",
    "globalParticleConfig",
    "bioUsername",
    "bioDisplayName",
    "bioDescription",
    "bioProfileImage",
    "bioBackgroundImage",
    "bioBackgroundColor",
    "bioTextColor",
    "bioAccentColor",
    "bioCustomCss",
    "bioSpotifyTrack",
    "bioIsPublic",
    "bioViews",
    "bioLastViewed",
    "bioGradientConfig",
    "bioParticleConfig",
    "bioDiscordUserId",
    "bioShowDiscord",
    "bioDiscordConfig",
    "maxBioLinks",
    "maxUsernameLength",
    "maxDisplayNameLength",
    "maxDescriptionLength",
    "maxUrlLength",
    "maxLinkTitleLength",
    "maxIconLength",
    "createdAt",
    "updatedAt"
FROM "users";

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
    CONSTRAINT "users_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("approvedAt", "approvedById", "createdAt", "email", "emailVerified", "id", "image", "isAdmin", "isApproved", "name", "updatedAt") SELECT "approvedAt", "approvedById", "createdAt", "email", "emailVerified", "id", "image", "isAdmin", "isApproved", "name", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_bioUsername_key" ON "user_settings"("bioUsername");
