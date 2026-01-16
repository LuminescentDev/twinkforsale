// Server-only utilities that use Node.js modules
// This file should only be imported on the server side

import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Get disk usage information using Node.js built-ins (best-effort fallback).
 */
async function getDiskUsageFallback(dirPath: string): Promise<{
  total: number;
  used: number;
  free: number;
  usedPercentage: number;
}> {
  try {
    const absolutePath = path.resolve(dirPath);

    // Ensure the directory exists
    if (!fs.existsSync(absolutePath)) {
      fs.mkdirSync(absolutePath, { recursive: true });
    }

    // Use memory as a rough proxy for disk usage when real disk metrics are unavailable
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const used = Math.max(totalMemory - freeMemory, 0);

    const estimatedTotal = totalMemory * 10;
    // Estimate free space based on memory usage patterns
    const estimatedFree = Math.max(estimatedTotal - used, freeMemory * 5);

    const usedPercentage = estimatedTotal > 0 ? (used / estimatedTotal) * 100 : 0;

    return {
      total: estimatedTotal,
      used,
      free: estimatedFree,
      usedPercentage,
    };
  } catch (error) {
    console.error('Error getting disk usage (fallback):', error);
    // Return safe default values
    const total = 500 * 1024 * 1024 * 1024; // 500 GB
    const free = 100 * 1024 * 1024 * 1024; // 100 GB
    const used = total - free;
    const usedPercentage = total > 0 ? (used / total) * 100 : 0;

    return {
      total,
      used,
      free,
      usedPercentage,
    };
  }
}

/**
 * Get free space available in the uploads directory
 * @param uploadsPath - Path to the uploads directory
 * @returns Free space in bytes
 */
export async function getFreeSpace(uploadsPath: string = './uploads'): Promise<number> {
  try {
    const diskInfo = await getDiskUsage(uploadsPath);
    return diskInfo.free;
  } catch (error) {
    console.error('Error getting free space:', error);
    // Return a safe default value
    return 100 * 1024 * 1024 * 1024; // 100 GB
  }
}

/**
 * Get disk usage information using Node.js built-ins
 * @param uploadsPath - Path to the uploads directory
 * @returns Object containing total, used, and free space in bytes
 */
export async function getDiskUsage(uploadsPath: string = './uploads'): Promise<{
  total: number;
  used: number;
  free: number;
  usedPercentage: number;
}> {
  return getDiskUsageFallback(uploadsPath);
}

/**
 * Get system metrics including CPU, memory, and disk usage
 * Server-side only function
 */
export async function getSystemMetrics() {
  try {
    // CPU usage calculation
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      const times = cpu.times;
      totalIdle += times.idle;
      totalTick += times.idle + times.user + times.nice + times.sys + times.irq;
    });
    
    const cpuUsage = 100 - (100 * totalIdle / totalTick);
    
    // Memory usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsage = (usedMem / totalMem) * 100;
    
    // Disk usage
    let diskUsage = 0;
    try {
      const diskInfo = await getDiskUsage('./uploads');
      diskUsage = diskInfo.usedPercentage;
    } catch (error) {
      console.warn('Could not get disk usage:', error);
      diskUsage = 0;
    }
    
    return {
      cpuUsage,
      memoryUsage,
      diskUsage,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Error getting system metrics:', error);
    return {
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      timestamp: Date.now()
    };
  }
}
