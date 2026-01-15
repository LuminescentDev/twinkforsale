// Server-only storage operations
// This module contains Node.js specific imports and should only be used on the server

import { getEnvConfig } from './env';
import { getR2Storage, UploadResult } from './r2-storage';
import fs from 'fs';
import path from 'path';

export interface StorageResult {
  success: boolean;
  key: string;
  url: string;
  publicUrl: string;
  error?: string;
}

export interface StorageProvider {
  uploadFile(file: File, key: string, userId: string): Promise<StorageResult>;
  deleteFile(key: string): Promise<void>;
  deleteFiles(keys: string[]): Promise<void>;
  generateFileKey(filename: string, userId: string): string;
  getPublicUrl(key: string): string;
  fileExists(key: string): Promise<boolean>;
}

class FilesystemStorage implements StorageProvider {
  async uploadFile(file: File, key: string, userId: string): Promise<StorageResult> {
    try {
      const config = getEnvConfig();
      const baseUploadDir = config.UPLOAD_DIR;

      // Now that API keys are required, we should always have a userId
      if (!userId) {
        throw new Error('User ID is required for file uploads');
      }

      const uploadDir = path.join(baseUploadDir, userId);

      // Ensure the upload directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, key);
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Write the file to disk
      fs.writeFileSync(filePath, buffer);

      const publicUrl = this.getPublicUrl(key);
      
      return {
        success: true,
        key,
        url: filePath,
        publicUrl
      };
    } catch (error) {
      console.error('Filesystem upload error:', error);
      return {
        success: false,
        key,
        url: '',
        publicUrl: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const config = getEnvConfig();
      const baseUploadDir = config.UPLOAD_DIR;
      
      // Try to find the file in both user and anonymous directories
      const possiblePaths = [
        path.join(baseUploadDir, 'anonymous', key),
        // Also check for user directories by scanning
      ];

      // Add user directory paths by extracting userId from key or scanning
      try {
        const userDirs = fs.readdirSync(baseUploadDir, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory() && dirent.name !== 'anonymous')
          .map(dirent => dirent.name);
        
        for (const userDir of userDirs) {
          possiblePaths.push(path.join(baseUploadDir, userDir, key));
        }
      } catch (error) {
        console.warn('Could not scan user directories:', error);
      }

      // Try to delete from each possible path
      for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted file: ${filePath}`);
          return;
        }
      }
      
      console.warn(`File not found for deletion: ${key}`);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  async deleteFiles(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.deleteFile(key);
    }
  }

  generateFileKey(filename: string, userId: string): string {
    // For filesystem, the key is just the filename
    return filename;
  }

  getPublicUrl(key: string): string {
    const config = getEnvConfig();
    const baseUrl = config.BASE_URL || 'http://localhost:5173';
    // The file will be served via the /f/[shortCode] route, not directly
    // So we return a placeholder URL - the actual serving is handled by the route
    return `${baseUrl}/uploads/${key}`;
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      const config = getEnvConfig();
      const baseUploadDir = config.UPLOAD_DIR;
      
      // Check in anonymous directory
      const anonymousPath = path.join(baseUploadDir, 'anonymous', key);
      if (fs.existsSync(anonymousPath)) {
        return true;
      }

      // Check in user directories
      try {
        const userDirs = fs.readdirSync(baseUploadDir, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory() && dirent.name !== 'anonymous')
          .map(dirent => dirent.name);
        
        for (const userDir of userDirs) {
          const userPath = path.join(baseUploadDir, userDir, key);
          if (fs.existsSync(userPath)) {
            return true;
          }
        }
      } catch (error) {
        console.warn('Could not scan user directories:', error);
      }

      return false;
    } catch (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
  }
}

class R2StorageAdapter implements StorageProvider {
  private r2 = getR2Storage();

  async uploadFile(file: File, key: string, userId: string): Promise<StorageResult> {
    try {
      // Now that API keys are required, we should always have a userId
      if (!userId) {
        throw new Error('User ID is required for file uploads');
      }

      // Generate proper key with user prefix for R2
      const r2Key = this.r2.generateFileKey(key, userId);
      const result: UploadResult = await this.r2.uploadFile(file, r2Key);
      return {
        success: true,
        key: result.key,
        url: result.url,
        publicUrl: result.publicUrl
      };
    } catch (error) {
      return {
        success: false,
        key,
        url: '',
        publicUrl: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async deleteFile(key: string): Promise<void> {
    await this.r2.deleteFile(key);
  }

  async deleteFiles(keys: string[]): Promise<void> {
    await this.r2.deleteFiles(keys);
  }

  generateFileKey(filename: string, userId: string): string {
    return this.r2.generateFileKey(filename, userId);
  }

  getPublicUrl(key: string): string {
    return this.r2.getPublicUrl(key);
  }

  async fileExists(key: string): Promise<boolean> {
    return this.r2.fileExists ? await this.r2.fileExists(key) : false;
  }
}

export function getStorageProvider(): StorageProvider {
  const config = getEnvConfig();
  
  if (config.USE_R2_STORAGE) {
    return new R2StorageAdapter();
  } else {
    return new FilesystemStorage();
  }
}

// Helper functions for server-side storage operations
export async function uploadFileToStorage(file: File, key: string, userId: string): Promise<StorageResult> {
  const storage = getStorageProvider();
  return await storage.uploadFile(file, key, userId);
}

export async function deleteFileFromStorage(key: string): Promise<void> {
  const storage = getStorageProvider();
  await storage.deleteFile(key);
}

export async function checkFileExists(key: string): Promise<boolean> {
  const storage = getStorageProvider();
  return await storage.fileExists(key);
}
