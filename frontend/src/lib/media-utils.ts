import sharp from 'sharp';
import path from 'path';

/**
 * Extract dimensions from image files (including GIFs)
 */
export async function extractImageDimensions(filePath: string): Promise<{ width: number; height: number } | null> {
  try {
    const metadata = await sharp(filePath).metadata();
    if (metadata.width && metadata.height) {
      return {
        width: metadata.width,
        height: metadata.height
      };
    }
  } catch (error) {
    console.error('Error extracting image dimensions:', error);
  }
  return null;
}

/**
 * Extract dimensions from video files (first frame)
 */
export async function extractVideoDimensions(filePath: string): Promise<{ width: number; height: number } | null> {
  try {
    // For videos, we can try to extract the first frame using Sharp
    // Sharp can handle some video formats, but this is limited
    // For now, we'll return a default size for videos
    // In a production app, you'd want to use ffmpeg for proper video dimension extraction
    
    // Check if it's a video file
    const ext = path.extname(filePath).toLowerCase();
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv', '.wmv'];
    
    if (videoExtensions.includes(ext)) {
      // For now, return common video dimensions
      // In the future, this could be enhanced with ffmpeg integration
      return {
        width: 1280,
        height: 720
      };
    }
  } catch (error) {
    console.error('Error extracting video dimensions:', error);
  }
  return null;
}

/**
 * Determine if a file should have dimensions extracted based on MIME type
 */
export function shouldExtractDimensions(mimeType: string): boolean {
  return mimeType.startsWith('image/') || mimeType.startsWith('video/');
}

/**
 * Extract dimensions from any supported media file
 */
export async function extractMediaDimensions(filePath: string, mimeType: string): Promise<{ width: number; height: number } | null> {
  if (!shouldExtractDimensions(mimeType)) {
    return null;
  }

  if (mimeType.startsWith('image/')) {
    return await extractImageDimensions(filePath);
  }

  if (mimeType.startsWith('video/')) {
    return await extractVideoDimensions(filePath);
  }

  return null;
}

/**
 * Extract dimensions from file buffer (for upload processing)
 */
export async function extractDimensionsFromBuffer(buffer: Buffer, mimeType: string): Promise<{ width: number; height: number } | null> {
  if (!shouldExtractDimensions(mimeType)) {
    return null;
  }

  if (mimeType.startsWith('image/')) {
    try {
      const metadata = await sharp(buffer).metadata();
      if (metadata.width && metadata.height) {
        return {
          width: metadata.width,
          height: metadata.height
        };
      }
    } catch (error) {
      console.error('Error extracting dimensions from buffer:', error);
    }
  }

  if (mimeType.startsWith('video/')) {
    // For videos, return default dimensions for now
    // This could be enhanced with ffmpeg in the future
    return {
      width: 1280,
      height: 720
    };
  }

  return null;
}
