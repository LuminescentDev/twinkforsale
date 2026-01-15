// File serving utilities for both filesystem and R2
import { getEnvConfig } from './env';
import { getR2Storage } from './r2-storage';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { db } from './db';
import fs from 'fs';
import path from 'path';

export interface FileData {
  buffer: Buffer;
  contentType: string;
  filename: string;
  size: number;
}

export interface FileProvider {
  getFile(key: string): Promise<FileData | null>;
  fileExists(key: string): Promise<boolean>;
}

class FilesystemFileProvider implements FileProvider {
  async getFile(key: string): Promise<FileData | null> {
    const config = getEnvConfig();
    const baseUploadDir = config.UPLOAD_DIR;
    
    // Try different possible paths based on how the file was stored
    const possiblePaths = [
      path.join(baseUploadDir, key), // Direct path (new format)
      // Legacy format attempts
      path.join(baseUploadDir, 'anonymous', path.basename(key)),
    ];

    // Also try user-specific directories if we can extract userId from path
    const pathParts = key.split(path.sep);
    if (pathParts.length > 1) {
      // Format: users/userId/filename or userId/filename
      if (pathParts[0] === 'users' && pathParts.length === 3) {
        possiblePaths.push(path.join(baseUploadDir, pathParts[1], pathParts[2]));
      } else if (pathParts.length === 2) {
        possiblePaths.push(path.join(baseUploadDir, pathParts[0], pathParts[1]));
      }
    }

    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        try {
          const buffer = fs.readFileSync(filePath);
          const stats = fs.statSync(filePath);
          
          // Try to determine content type from extension
          const ext = path.extname(filePath).toLowerCase();
          let contentType = 'application/octet-stream';
          
          const mimeTypes: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.pdf': 'application/pdf',
            '.txt': 'text/plain',
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
            '.mov': 'video/quicktime'
          };
          
          if (mimeTypes[ext]) {
            contentType = mimeTypes[ext];
          }

          return {
            buffer,
            contentType,
            filename: path.basename(filePath),
            size: stats.size
          };
        } catch (error) {
          console.error('Error reading file:', error);
          continue;
        }
      }
    }

    return null;
  }

  async fileExists(key: string): Promise<boolean> {
    const config = getEnvConfig();
    const baseUploadDir = config.UPLOAD_DIR;
    
    const possiblePaths = [
      path.join(baseUploadDir, key),
      path.join(baseUploadDir, 'anonymous', path.basename(key)),
    ];

    const pathParts = key.split(path.sep);
    if (pathParts.length > 1) {
      if (pathParts[0] === 'users' && pathParts.length === 3) {
        possiblePaths.push(path.join(baseUploadDir, pathParts[1], pathParts[2]));
      } else if (pathParts.length === 2) {
        possiblePaths.push(path.join(baseUploadDir, pathParts[0], pathParts[1]));
      }
    }

    return possiblePaths.some(filePath => fs.existsSync(filePath));
  }
}

class R2FileProvider implements FileProvider {
  private r2: ReturnType<typeof getR2Storage>;

  constructor() {
    this.r2 = getR2Storage();
  }

  async getFile(key: string): Promise<FileData | null> {
    try {
      // Get file info first
      const info = await this.r2.getFileInfo(key);
      if (!info.exists) {
        return null;
      }

      // Get the actual file content
      const client = await (this.r2 as any).getS3Client();
      
      const command = new GetObjectCommand({
        Bucket: (this.r2 as any).config.bucketName,
        Key: key,
      });

      const response = await client.send(command);
      
      // Convert stream to buffer
      const chunks: Buffer[] = [];
      const stream = response.Body as any;
      
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      
      const buffer = Buffer.concat(chunks);

      return {
        buffer,
        contentType: info.contentType || 'application/octet-stream',
        filename: path.basename(key),
        size: info.size || buffer.length
      };
    } catch (error) {
      console.error('Error getting file from R2:', error);
      return null;
    }
  }

  async fileExists(key: string): Promise<boolean> {
    const info = await this.r2.getFileInfo(key);
    return info.exists;
  }
}

// Factory function to get the appropriate file provider
export function getFileProvider(): FileProvider {
  const config = getEnvConfig();
  
  if (config.USE_R2_STORAGE) {
    return new R2FileProvider();
  } else {
    return new FilesystemFileProvider();
  }
}

// Helper function to get file by short code (for backwards compatibility)
export async function getFileByShortCode(shortCode: string): Promise<FileData | null> {
  // We need to look up the file in the database first to get the storage key
  const upload = await db.upload.findUnique({
    where: { shortCode }
  });

  if (!upload) {
    return null;
  }

  const fileProvider = getFileProvider();
  return await fileProvider.getFile(upload.filename);
}
