import { db } from "~/lib/db";

/**
 * Updates daily analytics for the current date
 * This function aggregates view logs and uploads for today
 */
export async function updateDailyAnalytics(): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow

  try {
    // Count total views for today
    const totalViews = await db.viewLog.count({
      where: {
        viewedAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    // Count unique views for today (unique IP addresses)
    const uniqueViewsResult = await db.viewLog.groupBy({
      by: ['ipAddress'],
      where: {
        viewedAt: {
          gte: today,
          lt: tomorrow
        },
        ipAddress: {
          not: null
        }
      },
      _count: {
        ipAddress: true
      }
    });

    const uniqueViews = uniqueViewsResult.length;

    // Count total downloads for today
    const totalDownloads = await db.downloadLog.count({
      where: {
        downloadedAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    // Count unique downloads for today (unique IP addresses)
    const uniqueDownloadsResult = await db.downloadLog.groupBy({
      by: ['ipAddress'],
      where: {
        downloadedAt: {
          gte: today,
          lt: tomorrow
        },
        ipAddress: {
          not: null
        }
      },
      _count: {
        ipAddress: true
      }
    });

    const uniqueDownloads = uniqueDownloadsResult.length;

    // Count uploads for today
    const uploadsCount = await db.upload.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    // Count users registered today
    const usersRegistered = await db.user.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    // Upsert daily analytics record
    await db.dailyAnalytics.upsert({
      where: {
        date: today
      },
      update: {
        totalViews,
        uniqueViews,
        totalDownloads,
        uniqueDownloads,
        uploadsCount,
        usersRegistered,
        updatedAt: new Date()
      },
      create: {
        date: today,
        totalViews,
        uniqueViews,
        totalDownloads,
        uniqueDownloads,
        uploadsCount,
        usersRegistered
      }
    });

  } catch (error) {
    console.error('Error updating daily analytics:', error);
  }
}

/**
 * Gets real-time analytics data for today
 */
export async function getTodayAnalytics() {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow

  // Count total views for today
  const totalViews = await db.viewLog.count({
    where: {
      viewedAt: {
        gte: today,
        lt: tomorrow
      }
    }
  });

  // Count unique views for today (unique IP addresses)
  const uniqueViewsResult = await db.viewLog.groupBy({
    by: ['ipAddress'],
    where: {
      viewedAt: {
        gte: today,
        lt: tomorrow
      },
      ipAddress: {
        not: null
      }
    },
    _count: {
      ipAddress: true
    }
  });
  const uniqueViews = uniqueViewsResult.length;

  // Count total downloads for today
  const totalDownloads = await db.downloadLog.count({
    where: {
      downloadedAt: {
        gte: today,
        lt: tomorrow
      }
    }
  });

  // Count unique downloads for today (unique IP addresses)
  const uniqueDownloadsResult = await db.downloadLog.groupBy({
    by: ['ipAddress'],
    where: {
      downloadedAt: {
        gte: today,
        lt: tomorrow
      },
      ipAddress: {
        not: null
      }
    },
    _count: {
      ipAddress: true
    }
  });

  const uniqueDownloads = uniqueDownloadsResult.length;

  // Count uploads for today
  const uploadsCount = await db.upload.count({
    where: {
      createdAt: {
        gte: today,
        lt: tomorrow
      }
    }
  });

  // Count users registered today
  const usersRegistered = await db.user.count({
    where: {
      createdAt: {
        gte: today,
        lt: tomorrow
      }
    }
  });

  return {
    date: today.toISOString().split('T')[0],
    totalViews,
    uniqueViews,
    totalDownloads,
    uniqueDownloads,
    uploadsCount,
    usersRegistered
  };
}

/**
 * Gets analytics data for the last N days with real-time data for today
 */
export async function getAnalyticsData(days: number = 7) {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999); // End of today

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0); // Start of N days ago

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  // Get stored daily analytics (excluding today for real-time data)
  const analytics = await db.dailyAnalytics.findMany({
    where: {
      date: {
        gte: startDate,
        lt: today // Exclude today to get real-time data
      }
    },
    orderBy: {
      date: 'asc'
    }
  });

  // Get real-time data for today
  const todayAnalytics = await getTodayAnalytics();

  // Fill in missing days with zero data
  const result = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];

    if (dateStr === todayStr) {
      // Use real-time data for today
      result.push(todayAnalytics);
    } else {
      // Use stored data for previous days
      const existing = analytics.find((a: any) =>
        a.date.toISOString().split('T')[0] === dateStr
      );

      result.push({
        date: dateStr,
        totalViews: existing?.totalViews || 0,
        uniqueViews: existing?.uniqueViews || 0,
        totalDownloads: existing?.totalDownloads || 0,
        uniqueDownloads: existing?.uniqueDownloads || 0,
        uploadsCount: existing?.uploadsCount || 0,
        usersRegistered: existing?.usersRegistered || 0
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}

/**
 * Gets real-time analytics for a specific upload for today
 */
export async function getUploadTodayAnalytics(uploadId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow

  const viewLogs = await db.viewLog.findMany({
    where: {
      uploadId,
      viewedAt: {
        gte: today,
        lt: tomorrow
      }
    }
  });
  const totalViews = viewLogs.length;
  const uniqueIPs = new Set(viewLogs.map((log: any) => log.ipAddress).filter(Boolean));
  const uniqueViews = uniqueIPs.size;

  // Get download logs for today
  const downloadLogs = await db.downloadLog.findMany({
    where: {
      uploadId,
      downloadedAt: {
        gte: today,
        lt: tomorrow
      }
    }
  });
  const totalDownloads = downloadLogs.length;
  const uniqueDownloadIPs = new Set(downloadLogs.map((log: any) => log.ipAddress).filter(Boolean));
  const uniqueDownloads = uniqueDownloadIPs.size;

  return {
    date: today.toISOString().split('T')[0],
    totalViews,
    uniqueViews,
    totalDownloads,
    uniqueDownloads
  };
}

/**
 * Gets analytics data for a specific upload over N days
 */
export async function getUploadAnalytics(uploadId: string, days: number = 7) {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999); // End of today

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0); // Start of N days ago

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  // Get view logs excluding today for real-time data
  const viewLogs = await db.viewLog.findMany({
    where: {
      uploadId,
      viewedAt: {
        gte: startDate,
        lt: today
      }
    },
    orderBy: {
      viewedAt: 'asc'
    }
  });

  // Get download logs excluding today for real-time data
  const downloadLogs = await db.downloadLog.findMany({
    where: {
      uploadId,
      downloadedAt: {
        gte: startDate,
        lt: today
      }
    },
    orderBy: {
      downloadedAt: 'asc'
    }
  });

  // Get real-time data for today
  const todayAnalytics = await getUploadTodayAnalytics(uploadId);

  // Process data by day
  const dayMap = new Map();

  // Initialize all days with zero data
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    dayMap.set(dateStr, {
      date: dateStr,
      totalViews: 0,
      uniqueViews: 0,
      totalDownloads: 0,
      uniqueDownloads: 0,
      ipViews: new Set(),
      ipDownloads: new Set()
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Process view logs
  viewLogs.forEach((log: any) => {
    const dateStr = log.viewedAt.toISOString().split('T')[0];
    const day = dayMap.get(dateStr);
    if (day) {
      day.totalViews++;
      if (log.ipAddress) {
        day.ipViews.add(log.ipAddress);
      }
    }
  });

  // Process download logs
  downloadLogs.forEach((log: any) => {
    const dateStr = log.downloadedAt.toISOString().split('T')[0];
    const day = dayMap.get(dateStr);
    if (day) {
      day.totalDownloads++;
      if (log.ipAddress) {
        day.ipDownloads.add(log.ipAddress);
      }
    }
  });

  // Convert to array and set unique counts
  const result = Array.from(dayMap.values()).map((day: any) => ({
    date: day.date,
    totalViews: day.date === todayStr ? todayAnalytics.totalViews : day.totalViews,
    uniqueViews: day.date === todayStr ? todayAnalytics.uniqueViews : day.ipViews.size,
    totalDownloads: day.date === todayStr ? todayAnalytics.totalDownloads : day.totalDownloads,
    uniqueDownloads: day.date === todayStr ? todayAnalytics.uniqueDownloads : day.ipDownloads.size
  }));

  return result;
}

/**
 * Gets real-time analytics for a user for today
 */
export async function getUserTodayAnalytics(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow

  // Get all user's uploads
  const uploads = await db.upload.findMany({
    where: { userId },
    select: { id: true }
  });

  const uploadIds = uploads.map((u: any) => u.id);
  if (uploadIds.length === 0) {
    return {
      date: today.toISOString().split('T')[0],
      totalViews: 0,
      uniqueViews: 0,
      uploadsCount: 0,
      usersRegistered: 0 // User analytics don't track user registrations
    };
  }

  // Count total views for today
  const totalViews = await db.viewLog.count({
    where: {
      uploadId: {
        in: uploadIds
      },
      viewedAt: {
        gte: today,
        lt: tomorrow
      }
    }
  });

  // Count unique views for today
  const uniqueViewsResult = await db.viewLog.groupBy({
    by: ['ipAddress'],
    where: {
      uploadId: {
        in: uploadIds
      },
      viewedAt: {
        gte: today,
        lt: tomorrow
      },
      ipAddress: {
        not: null
      }
    },
    _count: {
      ipAddress: true
    }
  });

  const uniqueViews = uniqueViewsResult.length;

  // Count uploads created by this user today
  const uploadsCount = await db.upload.count({
    where: {
      userId,
      createdAt: {
        gte: today,
        lt: tomorrow
      }
    }
  });
  return {
    date: today.toISOString().split('T')[0],
    totalViews,
    uniqueViews,
    uploadsCount,
    usersRegistered: 0 // User analytics don't track user registrations
  };
}

/**
 * Gets analytics data for a specific user over N days
 */
export async function getUserAnalytics(userId: string, days: number = 7) {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999); // End of today

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0); // Start of N days ago

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  // Get all user's uploads
  const uploads = await db.upload.findMany({
    where: { userId },
    select: { id: true }
  });

  const uploadIds = uploads.map((u: any) => u.id);
  if (uploadIds.length === 0) {
    // Fill with empty data
    const result = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        totalViews: 0,
        uniqueViews: 0,
        uploadsCount: 0,
        usersRegistered: 0 // User analytics don't track user registrations
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }

  // Get view logs for all user's uploads (excluding today for real-time data)
  const viewLogs = await db.viewLog.findMany({
    where: {
      uploadId: {
        in: uploadIds
      },
      viewedAt: {
        gte: startDate,
        lt: today
      }
    },
    orderBy: {
      viewedAt: 'asc'
    }
  });

  // Get uploads created by this user in the time period (excluding today)
  const userUploads = await db.upload.findMany({
    where: {
      userId,
      createdAt: {
        gte: startDate,
        lt: today
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  // Get real-time data for today
  const todayAnalytics = await getUserTodayAnalytics(userId);

  // Process data by day
  const dayMap = new Map();

  // Initialize all days with zero data
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    dayMap.set(dateStr, {
      date: dateStr,
      totalViews: 0,
      uniqueViews: 0,
      uploadsCount: 0,
      ipViews: new Set()
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Process view logs
  viewLogs.forEach((log: any) => {
    const dateStr = log.viewedAt.toISOString().split('T')[0];
    const day = dayMap.get(dateStr);
    if (day) {
      day.totalViews++;
      if (log.ipAddress) {
        day.ipViews.add(log.ipAddress);
      }
    }
  });

  // Process uploads
  userUploads.forEach((upload: any) => {
    const dateStr = upload.createdAt.toISOString().split('T')[0];
    const day = dayMap.get(dateStr);
    if (day) {
      day.uploadsCount++;
    }
  });
  // Convert to array and set unique counts
  const result = Array.from(dayMap.values()).map((day: any) => ({
    date: day.date,
    totalViews: day.date === todayStr ? todayAnalytics.totalViews : day.totalViews,
    uniqueViews: day.date === todayStr ? todayAnalytics.uniqueViews : day.ipViews.size,
    uploadsCount: day.date === todayStr ? todayAnalytics.uploadsCount : day.uploadsCount,
    usersRegistered: 0 // User analytics don't track user registrations
  }));

  return result;
}
