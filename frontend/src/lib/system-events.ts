import type { RequestEvent, RequestEventCommon } from '@builder.io/qwik-city';
import { getDiskUsage } from './server-utils';
import { sendCriticalEventNotification, sendDiscordNotification } from './discord-notifications';
import { getEnvConfig } from './env';
import os from 'os';

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

async function serverRequest<T>(
  endpoint: string,
  requestEvent?: RequestEventCommon,
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

export type EventType =
  | 'USER_STORAGE_WARNING'
  | 'USER_STORAGE_CRITICAL'
  | 'USER_FILE_LIMIT_WARNING'
  | 'USER_FILE_LIMIT_CRITICAL'
  | 'SYSTEM_STORAGE_WARNING'
  | 'SYSTEM_STORAGE_CRITICAL'
  | 'HIGH_CPU_USAGE'
  | 'HIGH_MEMORY_USAGE'
  | 'SYSTEM_ERROR'
  | 'FAILED_UPLOAD'
  | 'BULK_STORAGE_CLEANUP'
  | 'USER_REGISTRATION';

export type EventSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  totalMemory: number;
  freeMemory: number;
  uptime: number;
}

export interface EventMetadata {
  [key: string]: any;
}

export interface SystemEventDto {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  metadata?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  cpuUsage?: number | null;
  memoryUsage?: number | null;
  diskUsage?: number | null;
  createdAt: string;
}

/**
 * Get current system metrics
 */
export async function getSystemMetrics(): Promise<SystemMetrics> {
  // Get CPU usage (approximate using loadavg on Unix or process time on Windows)
  const cpus = os.cpus();
  let cpuUsage = 0;

  try {
    // Simple CPU usage calculation
    if (os.loadavg) {
      cpuUsage = Math.min(os.loadavg()[0] / cpus.length * 100, 100);
    } else {
      // Fallback for Windows - use a rough estimate
      cpuUsage = Math.random() * 20 + 10; // Placeholder
    }
  } catch {
    cpuUsage = 0;
  }

  // Memory usage
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;  // Disk usage (only check if using filesystem storage)
  const config = getEnvConfig();
  const isUsingR2 = config.USE_R2_STORAGE;

  let diskUsage = 0;
  if (!isUsingR2) {
    try {
      const diskInfo = await getDiskUsage('./uploads');
      diskUsage = diskInfo.usedPercentage;
    } catch (error) {
      console.warn('Failed to get disk usage:', error);
      diskUsage = 0;
    }
  }

  return {
    cpuUsage,
    memoryUsage,
    diskUsage,
    totalMemory,
    freeMemory,
    uptime: os.uptime()
  };
}

/**
 * Create a system event
 */
export async function createSystemEvent(
  type: EventType,
  severity: EventSeverity,
  title: string,
  message: string,
  options: {
    userId?: string;
    metadata?: EventMetadata;
    includeMetrics?: boolean;
  } = {},
  requestEvent?: RequestEventCommon
) {
  const { userId, metadata, includeMetrics = true } = options;

  let metrics: Partial<SystemMetrics> = {};

  if (includeMetrics) {
    try {
      const systemMetrics = await getSystemMetrics();
      metrics = {
        cpuUsage: systemMetrics.cpuUsage,
        memoryUsage: systemMetrics.memoryUsage,
        diskUsage: systemMetrics.diskUsage
      };
    } catch (error) {
      console.error('Failed to get system metrics:', error);
    }
  }

  const event = await serverRequest<{ id: string }>(
    '/admin/system-events',
    requestEvent,
    {
      method: 'POST',
      body: JSON.stringify({
        type,
        severity,
        title,
        message,
        userId,
        metadata: metadata ?? undefined,
        cpuUsage: metrics.cpuUsage,
        memoryUsage: metrics.memoryUsage,
        diskUsage: metrics.diskUsage
      })
    }
  );
  console.log(`[${severity}] ${type}: ${title}`);

  // Send Discord notification for critical/error events and user registrations
  try {
    // Get user email if userId is provided
    let userEmail: string | undefined;
    if (userId) {
      try {
        const usage = await serverRequest<{ email: string }>('/admin/users/' + userId + '/usage', requestEvent);
        userEmail = usage.email;
      } catch {
        userEmail = undefined;
      }
    }

    // Send critical/error events through the critical notification function
    if (severity === 'CRITICAL' || severity === 'ERROR') {
      await sendCriticalEventNotification(
        type,
        severity,
        title,
        message,
        {
          metadata,
          userEmail,
          cpuUsage: metrics.cpuUsage,
          memoryUsage: metrics.memoryUsage,
          diskUsage: metrics.diskUsage
        }
      );
    }
    // Send user registration events through regular Discord notification
    else if (type === 'USER_REGISTRATION') {
      await sendDiscordNotification(
        type,
        severity,
        title,
        message,
        {
          metadata,
          userEmail,
          cpuUsage: metrics.cpuUsage,
          memoryUsage: metrics.memoryUsage,
          diskUsage: metrics.diskUsage
        }
      );
    }
  } catch (error) {
    console.error('Failed to send Discord notification:', error);
  }

  return event;
}

/**
 * Check user storage usage and create alerts if needed
 */
export async function checkUserStorageAlerts(userId: string, requestEvent?: RequestEventCommon) {
  try {
    const limits = await serverRequest<{
      storageUsed: number;
      storageLimit: number;
      storageUsagePercent: number;
      fileCount: number;
      fileLimit: number;
      fileUsagePercent: number;
    }>(`/admin/users/${userId}/limits`, requestEvent);

    // Storage alerts
    if (limits.storageUsagePercent >= 95) {
      await createSystemEvent(
        'USER_STORAGE_CRITICAL',
        'CRITICAL',
        'User Storage Critical',
        `User ${userId} is using ${limits.storageUsagePercent.toFixed(1)}% of storage limit`,
        {
          userId,
          metadata: {
            storageUsed: limits.storageUsed,
            storageLimit: limits.storageLimit,
            usagePercent: limits.storageUsagePercent
          }
        },
        requestEvent
      );
    } else if (limits.storageUsagePercent >= 80) {
      await createSystemEvent(
        'USER_STORAGE_WARNING',
        'WARNING',
        'User Storage Warning',
        `User ${userId} is using ${limits.storageUsagePercent.toFixed(1)}% of storage limit`,
        {
          userId,
          metadata: {
            storageUsed: limits.storageUsed,
            storageLimit: limits.storageLimit,
            usagePercent: limits.storageUsagePercent
          }
        },
        requestEvent
      );
    }

    // File count alerts
    if (limits.fileUsagePercent >= 95) {
      await createSystemEvent(
        'USER_FILE_LIMIT_CRITICAL',
        'CRITICAL',
        'User File Limit Critical',
        `User ${userId} has ${limits.fileCount}/${limits.fileLimit} files (${limits.fileUsagePercent.toFixed(1)}%)`,
        {
          userId,
          metadata: {
            fileCount: limits.fileCount,
            fileLimit: limits.fileLimit,
            usagePercent: limits.fileUsagePercent
          }
        },
        requestEvent
      );
    } else if (limits.fileUsagePercent >= 80) {
      await createSystemEvent(
        'USER_FILE_LIMIT_WARNING',
        'WARNING',
        'User File Limit Warning',
        `User ${userId} has ${limits.fileCount}/${limits.fileLimit} files (${limits.fileUsagePercent.toFixed(1)}%)`,
        {
          userId,
          metadata: {
            fileCount: limits.fileCount,
            fileLimit: limits.fileLimit,
            usagePercent: limits.fileUsagePercent
          }
        },
        requestEvent
      );
    }

  } catch (error) {
    console.error('Error checking user storage alerts:', error);
    await createSystemEvent(
      'SYSTEM_ERROR',
      'ERROR',
      'Storage Alert Check Failed',
      `Failed to check storage alerts for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        userId,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      },
      requestEvent
    );
  }
}

/**
 * Check system-wide alerts
 */
export async function checkSystemAlerts(requestEvent?: RequestEventCommon) {
  try {
    const metrics = await getSystemMetrics();

    // CPU alerts
    if (metrics.cpuUsage >= 90) {
      await createSystemEvent(
        'HIGH_CPU_USAGE',
        'CRITICAL',
        'High CPU Usage',
        `CPU usage is ${metrics.cpuUsage.toFixed(1)}%`,
        {
          metadata: { cpuUsage: metrics.cpuUsage },
          includeMetrics: false
        },
        requestEvent
      );
    }

    // Memory alerts
    if (metrics.memoryUsage >= 90) {
      await createSystemEvent(
        'HIGH_MEMORY_USAGE',
        'CRITICAL',
        'High Memory Usage',
        `Memory usage is ${metrics.memoryUsage.toFixed(1)}%`,
        {
          metadata: { memoryUsage: metrics.memoryUsage },
          includeMetrics: false
        },
        requestEvent
      );
    }    // Disk space alerts (only check if using filesystem storage)
    const config = getEnvConfig();
    const isUsingR2 = config.USE_R2_STORAGE;

    if (!isUsingR2 && metrics.diskUsage >= 95) {
      await createSystemEvent(
        'SYSTEM_STORAGE_CRITICAL',
        'CRITICAL',
        'System Storage Critical',
        `Disk usage is ${metrics.diskUsage.toFixed(1)}%`,
        {
          metadata: { diskUsage: metrics.diskUsage },
          includeMetrics: false
        },
        requestEvent
      );
    } else if (!isUsingR2 && metrics.diskUsage >= 80) {
      await createSystemEvent(
        'SYSTEM_STORAGE_WARNING',
        'WARNING',
        'System Storage Warning',
        `Disk usage is ${metrics.diskUsage.toFixed(1)}%`,
        {
          metadata: { diskUsage: metrics.diskUsage },
          includeMetrics: false
        },
        requestEvent
      );
    }

  } catch (error) {
    console.error('Error checking system alerts:', error);
    await createSystemEvent(
      'SYSTEM_ERROR',
      'ERROR',
      'System Alert Check Failed',
      `Failed to check system alerts: ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      },
      requestEvent
    );
  }
}

/**
 * Get recent system events
 */
export async function getRecentSystemEvents(
  limit: number = 50,
  severity?: EventSeverity,
  userId?: string,
  requestEvent?: RequestEventCommon
) {
  return await serverRequest<SystemEventDto[]>(
    '/admin/system-events',
    requestEvent,
    { params: { limit, severity, userId } }
  );
}

/**
 * Get system events statistics
 */
export async function getSystemEventsStats(hours: number = 24, requestEvent?: RequestEventCommon) {
  const stats = await serverRequest<{ counts: Record<string, number> }>(
    '/admin/system-events/stats',
    requestEvent,
    { params: { hours } }
  );

  return stats.counts as Record<EventSeverity, number>;
}

/**
 * Clean up old system events (keep last 30 days)
 */
export async function cleanupOldEvents(requestEvent?: RequestEventCommon): Promise<number> {
  const result = await serverRequest<{ deletedCount: number }>(
    '/admin/system-events/cleanup',
    requestEvent,
    { method: 'POST' }
  );

  if (result.deletedCount > 0) {
    await createSystemEvent(
      'BULK_STORAGE_CLEANUP',
      'INFO',
      'System Events Cleanup',
      `Cleaned up ${result.deletedCount} old system events (older than 30 days)`,
      {
        metadata: { deletedCount: result.deletedCount }
      },
      requestEvent
    );
  }

  return result.deletedCount;
}

/**
 * Delete a specific system event by ID
 */
export async function deleteSystemEvent(eventId: string, requestEvent?: RequestEventCommon): Promise<boolean> {
  try {
    await serverRequest(`/admin/system-events/${eventId}`, requestEvent, { method: 'DELETE' });
    return true;
  } catch (error) {
    console.error('Error deleting system event:', error);
    return false;
  }
}

/**
 * Clear all system events (with optional severity filter)
 */
export async function clearAllSystemEvents(severityFilter?: EventSeverity, requestEvent?: RequestEventCommon): Promise<number> {
  const result = await serverRequest<{ deletedCount: number }>(
    '/admin/system-events',
    requestEvent,
    { method: 'DELETE', params: { severity: severityFilter } }
  );

  return result.deletedCount;
}

/**
 * Clear non-critical events (INFO and WARNING)
 */
export async function clearNonCriticalEvents(requestEvent?: RequestEventCommon): Promise<number> {
  const result = await serverRequest<{ deletedCount: number }>(
    '/admin/system-events/non-critical',
    requestEvent,
    { method: 'DELETE' }
  );

  return result.deletedCount;
}

/**
 * Initialize system alerts configuration
 */
export async function initializeSystemAlerts() {
  // Backend handles alert configuration.
  return;
}

/**
 * Check if user is approaching limits and warn them
 */
export async function checkUserLimits(userId: string, requestEvent?: RequestEventCommon) {
  try {
    const limits = await serverRequest<{
      storageUsed: number;
      storageLimit: number;
      storageUsagePercent: number;
      fileCount: number;
      fileLimit: number;
      fileUsagePercent: number;
      storageApproaching: boolean;
      filesApproaching: boolean;
    }>(`/admin/users/${userId}/limits`, requestEvent);

    return {
      storage: {
        used: limits.storageUsed,
        limit: limits.storageLimit,
        usagePercent: limits.storageUsagePercent,
        approaching: limits.storageApproaching
      },
      files: {
        count: limits.fileCount,
        limit: limits.fileLimit,
        usagePercent: limits.fileUsagePercent,
        approaching: limits.filesApproaching
      }
    };
  } catch (error) {
    console.error('Error checking user limits:', error);
    return null;
  }
}
