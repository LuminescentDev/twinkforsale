// Domain utilities for custom domain support

/**
 * Check if a domain is a valid subdomain of twink.forsale
 */
export function isValidTwinkSubdomain(domain: string): boolean {
  return domain.endsWith('.twink.forsale') && domain !== 'twink.forsale';
}

/**
 * Check if a domain is valid format (basic validation)
 */
export function isValidDomain(domain: string): boolean {
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;
  return domainRegex.test(domain) && domain.length <= 253;
}

/**
 * Check if a subdomain is valid for a given domain
 */
export function isValidSubdomain(subdomain: string, baseDomain: string): boolean {
  if (!subdomain || !baseDomain) return false;
  
  // Subdomain should be alphanumeric with hyphens, but not start/end with hyphen
  const subdomainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
  if (!subdomainRegex.test(subdomain)) return false;
  
  // Subdomain should be reasonable length
  if (subdomain.length < 1 || subdomain.length > 63) return false;
  
  // Check if the resulting domain would be valid
  const fullDomain = `${subdomain}.${baseDomain}`;
  return isValidDomain(fullDomain);
}

/**
 * Generate a URL with custom subdomain
 */
export function generateSubdomainUrl(subdomain: string, baseDomain: string, path: string = ''): string {
  if (!subdomain || !baseDomain) {
    return `https://${baseDomain}${path}`;
  }
  
  return `https://${subdomain}.${baseDomain}${path}`;
}

/**
 * Determine the appropriate upload domain based on request and user preferences
 */
export function determineUploadDomain(
  requestHost: string | null,
  baseUrl: string,
  userCustomDomain: string | null
): string {
  const baseDomain = new URL(baseUrl).host;

  // If request came from a custom domain, validate and use it
  if (requestHost && requestHost !== baseDomain) {
    // Allow *.twink.forsale subdomains
    if (isValidTwinkSubdomain(requestHost)) {
      return `https://${requestHost}`;
    }

    // Allow user's custom domain
    if (userCustomDomain && requestHost === userCustomDomain) {
      return `https://${requestHost}`;
    }
  }

  // Use user's preferred custom domain if no specific subdomain was used
  if (userCustomDomain && (!requestHost || requestHost === baseDomain)) {
    return `https://${userCustomDomain}`;
  }

  // Default to base URL
  return baseUrl;
}

/**
 * Generate nginx configuration for a subdomain
 */
export function generateNginxSubdomainConfig(subdomain: string): string {
  return `# Configuration for ${subdomain}.twink.forsale
server {
    listen 80;
    listen [::]:80;
    server_name ${subdomain}.twink.forsale;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${subdomain}.twink.forsale;

    # SSL configuration (use your existing certificates)
    ssl_certificate /path/to/your/fullchain.pem;
    ssl_certificate_key /path/to/your/privkey.pem;
    
    # Proxy to your Qwik application
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
    }
}`;
}

/**
 * Get suggested subdomain names for users
 */
export function getSuggestedSubdomains(): string[] {
  return [
    'files', 'cdn', 'static', 'assets', 'media', 'uploads',
    'cute', 'kawaii', 'soft', 'pink', 'uwu', 'nya',
    'femboy', 'twink', 'boi', 'princess', 'angel'
  ];
}
