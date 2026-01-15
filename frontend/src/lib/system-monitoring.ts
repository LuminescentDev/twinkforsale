import { 
  checkSystemAlerts, 
  checkUserStorageAlerts, 
  cleanupOldEvents,
  createSystemEvent 
} from './system-events';
import { db } from './db';

let monitoringInterval: NodeJS.Timeout | null = null;

/**
 * Start the system monitoring service
 */
export function startSystemMonitoring() {
  if (monitoringInterval) {
    console.log('System monitoring already running');
    return;
  }

  console.log('Starting system monitoring service...');

  // Run initial checks
  runSystemChecks().catch(error => {
    console.error('Initial system check failed:', error);
  });

  // Schedule recurring checks every 5 minutes
  monitoringInterval = setInterval(async () => {
    try {
      await runSystemChecks();
    } catch (error) {
      console.error('Scheduled system check failed:', error);
      await createSystemEvent(
        'SYSTEM_ERROR',
        'ERROR',
        'System Monitoring Error',
        `Failed to run scheduled system checks: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          metadata: { error: error instanceof Error ? error.message : String(error) }
        }
      );
    }
  }, 5 * 60 * 1000); // 5 minutes

  // Schedule cleanup every 24 hours
  setInterval(async () => {
    try {
      await cleanupOldEvents();
    } catch (error) {
      console.error('Event cleanup failed:', error);
    }
  }, 24 * 60 * 60 * 1000); // 24 hours
}

/**
 * Stop the system monitoring service
 */
export function stopSystemMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    console.log('System monitoring service stopped');
  }
}

/**
 * Run all system checks
 */
async function runSystemChecks() {
  console.log('Running system checks...');

  // Check system-wide alerts
  await checkSystemAlerts();

  // Check user storage alerts
  const users = await db.user.findMany({
    select: { id: true, email: true }
  });

  for (const user of users) {
    await checkUserStorageAlerts(user.id);
  }

  console.log(`System checks completed for ${users.length} users`);
}

/**
 * Trigger system checks manually (for API calls)
 */
export async function triggerSystemChecks() {
  await runSystemChecks();
}

/**
 * Monitor upload events for immediate alerts
 */
export async function monitorUploadEvent(userId: string, fileSize: number) {
  try {
    // Check if user is approaching limits after this upload
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { 
        uploads: true,
        settings: true
      }
    });

    if (!user) return;

    const maxStorageLimit = Number(user.settings?.maxStorageLimit || BigInt(50 * 1024 * 1024 * 1024)); // 50GB default
    const currentStorageUsed = Number(user.settings?.storageUsed || BigInt(0));
    const newStorageUsed = currentStorageUsed + fileSize;
    const storagePercentage = newStorageUsed / maxStorageLimit * 100;
    const fileCount = user.uploads.length + 1; // +1 for the current upload
    const maxUploads = user.settings?.maxUploads || 100;
    const fileCountPercentage = (fileCount / maxUploads) * 100;

    // Check for immediate alerts after upload
    if (storagePercentage >= 90 && (currentStorageUsed / maxStorageLimit) * 100 < 90) {
      await createSystemEvent(
        'USER_STORAGE_WARNING',
        'WARNING',
        'User Approaching Storage Limit',
        `User ${user.email} has reached ${storagePercentage.toFixed(1)}% of their storage limit after recent upload`,
        {
          userId,
          metadata: {
            storageUsed: newStorageUsed,
            storageLimit: maxStorageLimit,
            percentage: storagePercentage,
            triggerUpload: true
          }
        }
      );
    }

    if (fileCountPercentage >= 90 && (user.uploads.length / maxUploads * 100) < 90) {
      await createSystemEvent(
        'USER_FILE_LIMIT_WARNING',
        'WARNING',
        'User Approaching File Limit',
        `User ${user.email} has uploaded ${fileCount}/${maxUploads} files (${fileCountPercentage.toFixed(1)}%)`,
        {
          userId,
          metadata: {
            fileCount,
            maxUploads: maxUploads,
            percentage: fileCountPercentage,
            triggerUpload: true
          }
        }
      );
    }

  } catch (error) {
    console.error('Error monitoring upload event:', error);
  }
}

/**
 * Monitor failed upload events
 */
export async function monitorFailedUpload(userId: string | null, reason: string, metadata?: any) {
  try {
    await createSystemEvent(
      'FAILED_UPLOAD',
      'WARNING',
      'Upload Failed',
      `Upload failed: ${reason}`,
      {
        userId: userId || undefined,
        metadata: {
          reason,
          ...metadata
        }
      }
    );
  } catch (error) {
    console.error('Error monitoring failed upload:', error);
  }
}

/**
 * Get monitoring status
 */
export function getMonitoringStatus() {
  return {
    isRunning: monitoringInterval !== null,
    // Don't return the actual interval object as it's not serializable
    intervalExists: monitoringInterval !== null
  };
}
