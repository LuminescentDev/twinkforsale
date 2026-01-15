/**
 * Bio service types and client-safe utilities
 * 
 * Server-side database operations are in bio.server.ts
 */

export interface BioLinkData {
  id?: string;
  title: string;
  url: string;
  icon?: string;
  order: number;
  isActive: boolean;
}

export interface BioPageData {
  username: string;
  displayName?: string;
  description?: string;
  profileImage?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  customCss?: string;
  spotifyTrack?: string;
  isPublic: boolean;
  views: number;
  links: BioLinkData[];
  gradientConfig?: string;
  particleConfig?: string;
  discordUserId?: string;
  showDiscord?: boolean;
  discordConfig?: string;
}

/**
 * Validate username format (client-safe)
 */
export function validateBioUsernameFormat(username: string, maxLength: number = 20): { isValid: boolean; error?: string } {
  // Check length
  if (username.length < 3) {
    return { isValid: false, error: "Username must be at least 3 characters long" };
  }
  
  if (username.length > maxLength) {
    return { isValid: false, error: `Username must be ${maxLength} characters or less` };
  }

  // Check format - only alphanumeric, underscore, and hyphen
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    return { isValid: false, error: "Username can only contain letters, numbers, underscores, and hyphens" };
  }

  // Check for reserved usernames
  const reservedUsernames = [
    'admin', 'api', 'www', 'mail', 'ftp', 'root', 'test', 'demo', 'user',
    'support', 'help', 'about', 'contact', 'dashboard', 'settings', 'profile',
    'login', 'logout', 'register', 'signup', 'signin', 'auth', 'oauth',
    'uploads', 'files', 'cdn', 'static', 'assets', 'public', 'private',
    'terms', 'privacy', 'legal', 'dmca', 'abuse', 'security', 'status'
  ];

  if (reservedUsernames.includes(username.toLowerCase())) {
    return { isValid: false, error: "This username is reserved" };
  }

  return { isValid: true };
}
