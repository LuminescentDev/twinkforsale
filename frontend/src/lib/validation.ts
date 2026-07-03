// Validation schemas and utilities
import { formatBytes } from './utils';

export interface UploadValidation {
  isValid: boolean
  errors: string[]
}

export const validateUpload = (file: File): UploadValidation => {
  const errors: string[] = []
  // Check file size
  const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB
  if (file.size > maxSize) {
    errors.push(`File size exceeds ${formatBytes(maxSize)} limit`)
  }

  // Check MIME type
  const allowedTypes = process.env.ALLOWED_MIME_TYPES?.split(',') || [
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'text/plain',
    'application/pdf'
  ]

  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`)
  }

  // Check filename
  if (!file.name || file.name.trim().length === 0) {
    errors.push('Filename is required')
  }

  if (file.name.length > 255) {
    errors.push('Filename is too long (max 255 characters)')
  }

  // Check for dangerous file extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.com', '.pif', '.js', '.vbs']
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
  if (dangerousExtensions.includes(extension)) {
    errors.push('File extension is not allowed for security reasons')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const sanitizeFilename = (filename: string): string => {
  // Remove or replace dangerous characters
  return filename
    .replace(/[<>:"/\\|?*]/g, '_') // Replace forbidden characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Trim underscores from start/end
    .toLowerCase()
}
