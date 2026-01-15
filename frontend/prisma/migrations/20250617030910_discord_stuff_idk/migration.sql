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
    CONSTRAINT "users_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "users_uploadDomainId_fkey" FOREIGN KEY ("uploadDomainId") REFERENCES "upload_domains" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("approvedAt", "approvedById", "bioAccentColor", "bioBackgroundColor", "bioBackgroundImage", "bioCustomCss", "bioDescription", "bioDisplayName", "bioGradientConfig", "bioIsPublic", "bioLastViewed", "bioParticleConfig", "bioProfileImage", "bioSpotifyTrack", "bioTextColor", "bioUsername", "bioViews", "createdAt", "customDomain", "customSubdomain", "defaultExpirationDays", "defaultMaxViews", "email", "emailVerified", "embedAuthor", "embedColor", "embedDescription", "embedFooter", "embedTitle", "globalParticleConfig", "id", "image", "isAdmin", "isApproved", "maxBioLinks", "maxDescriptionLength", "maxDisplayNameLength", "maxFileSize", "maxIconLength", "maxLinkTitleLength", "maxStorageLimit", "maxUploads", "maxUrlLength", "maxUsernameLength", "name", "showFileInfo", "showUploadDate", "showUserStats", "storageUsed", "updatedAt", "uploadDomainId", "useCustomWords") SELECT "approvedAt", "approvedById", "bioAccentColor", "bioBackgroundColor", "bioBackgroundImage", "bioCustomCss", "bioDescription", "bioDisplayName", "bioGradientConfig", "bioIsPublic", "bioLastViewed", "bioParticleConfig", "bioProfileImage", "bioSpotifyTrack", "bioTextColor", "bioUsername", "bioViews", "createdAt", "customDomain", "customSubdomain", "defaultExpirationDays", "defaultMaxViews", "email", "emailVerified", "embedAuthor", "embedColor", "embedDescription", "embedFooter", "embedTitle", "globalParticleConfig", "id", "image", "isAdmin", "isApproved", "maxBioLinks", "maxDescriptionLength", "maxDisplayNameLength", "maxFileSize", "maxIconLength", "maxLinkTitleLength", "maxStorageLimit", "maxUploads", "maxUrlLength", "maxUsernameLength", "name", "showFileInfo", "showUploadDate", "showUserStats", "storageUsed", "updatedAt", "uploadDomainId", "useCustomWords" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_bioUsername_key" ON "users"("bioUsername");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
