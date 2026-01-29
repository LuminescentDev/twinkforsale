/**
 * Logging middleware for Qwik City
 * Automatically logs all HTTP requests with timing information
 */

import type { RequestHandler } from '@builder.io/qwik-city';
import logger, { logRequest } from './logger';

export const loggingMiddleware: RequestHandler = async ({ request, next, url, sharedMap }) => {
  const startTime = Date.now();
  const method = request.method;
  const path = url.pathname;

  // Get user info if available
  const user = sharedMap.get('user');
  const userId = user?.id;

  // Log the incoming request
  logger.debug(`Incoming request: ${method} ${path}`, {
    method,
    path,
    userId,
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
  });

  try {
    // Continue to the next handler
    await next();
  } catch (error) {
    // Log errors that occur during request handling
    const duration = Date.now() - startTime;
    logger.error('Request handler error', {
      method,
      path,
      userId,
      duration,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : String(error),
    });
    throw error;
  }

  // Calculate request duration
  const duration = Date.now() - startTime;

  // Log the completed request
  // Note: We can't get the status code here in Qwik middleware
  // Status code logging should be done in individual route handlers if needed
  logger.debug(`Completed request: ${method} ${path}`, {
    method,
    path,
    userId,
    duration,
  });
};
