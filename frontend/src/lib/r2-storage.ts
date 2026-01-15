// R2 Storage abstraction layer
import { getEnvConfig } from './env';
import { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand,
  DeleteObjectsCommand, 
  HeadObjectCommand,
  ListObjectsV2Command
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string; // Custom domain or R2 public URL
}

interface UploadResult {
  key: string;
  url: string;
  publicUrl: string;
}

class R2Storage {
  private config: R2Config;
  private s3Client: S3Client;

  constructor() {
    const env = getEnvConfig();
    this.config = {
      accountId: env.R2_ACCOUNT_ID!,
      accessKeyId: env.R2_ACCESS_KEY_ID!,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
      bucketName: env.R2_BUCKET_NAME!,
      publicUrl: env.R2_PUBLIC_URL! // e.g., https://files.twink.forsale
    };

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${this.config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });
  }

  getS3Client() {
    return this.s3Client;
  }

  /**
   * Upload file to R2
   */
  async uploadFile(
    file: File, 
    key: string, 
    metadata?: Record<string, string>
  ): Promise<UploadResult> {
    const client = this.getS3Client();

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const command = new PutObjectCommand({
      Bucket: this.config.bucketName,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      ContentLength: file.size,
      Metadata: {
        'original-name': file.name,
        'upload-timestamp': new Date().toISOString(),
        ...metadata
      },
      // Set cache headers for better performance
      CacheControl: 'public, max-age=31536000, immutable'
    });

    await client.send(command);

    return {
      key,
      url: `https://${this.config.bucketName}.${this.config.accountId}.r2.cloudflarestorage.com/${key}`,
      publicUrl: `${this.config.publicUrl}/${key}`
    };
  }

  /**
   * Delete file from R2
   */
  async deleteFile(key: string): Promise<void> {
    const client = this.getS3Client();

    const command = new DeleteObjectCommand({
      Bucket: this.config.bucketName,
      Key: key,
    });

    await client.send(command);
  }

  /**
   * Delete multiple files from R2
   */
  async deleteFiles(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    const client = this.getS3Client();

    // R2 supports batch delete up to 1000 objects
    const chunks = [];
    for (let i = 0; i < keys.length; i += 1000) {
      chunks.push(keys.slice(i, i + 1000));
    }

    for (const chunk of chunks) {
      const command = new DeleteObjectsCommand({
        Bucket: this.config.bucketName,
        Delete: {
          Objects: chunk.map(key => ({ Key: key }))
        }
      });

      await client.send(command);
    }
  }

  /**
   * Generate presigned URL for direct uploads (future feature)
   */
  async generatePresignedUploadUrl(
    key: string, 
    contentType: string, 
    expiresIn: number = 3600
  ): Promise<string> {
    const client = this.getS3Client();

    const command = new PutObjectCommand({
      Bucket: this.config.bucketName,
      Key: key,
      ContentType: contentType,
    });

    return await getSignedUrl(client, command, { expiresIn });
  }

  /**
   * Get file info from R2
   */
  async getFileInfo(key: string) {
    const client = this.getS3Client();

    try {
      const command = new HeadObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
      });

      const response = await client.send(command);
      return {
        exists: true,
        size: response.ContentLength,
        contentType: response.ContentType,
        lastModified: response.LastModified,
        metadata: response.Metadata
      };
    } catch (error: any) {
      if (error.name === 'NoSuchKey' || error.name === 'NotFound') {
        return { exists: false };
      }
      throw error;
    }
  }

  /**
   * Check if a file exists in R2
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.config.bucketName,
        Key: key
      });
      
      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      console.error('Error checking file existence in R2:', error);
      throw error;
    }
  }

  /**
   * Generate the key path for a file (now requires userId)
   */
  generateFileKey(filename: string, userId: string): string {
    return `users/${userId}/${filename}`;
  }

  /**
   * Get the public URL for a file
   */
  getPublicUrl(key: string): string {
    return `${this.config.publicUrl}/${key}`;
  }

  /**
   * Get storage stats (requires bucket listing permissions)
   */
  async getStorageStats() {
    const client = this.getS3Client();

    try {
      let totalSize = 0;
      let totalFiles = 0;
      let isTruncated = true;
      let continuationToken: string | undefined;

      while (isTruncated) {
        const command = new ListObjectsV2Command({
          Bucket: this.config.bucketName,
          ContinuationToken: continuationToken,
          MaxKeys: 1000
        });

        const response = await client.send(command);
        
        if (response.Contents) {
          totalFiles += response.Contents.length;
          totalSize += response.Contents.reduce((sum: number, obj: any) => sum + (obj.Size || 0), 0);
        }

        isTruncated = response.IsTruncated || false;
        continuationToken = response.NextContinuationToken;
      }

      return {
        totalFiles,
        totalSize
      };
    } catch (error) {
      console.error('Error getting R2 storage stats:', error);
      return { totalFiles: 0, totalSize: 0 };
    }
  }
}

// Singleton instance
let r2Storage: R2Storage | null = null;

export function getR2Storage(): R2Storage {
  if (!r2Storage) {
    r2Storage = new R2Storage();
  }
  return r2Storage;
}

export type { UploadResult, R2Config };
