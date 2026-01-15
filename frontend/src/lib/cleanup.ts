import fs from "fs";
import path from "path";
import { db } from "~/lib/db";
import { getEnvConfig } from "~/lib/env";

/**
 * Cleanup expired files and files that exceeded view limits
 */
export async function cleanupExpiredFiles() {
  try {
    const now = new Date();
    const { getStorageProvider } = await import("~/lib/storage-server");
    const storage = getStorageProvider();

    // Find files that are expired or exceeded view limits
    const allFiles = await db.upload.findMany({
      where: {
        OR: [
          {
            expiresAt: {
              lte: now
            }
          },
          {
            maxViews: {
              not: null
            }
          }
        ]
      }
    });    // Filter files that exceeded view limits (since Prisma doesn't support field-to-field comparison)
    const filesToDelete = allFiles.filter(file =>
      (file.expiresAt && now > file.expiresAt) ||
      (file.maxViews && file.views >= file.maxViews)
    );

    console.log(`Found ${filesToDelete.length} files to cleanup`);    if (filesToDelete.length === 0) {
      return { cleaned: 0 };
    }

    let cleanedCount = 0;

    for (const file of filesToDelete) {
      try {        // Delete from storage (R2 or filesystem)
        const fileKey = storage.generateFileKey(file.filename, file.userId || "");
        await storage.deleteFile(fileKey);

        // Update user storage if the file had a user
        if (file.userId) {
          await db.userSettings.update({
            where: { userId: file.userId },
            data: {
              storageUsed: {
                decrement: file.size
              }
            }
          });
        }

        // Delete database record
        await db.upload.delete({
          where: { id: file.id }
        });

        cleanedCount++;
        console.log(`Cleaned up expired file: ${file.originalName} (${file.shortCode})`);
      } catch (error: any) {
        console.error(`Failed to cleanup file ${file.shortCode}:`, error);
      }
    }

    console.log(`Cleanup completed. Cleaned ${cleanedCount} files.`);
    return { cleaned: cleanedCount };
  } catch (error: any) {
    console.error('Cleanup process failed:', error);
    throw error;
  }
}

/**
 * Auto-cleanup function that can be called periodically
 */
export async function autoCleanup() {
  try {
    const result = await cleanupExpiredFiles();
    console.log(`Auto-cleanup completed: ${result.cleaned} files cleaned`);
    return result;
  } catch (error: any) {
    console.error('Auto-cleanup failed:', error);
    return { cleaned: 0, error: error.message };
  }
}
