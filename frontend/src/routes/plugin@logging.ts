/**
 * Logging Plugin - Runs before all other plugins
 * Automatically logs all HTTP requests
 */

import type { RequestHandler } from "@builder.io/qwik-city";
import logger from "~/lib/logger";

export const onRequest: RequestHandler = async ({ request, url, next, sharedMap }) => {
  const startTime = Date.now();
  const method = request.method;
  const path = url.pathname;

  // Skip logging for static assets and health checks
  if (
    path.startsWith('/_qwik') || 
    path.startsWith('/build') || 
    path.startsWith('/assets') ||
    path === '/health'
  ) {
    return next();
  }

  // Log the incoming request
  logger.debug(`→ ${method} ${path}`, {
    method,
    path,
    query: url.search,
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
  });

  let statusCode: number | undefined;
  let error: Error | undefined;

  try {
    // Continue to the next handler
    const response = await next();
    
    // Try to get status code from response if it's a Response object
    if (response !== undefined && typeof response === 'object' && 'status' in response) {
      statusCode = (response as Response).status;
    }
    
    return response;
  } catch (err) {
    // Capture error
    error = err instanceof Error ? err : new Error(String(err));
    statusCode = 500;
    throw err;
  } finally {
    // Calculate request duration
    const duration = Date.now() - startTime;

    // Get user info if available (set by auth plugin)
    const user = sharedMap.get('user');
    const userId = user?.id;
    const userEmail = user?.email;

    // Determine log level based on status code
    const level = statusCode ? (
      statusCode >= 500 ? 'error' : 
      statusCode >= 400 ? 'warn' : 
      'info'
    ) : 'info';

    // Log the completed request
    logger.log(level, `← ${method} ${path} ${statusCode || '---'} (${duration}ms)`, {
      method,
      path,
      statusCode,
      duration,
      userId,
      userEmail,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : undefined,
    });
  }
};
