-- AlterTable
ALTER TABLE "uploads" ADD COLUMN "maxViews" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "defaultExpirationDays" INTEGER;
ALTER TABLE "users" ADD COLUMN "defaultMaxViews" INTEGER;
