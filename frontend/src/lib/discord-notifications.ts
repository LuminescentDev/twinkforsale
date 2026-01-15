import type { EventType, EventSeverity } from './system-events';
import { getEnvConfig } from './env';

export interface DiscordEmbed {
  title: string;
  description: string;
  color: number;
  timestamp: string;
  fields?: DiscordEmbedField[];
  footer?: {
    text: string;
  };
  author?: {
    name: string;
    icon_url?: string;
  };
}

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordWebhookPayload {
  embeds: DiscordEmbed[];
  username?: string;
  avatar_url?: string;
}

/**
 * Get Discord embed color based on event severity
 */
function getEmbedColor(severity: EventSeverity): number {
  switch (severity) {
    case 'CRITICAL': return 0xff0000; // Red
    case 'ERROR': return 0xff6b35; // Orange-red
    case 'WARNING': return 0xffb347; // Orange
    case 'INFO': return 0x3498db; // Blue
    default: return 0x95a5a6; // Gray
  }
}

/**
 * Get emoji for event severity
 */
function getSeverityEmoji(severity: EventSeverity): string {
  switch (severity) {
    case 'CRITICAL': return '🚨';
    case 'ERROR': return '❌';
    case 'WARNING': return '⚠️';
    case 'INFO': return 'ℹ️';
    default: return '📝';
  }
}

/**
 * Get emoji for event type
 */
function getEventTypeEmoji(eventType: EventType): string {
  switch (eventType) {
    case 'USER_STORAGE_WARNING':
    case 'USER_STORAGE_CRITICAL':
      return '💾';
    case 'USER_FILE_LIMIT_WARNING':
    case 'USER_FILE_LIMIT_CRITICAL':
      return '📁';
    case 'SYSTEM_STORAGE_WARNING':
    case 'SYSTEM_STORAGE_CRITICAL':
      return '🖥️';
    case 'HIGH_CPU_USAGE':
      return '⚡';
    case 'HIGH_MEMORY_USAGE':
      return '🧠';
    case 'SYSTEM_ERROR':
      return '💥';
    case 'FAILED_UPLOAD':
      return '📤';
    case 'BULK_STORAGE_CLEANUP':
      return '🧹';
    case 'USER_REGISTRATION':
      return '🎉';
    default:
      return '📋';
  }
}

/**
 * Format event type for display
 */
function formatEventType(eventType: EventType): string {
  return eventType
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Create Discord embed for system event
 */
export function createSystemEventEmbed(
  eventType: EventType,
  severity: EventSeverity,
  title: string,
  message: string,
  metadata?: any,
  userEmail?: string,
  cpuUsage?: number,
  memoryUsage?: number,
  diskUsage?: number
): DiscordEmbed {
  const severityEmoji = getSeverityEmoji(severity);
  const typeEmoji = getEventTypeEmoji(eventType);

  const fields: DiscordEmbedField[] = [];

  // Add event type field
  fields.push({
    name: '📋 Event Type',
    value: `${typeEmoji} ${formatEventType(eventType)}`,
    inline: true
  });

  // Add severity field
  fields.push({
    name: '🔥 Severity',
    value: `${severityEmoji} ${severity}`,
    inline: true
  });

  // Add user if present
  if (userEmail) {
    fields.push({
      name: '👤 User',
      value: userEmail,
      inline: true
    });
  }

  // Add system metrics if present
  if (cpuUsage !== undefined || memoryUsage !== undefined || diskUsage !== undefined) {
    const metrics: string[] = [];
    if (cpuUsage !== undefined) metrics.push(`CPU: ${cpuUsage.toFixed(1)}%`);
    if (memoryUsage !== undefined) metrics.push(`Memory: ${memoryUsage.toFixed(1)}%`);
    if (diskUsage !== undefined) metrics.push(`Disk: ${diskUsage.toFixed(1)}%`);

    fields.push({
      name: '📊 System Metrics',
      value: metrics.join('\n'),
      inline: false
    });
  }

  // Add metadata if present and relevant
  if (metadata && Object.keys(metadata).length > 0) {
    const metadataStr = Object.entries(metadata)
      .map(([key, value]) => `**${key}:** ${value}`)
      .join('\n');

    if (metadataStr.length <= 1024) { // Discord field value limit
      fields.push({
        name: '🔍 Details',
        value: metadataStr,
        inline: false
      });
    }
  }
  // Add environment info
  fields.push({
    name: '🌐 Environment',
    value: process.env.NODE_ENV === 'production' ? '🚀 Production' : '🧪 Development',
    inline: true
  });

  return {
    title: `${severityEmoji} ${title}`,
    description: message,
    color: getEmbedColor(severity),
    timestamp: new Date().toISOString(),
    fields,
    footer: {
      text: `twink.forsale System Monitor`
    },
    author: {
      name: 'System Events',
    }
  };
}

/**
 * Send Discord webhook notification
 */
export async function sendDiscordNotification(
  eventType: EventType,
  severity: EventSeverity,
  title: string,
  message: string,
  options: {
    metadata?: any;
    userEmail?: string;
    cpuUsage?: number;
    memoryUsage?: number;
    diskUsage?: number;  } = {}
): Promise<boolean> {
  const config = getEnvConfig();

  if (!config.DISCORD_WEBHOOK_URL) {
    console.log('Discord webhook URL not configured, skipping notification');
    return false;
  }

  try {
    const embed = createSystemEventEmbed(
      eventType,
      severity,
      title,
      message,
      options.metadata,
      options.userEmail,
      options.cpuUsage,
      options.memoryUsage,
      options.diskUsage
    );

    const payload: DiscordWebhookPayload = {
      embeds: [embed],
      username: 'twink.forsale Monitor',
    };

    const response = await fetch(config.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Failed to send Discord notification:', response.status, response.statusText);
      return false;
    }

    console.log(`Discord notification sent for ${severity} event: ${title}`);
    return true;
  } catch (error) {
    console.error('Error sending Discord notification:', error);
    return false;
  }
}

/**
 * Send notification for critical and error events only
 */
export async function sendCriticalEventNotification(
  eventType: EventType,
  severity: EventSeverity,
  title: string,
  message: string,
  options: {
    metadata?: any;
    userEmail?: string;
    cpuUsage?: number;
    memoryUsage?: number;
    diskUsage?: number;
  } = {}
): Promise<boolean> {
  // Only send notifications for critical and error events
  if (severity !== 'CRITICAL' && severity !== 'ERROR') {
    return false;
  }

  return await sendDiscordNotification(eventType, severity, title, message, options);
}

/**
 * Send admin action notification
 */
export async function sendAdminActionNotification(
  action: string,
  adminEmail: string,
  details: string,  metadata?: any
): Promise<boolean> {
  const config = getEnvConfig();

  if (!config.DISCORD_WEBHOOK_URL) {
    return false;
  }

  try {
    const fields: DiscordEmbedField[] = [
      {
        name: '👤 Admin',
        value: adminEmail,
        inline: true
      },
      {
        name: '🔧 Action',
        value: action,
        inline: true
      },
      {
        name: '🌐 Environment',
        value: config.NODE_ENV === 'production' ? '🚀 Production' : '🧪 Development',
        inline: true
      }
    ];

    if (metadata && Object.keys(metadata).length > 0) {
      const metadataStr = Object.entries(metadata)
        .map(([key, value]) => `**${key}:** ${value}`)
        .join('\n');

      if (metadataStr.length <= 1024) {
        fields.push({
          name: '📋 Details',
          value: metadataStr,
          inline: false
        });
      }
    }

    const embed: DiscordEmbed = {
      title: '🛠️ Admin Action Performed',
      description: details,
      color: 0x9b59b6, // Purple for admin actions
      timestamp: new Date().toISOString(),
      fields,
      footer: {
        text: 'twink.forsale Admin Panel'
      },
      author: {
        name: 'Admin Actions',
        icon_url: 'https://cdn.discordapp.com/attachments/1234567890/1234567890/admin-icon.png'
      }
    };

    const payload: DiscordWebhookPayload = {
      embeds: [embed],
      username: 'twink.forsale Admin',
      avatar_url: 'https://cdn.discordapp.com/attachments/1234567890/1234567890/admin-avatar.png'
    };

    const response = await fetch(config.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Failed to send Discord admin notification:', response.status, response.statusText);
      return false;
    }

    console.log(`Discord admin notification sent: ${action}`);
    return true;
  } catch (error) {
    console.error('Error sending Discord admin notification:', error);
    return false;
  }
}
