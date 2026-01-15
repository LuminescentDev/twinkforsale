// Client-safe storage interface
// This file contains only type definitions and utilities that can be used on the client side

export interface StorageResult {
  success: boolean;
  key: string;
  url: string;
  publicUrl: string;
  error?: string;
}

export interface ClientStorageInfo {
  useR2Storage: boolean;
  maxFileSize: number;
  allowedMimeTypes: string[];
}

// This function can be used on the client side to get storage configuration
export function getClientStorageInfo(): ClientStorageInfo {
  // Note: In a real implementation, this would come from a server endpoint
  // or be passed down from a server component. For now, we'll use environment
  // variables that are safe to expose to the client.
  
  return {
    useR2Storage: typeof process !== 'undefined' && process.env?.USE_R2_STORAGE === 'true',
    maxFileSize: 10485760, // 10MB default
    allowedMimeTypes: [
      'image/png',
      'image/jpeg', 
      'image/gif',
      'image/webp',
      'text/plain',
      'application/pdf'
    ]
  };
}
