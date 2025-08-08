-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_upload_domains" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "domain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "supportsSubdomains" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_upload_domains" ("createdAt", "domain", "id", "isActive", "isDefault", "name", "updatedAt") SELECT "createdAt", "domain", "id", "isActive", "isDefault", "name", "updatedAt" FROM "upload_domains";
DROP TABLE "upload_domains";
ALTER TABLE "new_upload_domains" RENAME TO "upload_domains";
CREATE UNIQUE INDEX "upload_domains_domain_key" ON "upload_domains"("domain");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
