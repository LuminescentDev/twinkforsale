/**
 * Normalizes an API URL by removing trailing slashes and ensuring /api prefix
 * @param rawUrl - Raw API URL from environment variable
 * @returns Normalized API URL
 * 
 * Examples:
 * - "http://localhost:5000" -> "http://localhost:5000"
 * - "http://localhost:5000/" -> "http://localhost:5000"
 * - "http://localhost:5000/api" -> "http://localhost:5000"
 * - "http://localhost:5000/api/" -> "http://localhost:5000"
 */
export function normalizeApiUrl(rawUrl: string): string {
  // Remove trailing slashes
  let url = rawUrl.replace(/\/+$/, '');
  
  // Remove /api suffix if present (we'll add it back when needed)
  url = url.replace(/\/api$/, '');
  
  return url;
}

/**
 * Gets the API base URL from environment with /api suffix
 * @param rawUrl - Raw API URL from environment variable
 * @returns API URL with /api suffix
 */
export function getApiBaseUrl(rawUrl: string): string {
  const normalized = normalizeApiUrl(rawUrl);
  return `${normalized}/api`;
}

/**
 * Gets the API URL without /api suffix (for auth redirects, etc.)
 * @param rawUrl - Raw API URL from environment variable
 * @returns API URL without /api suffix
 */
export function getApiUrl(rawUrl: string): string {
  return normalizeApiUrl(rawUrl);
}
