-- CreateTable
CREATE TABLE "short_links" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "maxClicks" INTEGER,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "lastClicked" DATETIME,
    "userId" TEXT,
    CONSTRAINT "short_links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_user_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "maxUploads" INTEGER NOT NULL DEFAULT 100,
    "maxFileSize" BIGINT NOT NULL DEFAULT 10485760,
    "maxStorageLimit" BIGINT,
    "storageUsed" BIGINT NOT NULL DEFAULT 0,
    "maxShortLinks" INTEGER NOT NULL DEFAULT 500,
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
INSERT INTO "new_user_settings" ("bioAccentColor", "bioBackgroundColor", "bioBackgroundImage", "bioCustomCss", "bioDescription", "bioDiscordConfig", "bioDiscordUserId", "bioDisplayName", "bioGradientConfig", "bioIsPublic", "bioLastViewed", "bioParticleConfig", "bioProfileImage", "bioShowDiscord", "bioSpotifyTrack", "bioTextColor", "bioUsername", "bioViews", "createdAt", "customDomain", "customSubdomain", "defaultExpirationDays", "defaultMaxViews", "embedAuthor", "embedColor", "embedDescription", "embedFooter", "embedTitle", "globalParticleConfig", "id", "maxBioLinks", "maxDescriptionLength", "maxDisplayNameLength", "maxFileSize", "maxIconLength", "maxLinkTitleLength", "maxStorageLimit", "maxUploads", "maxUrlLength", "maxUsernameLength", "showFileInfo", "showUploadDate", "showUserStats", "storageUsed", "updatedAt", "uploadDomainId", "useCustomWords", "userId") SELECT "bioAccentColor", "bioBackgroundColor", "bioBackgroundImage", "bioCustomCss", "bioDescription", "bioDiscordConfig", "bioDiscordUserId", "bioDisplayName", "bioGradientConfig", "bioIsPublic", "bioLastViewed", "bioParticleConfig", "bioProfileImage", "bioShowDiscord", "bioSpotifyTrack", "bioTextColor", "bioUsername", "bioViews", "createdAt", "customDomain", "customSubdomain", "defaultExpirationDays", "defaultMaxViews", "embedAuthor", "embedColor", "embedDescription", "embedFooter", "embedTitle", "globalParticleConfig", "id", "maxBioLinks", "maxDescriptionLength", "maxDisplayNameLength", "maxFileSize", "maxIconLength", "maxLinkTitleLength", "maxStorageLimit", "maxUploads", "maxUrlLength", "maxUsernameLength", "showFileInfo", "showUploadDate", "showUserStats", "storageUsed", "updatedAt", "uploadDomainId", "useCustomWords", "userId" FROM "user_settings";
DROP TABLE "user_settings";
ALTER TABLE "new_user_settings" RENAME TO "user_settings";
CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId");
CREATE UNIQUE INDEX "user_settings_bioUsername_key" ON "user_settings"("bioUsername");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "short_links_code_key" ON "short_links"("code");
