export function formatBytes(bytes: number | bigint, decimals = 2) {
  // Convert BigInt to number for calculations
  const numBytes = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  
  if (numBytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(numBytes) / Math.log(k))

  return parseFloat((numBytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function formatDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

export function truncateString(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + '...' : str
}

export function parseStorageSize(value: string): bigint {
  const trimmed = value.trim().toUpperCase()
  const number = parseFloat(trimmed)

  if (trimmed.endsWith('GB')) {
    return BigInt(Math.floor(number * 1024 * 1024 * 1024))
  } else if (trimmed.endsWith('MB')) {
    return BigInt(Math.floor(number * 1024 * 1024))
  } else if (trimmed.endsWith('KB')) {
    return BigInt(Math.floor(number * 1024))
  } else {
    return BigInt(Math.floor(number)) // Assume bytes
  }
}