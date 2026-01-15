// Icon mappings for bio links
export const PREDEFINED_ICONS = {
  // Social Media
  'github': 'github',
  'instagram': 'instagram', 
  'tiktok': 'tiktok',
  'x-twitter': 'x-twitter',
  'twitter': 'x-twitter', // Alias
  'bluesky': 'bluesky',
  'youtube': 'youtube',
  'spotify': 'spotify',
  
  // Common aliases
  'ig': 'instagram',
  'yt': 'youtube',
  'git': 'github',
  'x': 'x-twitter',
} as const;

export type PredefinedIconName = keyof typeof PREDEFINED_ICONS;

export const COMMON_EMOJIS = [
  '🔗', '🌐', '📧', '💼', '🎨', '📷', '🎵', '🎬', '🎮', '💻',
  '📱', '📺', '🎭', '🎨', '✨', '🔥', '💎', '👑', '🎯', '🚀',
  '💫', '🌟', '⭐', '💖', '💕', '💜', '🖤', '🤍', '❤️', '💙',
  '💚', '💛', '🧡', '💗', '💘', '💝', '💟', '❣️', '💌', '💐',
  '🌸', '🌺', '🌻', '🌷', '🌹', '🌿', '🍀', '🌱', '🌳', '🎄',
  '📚', '📖', '✏️', '📝', '📋', '📄', '📃', '📑', '🗂️', '📁',
  '🏠', '🏢', '🏪', '🏬', '🏭', '🏗️', '🏛️', '⛪', '🕌', '🏰',
  '🎪', '🎨', '🖼️', '🎭', '🎬', '📹', '📸', '📷', '📺', '📻',
] as const;

export function isEmojiIcon(icon: string): boolean {
  // Simple emoji detection - check if it's not a predefined icon name
  return !Object.keys(PREDEFINED_ICONS).includes(icon.toLowerCase()) && 
         icon.length <= 4 && // Most emojis are 1-4 characters
         /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(icon);
}

export function getPredefinedIconPath(iconName: string): string | null {
  const normalizedName = iconName.toLowerCase();
  const mappedIcon = PREDEFINED_ICONS[normalizedName as PredefinedIconName];
  return mappedIcon ? `/icons/${mappedIcon}.svg` : null;
}
