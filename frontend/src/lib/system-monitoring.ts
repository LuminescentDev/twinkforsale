import { 
  checkSystemAlerts, 
  checkUserStorageAlerts, 
  cleanupOldEvents,
  createSystemEvent 
} from './system-events';
import type { RequestEvent } from '@builder.io/qwik-city';

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

async function serverRequest<T>(
  endpoint: string,
  requestEvent?: RequestEvent,
  options: RequestInit & { params?: Record<string, string | number | boolean | undefined> } = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.append(key, String(value));
    });
    const queryString = searchParams.toString();
    if (queryString) url += `?${queryString}`;
  }

  const cookies = requestEvent?.request.headers.get('cookie') || '';

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(cookies ? { Cookie: cookies } : {}),
      ...fetchOptions.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || response.statusText);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

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
async function runSystemChecks(requestEvent?: RequestEvent) {
  console.log('Running system checks...');

  // Check system-wide alerts
  await checkSystemAlerts(requestEvent);

  // Check user storage alerts
  const usersResponse = await serverRequest<{ items: Array<{ id: string; email: string }> }>(
    '/admin/users',
    requestEvent,
    { params: { pageSize: 1000 } }
  );

  for (const user of usersResponse.items) {
    await checkUserStorageAlerts(user.id, requestEvent);
  }

  console.log(`System checks completed for ${usersResponse.items.length} users`);
}

/**
 * Trigger system checks manually (for API calls)
 */
export async function triggerSystemChecks(requestEvent?: RequestEvent) {
  await runSystemChecks(requestEvent);
}

/**
 * Monitor upload events for immediate alerts
 */
export async function monitorUploadEvent(userId: string, fileSize: number, requestEvent?: RequestEvent) {
  try {
    // Check if user is approaching limits after this upload
    const usage = await serverRequest<{
      email: string;
      uploadCount: number;
      storageUsed: number;
      maxStorageLimit: number;
      maxUploads: number;
    }>(`/admin/users/${userId}/usage`, requestEvent);

    const maxStorageLimit = usage.maxStorageLimit;
    const currentStorageUsed = usage.storageUsed;
    const newStorageUsed = currentStorageUsed + fileSize;
    const storagePercentage = maxStorageLimit > 0 ? newStorageUsed / maxStorageLimit * 100 : 0;
    const fileCount = usage.uploadCount + 1; // +1 for the current upload
    const maxUploads = usage.maxUploads;
    const fileCountPercentage = maxUploads > 0 ? (fileCount / maxUploads) * 100 : 0;

    // Check for immediate alerts after upload
    if (storagePercentage >= 90 && (currentStorageUsed / maxStorageLimit) * 100 < 90) {
      await createSystemEvent(
        'USER_STORAGE_WARNING',
        'WARNING',
        'User Approaching Storage Limit',
        `User ${usage.email} has reached ${storagePercentage.toFixed(1)}% of their storage limit after recent upload`,
        {
          userId,
          metadata: {
            storageUsed: newStorageUsed,
            storageLimit: maxStorageLimit,
            percentage: storagePercentage,
            triggerUpload: true
          }
        },
        requestEvent
      );
    }

    if (fileCountPercentage >= 90 && (usage.uploadCount / maxUploads * 100) < 90) {
      await createSystemEvent(
        'USER_FILE_LIMIT_WARNING',
        'WARNING',
        'User Approaching File Limit',
        `User ${usage.email} has uploaded ${fileCount}/${maxUploads} files (${fileCountPercentage.toFixed(1)}%)`,
        {
          userId,
          metadata: {
            fileCount,
            maxUploads: maxUploads,
            percentage: fileCountPercentage,
            triggerUpload: true
          }
        },
        requestEvent
      );
    }

  } catch (error) {
    console.error('Error monitoring upload event:', error);
  }
}

/**
 * Monitor failed upload events
 */
export async function monitorFailedUpload(userId: string | null, reason: string, metadata?: any, requestEvent?: RequestEvent) {
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
      },
      requestEvent
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
