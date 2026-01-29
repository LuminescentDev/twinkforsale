/**
 * Winston Logger with Loki Transport for Frontend
 * 
 * This logger sends logs to Grafana Loki for centralized logging.
 * Compatible with Qwik SSR - only runs on the server side.
 */

import winston from 'winston';
import LokiTransport from 'winston-loki';

// Environment configuration
const isProduction = process.env.NODE_ENV === 'production';
const lokiUrl = process.env.LOKI_URL || 'http://localhost:3100';
const environment = process.env.NODE_ENV || 'development';
const appName = 'twinkforsale-frontend';

// Custom format for better readability
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format with colors for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      // Remove timestamp and level from meta to avoid duplication
      const { timestamp: _, level: __, ...cleanMeta } = meta;
      if (Object.keys(cleanMeta).length > 0) {
        metaStr = '\n' + JSON.stringify(cleanMeta, null, 2);
      }
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Create transports array
const transports: winston.transport[] = [];

// Always add console transport
transports.push(
  new winston.transports.Console({
    format: consoleFormat,
  })
);

// Add Loki transport if URL is configured
if (lokiUrl && lokiUrl !== 'disabled') {
  transports.push(
    new LokiTransport({
      host: lokiUrl,
      labels: {
        app: appName,
        env: environment,
        service: 'frontend',
      },
      json: true,
      format: customFormat,
      replaceTimestamp: true,
      onConnectionError: (err) => {
        console.error('Loki connection error:', err);
      },
      // Batch settings for performance
      batching: true,
      interval: 5, // Send logs every 5 seconds
    })
  );
}

// Create the logger instance
const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: customFormat,
  defaultMeta: {
    service: appName,
    environment,
  },
  transports,
  // Don't exit on uncaught exceptions
  exitOnError: false,
});

// Add stream interface for other logging libraries
export const loggerStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

/**
 * Helper to log HTTP requests
 */
export function logRequest(
  method: string,
  path: string,
  statusCode: number,
  duration?: number,
  metadata?: Record<string, any>
) {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
  
  logger.log(level, `${method} ${path} ${statusCode}`, {
    method,
    path,
    statusCode,
    duration,
    ...metadata,
  });
}

/**
 * Helper to log errors with context
 */
export function logError(
  error: Error | unknown,
  context?: string,
  metadata?: Record<string, any>
) {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  
  logger.error(context || 'Unhandled error', {
    error: {
      message: errorObj.message,
      stack: errorObj.stack,
      name: errorObj.name,
    },
    ...metadata,
  });
}

/**
 * Helper to log user actions
 */
export function logUserAction(
  userId: string | undefined,
  action: string,
  metadata?: Record<string, any>
) {
  logger.info(`User action: ${action}`, {
    userId,
    action,
    ...metadata,
  });
}

/**
 * Helper to log API calls
 */
export function logApiCall(
  endpoint: string,
  method: string,
  statusCode?: number,
  duration?: number,
  metadata?: Record<string, any>
) {
  logger.info(`API call: ${method} ${endpoint}`, {
    endpoint,
    method,
    statusCode,
    duration,
    ...metadata,
  });
}

export default logger;
