import { getDiskUsage } from './server-utils';
import { sendCriticalEventNotification, sendDiscordNotification } from './discord-notifications';
import { db } from './db';
import { getEnvConfig } from './env';
import os from 'os';

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
  } = {}
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

  const event = await db.systemEvent.create({
    data: {
      type,
      severity,
      title,
      message,
      metadata: metadata ?? undefined,
      userId,
      cpuUsage: metrics.cpuUsage,
      memoryUsage: metrics.memoryUsage,
      diskUsage: metrics.diskUsage
    }
  });
  console.log(`[${severity}] ${type}: ${title}`);

  // Send Discord notification for critical/error events and user registrations
  try {
    // Get user email if userId is provided
    let userEmail: string | undefined;
    if (userId) {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { email: true }
      });
      userEmail = user?.email;
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
export async function checkUserStorageAlerts(userId: string) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        uploads: {
          select: { size: true }
        },
        settings: true
      }
    });

    if (!user) return;

    const totalStorage = user.uploads.reduce((sum: number, upload: any) => sum + Number(upload.size), 0);
    const storageLimit = Number(user.settings?.maxStorageLimit || BigInt(10737418240)); // 10GB default
    const storageUsagePercent = (totalStorage / storageLimit) * 100;

    // Update user's storage usage
    if (user.settings) {
      await db.userSettings.update({
        where: { userId: userId },
        data: { storageUsed: BigInt(totalStorage) }
      });
    } else {
      // Create default settings if they don't exist
      await db.userSettings.create({
        data: {
          userId: userId,
          storageUsed: BigInt(totalStorage)
        }
      });
    }

    // Storage alerts
    if (storageUsagePercent >= 95) {
      await createSystemEvent(
        'USER_STORAGE_CRITICAL',
        'CRITICAL',
        'User Storage Critical',
        `User ${user.email} is using ${storageUsagePercent.toFixed(1)}% of storage limit`,
        {
          userId,
          metadata: {
            storageUsed: totalStorage,
            storageLimit,
            usagePercent: storageUsagePercent
          }
        }
      );
    } else if (storageUsagePercent >= 80) {
      await createSystemEvent(
        'USER_STORAGE_WARNING',
        'WARNING',
        'User Storage Warning',
        `User ${user.email} is using ${storageUsagePercent.toFixed(1)}% of storage limit`,
        {
          userId,
          metadata: {
            storageUsed: totalStorage,
            storageLimit,
            usagePercent: storageUsagePercent
          }
        }
      );
    }

    // File count alerts
    const fileCount = user.uploads.length;
    const fileLimit = user.settings?.maxUploads || 1000; // Default limit
    const fileUsagePercent = (fileCount / fileLimit) * 100;

    if (fileUsagePercent >= 95) {
      await createSystemEvent(
        'USER_FILE_LIMIT_CRITICAL',
        'CRITICAL',
        'User File Limit Critical',
        `User ${user.email} has ${fileCount}/${fileLimit} files (${fileUsagePercent.toFixed(1)}%)`,
        {
          userId,
          metadata: {
            fileCount,
            fileLimit,
            usagePercent: fileUsagePercent
          }
        }
      );
    } else if (fileUsagePercent >= 80) {
      await createSystemEvent(
        'USER_FILE_LIMIT_WARNING',
        'WARNING',
        'User File Limit Warning',
        `User ${user.email} has ${fileCount}/${fileLimit} files (${fileUsagePercent.toFixed(1)}%)`,
        {
          userId,
          metadata: {
            fileCount,
            fileLimit,
            usagePercent: fileUsagePercent
          }
        }
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
      }
    );
  }
}

/**
 * Check system-wide alerts
 */
export async function checkSystemAlerts() {
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
        }
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
        }
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
        }
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
        }
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
      }
    );
  }
}

/**
 * Get recent system events
 */
export async function getRecentSystemEvents(
  limit: number = 50,
  severity?: EventSeverity, userId?: string
) {
  return await db.systemEvent.findMany({
    where: {
      ...(severity && { severity }),
      ...(userId && { userId })
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          email: true,
          name: true
        }
      }
    }
  });
}

/**
 * Get system events statistics
 */
export async function getSystemEventsStats(hours: number = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const stats = await db.systemEvent.groupBy({
    by: ['severity'],
    where: {
      createdAt: { gte: since }
    },
    _count: {
      id: true
    }
  });

  return stats.reduce((acc: any, stat: any) => {
    acc[stat.severity as EventSeverity] = stat._count.id;
    return acc;
  }, {} as Record<EventSeverity, number>);
}

/**
 * Clean up old system events (keep last 30 days)
 */
export async function cleanupOldEvents() {
  const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

  const result = await db.systemEvent.deleteMany({
    where: {
      createdAt: { lt: cutoffDate }
    }
  });

  if (result.count > 0) {
    await createSystemEvent(
      'BULK_STORAGE_CLEANUP',
      'INFO',
      'System Events Cleanup',
      `Cleaned up ${result.count} old system events (older than 30 days)`,
      {
        metadata: { deletedCount: result.count, cutoffDate: cutoffDate.toISOString() }
      }
    );
  }

  return result.count;
}

/**
 * Delete a specific system event by ID
 */
export async function deleteSystemEvent(eventId: string): Promise<boolean> {
  try {
    await db.systemEvent.delete({
      where: { id: eventId }
    });
    return true;
  } catch (error) {
    console.error('Error deleting system event:', error);
    return false;
  }
}

/**
 * Clear all system events (with optional severity filter)
 */
export async function clearAllSystemEvents(severityFilter?: EventSeverity): Promise<number> {
  const result = await db.systemEvent.deleteMany({
    where: severityFilter ? {
      severity: severityFilter
    } : {}
  });

  return result.count;
}

/**
 * Clear non-critical events (INFO and WARNING)
 */
export async function clearNonCriticalEvents(): Promise<number> {
  const result = await db.systemEvent.deleteMany({
    where: {
      severity: {
        in: ['INFO', 'WARNING']
      }
    }
  });

  return result.count;
}

/**
 * Initialize system alerts configuration
 */
export async function initializeSystemAlerts() {
  // Default alert configurations
  const defaultAlerts = [
    {
      eventType: 'SYSTEM_STORAGE_WARNING',
      threshold: 80,
      enabled: true
    },
    {
      eventType: 'SYSTEM_STORAGE_CRITICAL',
      threshold: 95,
      enabled: true
    },
    {
      eventType: 'HIGH_CPU_USAGE',
      threshold: 90,
      enabled: true
    },
    {
      eventType: 'HIGH_MEMORY_USAGE',
      threshold: 90,
      enabled: true
    }
  ];

  try {
    for (const alert of defaultAlerts) {
      await db.systemAlert.upsert({
        where: { id: alert.eventType },
        update: {},
        create: {
          id: alert.eventType,
          eventType: alert.eventType as EventType,
          threshold: alert.threshold,
          name: alert.eventType.replace(/_/g, ' '),
        }
      });
    }
    console.log('System alerts configuration initialized');
  } catch (error) {
    console.error('Error initializing system alerts:', error);
  }
}

/**
 * Check if user is approaching limits and warn them
 */
export async function checkUserLimits(userId: string) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        uploads: true,
        settings: true
      }
    });

    if (!user) return;

    const totalStorage = user.uploads.reduce((sum: number, upload: any) => sum + Number(upload.size), 0);
    const storageLimit = Number(user.settings?.maxStorageLimit || BigInt(10737418240)); // 10GB default
    const storageUsagePercent = (totalStorage / storageLimit) * 100;

    const fileCount = user.uploads.length;
    const fileLimit = user.settings?.maxUploads || 1000;
    const fileUsagePercent = (fileCount / fileLimit) * 100;

    return {
      storage: {
        used: totalStorage,
        limit: storageLimit,
        usagePercent: storageUsagePercent,
        approaching: storageUsagePercent >= 80
      },
      files: {
        count: fileCount,
        limit: fileLimit,
        usagePercent: fileUsagePercent,
        approaching: fileUsagePercent >= 80
      }
    };

  } catch (error) {
    console.error('Error checking user limits:', error);
    return null;
  }
}
