import { customAlphabet } from 'nanoid'
import fs from 'fs'
import path from 'path'
import { getEnvConfig } from './env'
import { generateCuteShortCode } from './cute-words'
import { db } from './db'

// Generate short codes for URLs (URL-safe characters)
const generateRandomShortCode = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8)

// Generate deletion keys (longer, more secure)
const generateDeletionKey = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 32)

// Main shortcode generation function that supports both methods
export function generateShortCode(useCuteWords: boolean = false): string {
  if (useCuteWords) {
    return generateCuteShortCode();
  }
  return generateRandomShortCode();
}

// Generate a unique shortcode by checking database for collisions
export async function generateUniqueShortCode(useCuteWords: boolean = false, maxAttempts: number = 10): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const shortCode = generateShortCode(useCuteWords);
    
    // Check if this shortcode already exists in the database
    const existingUpload = await db.upload.findUnique({
      where: { shortCode },
      select: { id: true } // Only select id to minimize data transfer
    });
    
    if (!existingUpload) {
      return shortCode; // Found a unique shortcode
    }
    
    console.log(`Shortcode collision detected: ${shortCode}, attempting again (${attempt + 1}/${maxAttempts})`);
  }
  
  // If we still haven't found a unique shortcode after max attempts, 
  // fall back to a longer random string to virtually guarantee uniqueness
  console.warn(`Failed to generate unique shortcode after ${maxAttempts} attempts, using longer fallback`);
  const fallbackGenerator = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 16);
  return fallbackGenerator();
}

// Standalone functions for easier import
export { generateDeletionKey }

// Validate uploaded file
export function validateFile(file: File): { isValid: boolean; error?: string } {
  const config = getEnvConfig();
  const maxSize = Number(config.MAX_FILE_SIZE);
  const allowedTypes = config.ALLOWED_MIME_TYPES;

  // Check file size
  if (file.size > maxSize) {
    return { isValid: false, error: "File too large" };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: "File type not allowed" };
  }

  // Check filename length
  if (file.name.length > 255) {
    return { isValid: false, error: "Filename too long" };
  }

  return { isValid: true };
}

// Save file to storage (now requires authentication)
export async function saveFile(file: File, filename: string, userId: string): Promise<string> {
  const config = getEnvConfig();
  const baseUploadDir = config.UPLOAD_DIR;

  // Create user-specific directory (anonymous uploads no longer supported)
  const uploadDir = path.join(baseUploadDir, userId);

  // Ensure upload directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, filename);

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Write file
  fs.writeFileSync(filePath, buffer);

  return filePath;
}
