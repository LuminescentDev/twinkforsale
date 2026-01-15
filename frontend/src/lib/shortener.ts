import { customAlphabet } from 'nanoid'
import { generateCuteShortCode } from './cute-words'
import { db } from './db'

// Reuse the same alphabet and length as uploads for consistency
const generateRandomShortCode = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8)

export function generateShortCode(useCuteWords: boolean = false): string {
  if (useCuteWords) return generateCuteShortCode()
  return generateRandomShortCode()
}

// Ensure code is unique within ShortLink table
export async function generateUniqueLinkCode(useCuteWords: boolean = false, maxAttempts: number = 10): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateShortCode(useCuteWords)
    // @ts-ignore - ShortLink model may not be in generated types until prisma generate runs
    const existing = await (db as any).shortLink.findUnique({ where: { code }, select: { id: true } })
    if (!existing) return code
  }
  // Fallback to longer code if collisions persist
  const fallback = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 16)
  return fallback()
}

export function isValidHttpUrl(str: string): boolean {
  try {
    const u = new URL(str)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}
