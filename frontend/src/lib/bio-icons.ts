/**
 * Icon catalogue for bio links.
 *
 * Brand marks are shipped as single-colour SVGs in `public/icons/<id>.svg`
 * (Simple Icons, CC0) and rendered as CSS masks so they inherit the page's
 * text colour. Glyphs are Lucide components resolved in `<BioLinkIcon>`.
 * Anything else a user types is treated as an emoji.
 */

export type BioIconCategory =
  | "social"
  | "chat"
  | "video"
  | "music"
  | "gaming"
  | "creative"
  | "dev"
  | "support"
  | "writing"
  | "profiles"
  | "generic";

export const BIO_ICON_CATEGORIES: { id: BioIconCategory; label: string }[] = [
  { id: "social", label: "Social" },
  { id: "chat", label: "Chat" },
  { id: "video", label: "Video" },
  { id: "music", label: "Music" },
  { id: "gaming", label: "Gaming" },
  { id: "creative", label: "Creative" },
  { id: "dev", label: "Dev" },
  { id: "support", label: "Support" },
  { id: "writing", label: "Writing" },
  { id: "profiles", label: "Profiles" },
  { id: "generic", label: "Generic" },
];

export interface BioIconDef {
  /** Value persisted on the bio link. */
  id: string;
  label: string;
  category: BioIconCategory;
  /** `brand` loads `/icons/<id>.svg`; `glyph` maps to a Lucide component. */
  kind: "brand" | "glyph";
  /** Official brand colour, used to tint the icon inside the picker. */
  color?: string;
  /** Extra search terms on top of id and label. */
  keywords?: string[];
  /** Hostnames (suffix match) used to suggest this icon from a link URL. */
  hosts?: string[];
}

export const BIO_ICONS: BioIconDef[] = [
  // Social
  { id: "x-twitter", label: "X", category: "social", kind: "brand", color: "#000000", keywords: ["twitter", "tweet"], hosts: ["x.com", "twitter.com"] },
  { id: "bluesky", label: "Bluesky", category: "social", kind: "brand", color: "#1185FE", keywords: ["bsky"], hosts: ["bsky.app"] },
  { id: "mastodon", label: "Mastodon", category: "social", kind: "brand", color: "#6364FF", keywords: ["fediverse"], hosts: ["mastodon.social", "mstdn.social"] },
  { id: "threads", label: "Threads", category: "social", kind: "brand", color: "#000000", hosts: ["threads.net", "threads.com"] },
  { id: "instagram", label: "Instagram", category: "social", kind: "brand", color: "#FF0069", keywords: ["ig", "insta"], hosts: ["instagram.com"] },
  { id: "tiktok", label: "TikTok", category: "social", kind: "brand", color: "#000000", hosts: ["tiktok.com"] },
  { id: "facebook", label: "Facebook", category: "social", kind: "brand", color: "#0866FF", keywords: ["fb", "meta"], hosts: ["facebook.com", "fb.com"] },
  { id: "snapchat", label: "Snapchat", category: "social", kind: "brand", color: "#FFFC00", keywords: ["snap"], hosts: ["snapchat.com"] },
  { id: "reddit", label: "Reddit", category: "social", kind: "brand", color: "#FF4500", hosts: ["reddit.com"] },
  { id: "tumblr", label: "Tumblr", category: "social", kind: "brand", color: "#36465D", hosts: ["tumblr.com"] },
  { id: "pinterest", label: "Pinterest", category: "social", kind: "brand", color: "#BD081C", hosts: ["pinterest.com"] },
  { id: "pixelfed", label: "Pixelfed", category: "social", kind: "brand", color: "#6366F1", keywords: ["fediverse"], hosts: ["pixelfed.social"] },
  { id: "linktree", label: "Linktree", category: "social", kind: "brand", color: "#43E55E", hosts: ["linktr.ee"] },
  { id: "carrd", label: "Carrd", category: "social", kind: "brand", color: "#596CAF", hosts: ["carrd.co"] },

  // Chat
  { id: "discord", label: "Discord", category: "chat", kind: "brand", color: "#5865F2", hosts: ["discord.gg", "discord.com", "discordapp.com"] },
  { id: "telegram", label: "Telegram", category: "chat", kind: "brand", color: "#26A5E4", hosts: ["t.me", "telegram.me"] },
  { id: "whatsapp", label: "WhatsApp", category: "chat", kind: "brand", color: "#25D366", hosts: ["wa.me", "whatsapp.com"] },
  { id: "signal", label: "Signal", category: "chat", kind: "brand", color: "#3B45FD", hosts: ["signal.me", "signal.org"] },
  { id: "matrix", label: "Matrix", category: "chat", kind: "brand", color: "#000000", hosts: ["matrix.to"] },
  { id: "revolt", label: "Revolt", category: "chat", kind: "brand", color: "#FF4655", hosts: ["revolt.chat", "rvlt.gg"] },
  { id: "guilded", label: "Guilded", category: "chat", kind: "brand", color: "#F5C400", hosts: ["guilded.gg"] },

  // Video & streaming
  { id: "twitch", label: "Twitch", category: "video", kind: "brand", color: "#9146FF", keywords: ["stream", "live"], hosts: ["twitch.tv"] },
  { id: "kick", label: "Kick", category: "video", kind: "brand", color: "#53FC19", keywords: ["stream", "live"], hosts: ["kick.com"] },
  { id: "youtube", label: "YouTube", category: "video", kind: "brand", color: "#FF0000", keywords: ["yt", "video"], hosts: ["youtube.com", "youtu.be"] },
  { id: "rumble", label: "Rumble", category: "video", kind: "brand", color: "#85C742", hosts: ["rumble.com"] },
  { id: "vimeo", label: "Vimeo", category: "video", kind: "brand", color: "#1AB7EA", hosts: ["vimeo.com"] },

  // Music
  { id: "spotify", label: "Spotify", category: "music", kind: "brand", color: "#1ED760", hosts: ["spotify.com", "open.spotify.com"] },
  { id: "applemusic", label: "Apple Music", category: "music", kind: "brand", color: "#FA243C", hosts: ["music.apple.com"] },
  { id: "soundcloud", label: "SoundCloud", category: "music", kind: "brand", color: "#FF5500", hosts: ["soundcloud.com"] },
  { id: "youtubemusic", label: "YouTube Music", category: "music", kind: "brand", color: "#FF0000", hosts: ["music.youtube.com"] },
  { id: "bandcamp", label: "Bandcamp", category: "music", kind: "brand", color: "#408294", hosts: ["bandcamp.com"] },
  { id: "lastfm", label: "Last.fm", category: "music", kind: "brand", color: "#D51007", keywords: ["scrobble"], hosts: ["last.fm"] },
  { id: "deezer", label: "Deezer", category: "music", kind: "brand", color: "#A238FF", hosts: ["deezer.com"] },
  { id: "tidal", label: "TIDAL", category: "music", kind: "brand", color: "#000000", hosts: ["tidal.com"] },
  { id: "mixcloud", label: "Mixcloud", category: "music", kind: "brand", color: "#5000FF", hosts: ["mixcloud.com"] },

  // Gaming
  { id: "steam", label: "Steam", category: "gaming", kind: "brand", color: "#000000", hosts: ["steamcommunity.com", "store.steampowered.com"] },
  { id: "roblox", label: "Roblox", category: "gaming", kind: "brand", color: "#000000", hosts: ["roblox.com"] },
  { id: "playstation", label: "PlayStation", category: "gaming", kind: "brand", color: "#0070D1", keywords: ["psn"], hosts: ["playstation.com"] },
  { id: "epicgames", label: "Epic Games", category: "gaming", kind: "brand", color: "#313131", hosts: ["epicgames.com"] },
  { id: "itchio", label: "itch.io", category: "gaming", kind: "brand", color: "#FA5C5C", hosts: ["itch.io"] },
  { id: "osu", label: "osu!", category: "gaming", kind: "brand", color: "#FF66AA", hosts: ["osu.ppy.sh"] },
  { id: "vrchat", label: "VRChat", category: "gaming", kind: "brand", color: "#000000", keywords: ["vr"], hosts: ["vrchat.com"] },
  { id: "gamejolt", label: "Game Jolt", category: "gaming", kind: "brand", color: "#CCFF00", hosts: ["gamejolt.com"] },
  { id: "curseforge", label: "CurseForge", category: "gaming", kind: "brand", color: "#F16436", keywords: ["minecraft", "mods"], hosts: ["curseforge.com"] },
  { id: "chess", label: "Chess.com", category: "gaming", kind: "brand", color: "#81B64C", hosts: ["chess.com"] },

  // Creative
  { id: "artstation", label: "ArtStation", category: "creative", kind: "brand", color: "#13AFF0", keywords: ["art"], hosts: ["artstation.com"] },
  { id: "deviantart", label: "DeviantArt", category: "creative", kind: "brand", color: "#05CC47", keywords: ["art"], hosts: ["deviantart.com"] },
  { id: "furaffinity", label: "Fur Affinity", category: "creative", kind: "brand", color: "#36566F", keywords: ["fa", "furry"], hosts: ["furaffinity.net"] },
  { id: "pixiv", label: "pixiv", category: "creative", kind: "brand", color: "#0096FA", keywords: ["art"], hosts: ["pixiv.net"] },
  { id: "newgrounds", label: "Newgrounds", category: "creative", kind: "brand", color: "#FDA238", hosts: ["newgrounds.com"] },
  { id: "dribbble", label: "Dribbble", category: "creative", kind: "brand", color: "#EA4C89", hosts: ["dribbble.com"] },
  { id: "behance", label: "Behance", category: "creative", kind: "brand", color: "#1769FF", hosts: ["behance.net"] },
  { id: "figma", label: "Figma", category: "creative", kind: "brand", color: "#F24E1E", hosts: ["figma.com"] },
  { id: "flickr", label: "Flickr", category: "creative", kind: "brand", color: "#0063DC", keywords: ["photos"], hosts: ["flickr.com"] },
  { id: "unsplash", label: "Unsplash", category: "creative", kind: "brand", color: "#000000", keywords: ["photos"], hosts: ["unsplash.com"] },

  // Dev
  { id: "github", label: "GitHub", category: "dev", kind: "brand", color: "#181717", keywords: ["git", "code"], hosts: ["github.com"] },
  { id: "gitlab", label: "GitLab", category: "dev", kind: "brand", color: "#FC6D26", keywords: ["git", "code"], hosts: ["gitlab.com"] },
  { id: "codeberg", label: "Codeberg", category: "dev", kind: "brand", color: "#2185D0", keywords: ["git"], hosts: ["codeberg.org"] },
  { id: "stackoverflow", label: "Stack Overflow", category: "dev", kind: "brand", color: "#F58025", hosts: ["stackoverflow.com"] },
  { id: "devto", label: "dev.to", category: "dev", kind: "brand", color: "#0A0A0A", hosts: ["dev.to"] },
  { id: "npm", label: "npm", category: "dev", kind: "brand", color: "#CB3837", hosts: ["npmjs.com"] },
  { id: "replit", label: "Replit", category: "dev", kind: "brand", color: "#F26207", hosts: ["replit.com"] },

  // Support & shops
  { id: "kofi", label: "Ko-fi", category: "support", kind: "brand", color: "#FF6433", keywords: ["tip", "donate"], hosts: ["ko-fi.com"] },
  { id: "patreon", label: "Patreon", category: "support", kind: "brand", color: "#000000", keywords: ["subscribe"], hosts: ["patreon.com"] },
  { id: "buymeacoffee", label: "Buy Me a Coffee", category: "support", kind: "brand", color: "#FFDD00", keywords: ["tip", "donate"], hosts: ["buymeacoffee.com"] },
  { id: "onlyfans", label: "OnlyFans", category: "support", kind: "brand", color: "#00AFF0", keywords: ["of"], hosts: ["onlyfans.com"] },
  { id: "gumroad", label: "Gumroad", category: "support", kind: "brand", color: "#FF90E8", keywords: ["shop", "store"], hosts: ["gumroad.com"] },
  { id: "cashapp", label: "Cash App", category: "support", kind: "brand", color: "#00C244", keywords: ["money", "tip"], hosts: ["cash.app"] },
  { id: "paypal", label: "PayPal", category: "support", kind: "brand", color: "#002991", keywords: ["money", "tip"], hosts: ["paypal.com", "paypal.me"] },
  { id: "venmo", label: "Venmo", category: "support", kind: "brand", color: "#008CFF", keywords: ["money", "tip"], hosts: ["venmo.com"] },
  { id: "liberapay", label: "Liberapay", category: "support", kind: "brand", color: "#F6C915", keywords: ["donate"], hosts: ["liberapay.com"] },
  { id: "etsy", label: "Etsy", category: "support", kind: "brand", color: "#F16521", keywords: ["shop", "store"], hosts: ["etsy.com"] },
  { id: "fiverr", label: "Fiverr", category: "support", kind: "brand", color: "#1DBF73", keywords: ["commissions"], hosts: ["fiverr.com"] },

  // Writing
  { id: "medium", label: "Medium", category: "writing", kind: "brand", color: "#000000", keywords: ["blog"], hosts: ["medium.com"] },
  { id: "substack", label: "Substack", category: "writing", kind: "brand", color: "#FF6719", keywords: ["newsletter"], hosts: ["substack.com"] },
  { id: "wordpress", label: "WordPress", category: "writing", kind: "brand", color: "#21759B", keywords: ["blog"], hosts: ["wordpress.com"] },
  { id: "notion", label: "Notion", category: "writing", kind: "brand", color: "#000000", hosts: ["notion.so", "notion.site"] },

  // Profiles & lists
  { id: "anilist", label: "AniList", category: "profiles", kind: "brand", color: "#02A9FF", keywords: ["anime"], hosts: ["anilist.co"] },
  { id: "myanimelist", label: "MyAnimeList", category: "profiles", kind: "brand", color: "#2E51A2", keywords: ["anime", "mal"], hosts: ["myanimelist.net"] },
  { id: "letterboxd", label: "Letterboxd", category: "profiles", kind: "brand", color: "#202830", keywords: ["films"], hosts: ["letterboxd.com"] },
  { id: "trakt", label: "Trakt", category: "profiles", kind: "brand", color: "#9F42C6", keywords: ["tv"], hosts: ["trakt.tv"] },
  { id: "imdb", label: "IMDb", category: "profiles", kind: "brand", color: "#F5C518", keywords: ["films"], hosts: ["imdb.com"] },
  { id: "goodreads", label: "Goodreads", category: "profiles", kind: "brand", color: "#1E1914", keywords: ["books"], hosts: ["goodreads.com"] },
  { id: "strava", label: "Strava", category: "profiles", kind: "brand", color: "#FC4C02", keywords: ["running"], hosts: ["strava.com"] },
  { id: "duolingo", label: "Duolingo", category: "profiles", kind: "brand", color: "#58CC02", hosts: ["duolingo.com"] },

  // Generic glyphs
  { id: "website", label: "Website", category: "generic", kind: "glyph", keywords: ["globe", "home", "site"] },
  { id: "email", label: "Email", category: "generic", kind: "glyph", keywords: ["mail", "contact"] },
  { id: "link", label: "Link", category: "generic", kind: "glyph", keywords: ["url"] },
  { id: "rss", label: "RSS", category: "generic", kind: "glyph", keywords: ["feed"] },
  { id: "shop", label: "Shop", category: "generic", kind: "glyph", keywords: ["store", "buy", "merch"] },
  { id: "money", label: "Tip Jar", category: "generic", kind: "glyph", keywords: ["donate", "dollar", "support"] },
  { id: "gift", label: "Wishlist", category: "generic", kind: "glyph", keywords: ["present"] },
  { id: "heart", label: "Heart", category: "generic", kind: "glyph", keywords: ["love", "fav"] },
  { id: "star", label: "Star", category: "generic", kind: "glyph", keywords: ["favourite"] },
  { id: "chat", label: "Chat", category: "generic", kind: "glyph", keywords: ["message", "dm"] },
  { id: "phone", label: "Phone", category: "generic", kind: "glyph", keywords: ["call"] },
  { id: "location", label: "Location", category: "generic", kind: "glyph", keywords: ["map", "place"] },
  { id: "calendar", label: "Calendar", category: "generic", kind: "glyph", keywords: ["booking", "schedule"] },
  { id: "document", label: "Document", category: "generic", kind: "glyph", keywords: ["resume", "cv", "file"] },
  { id: "photo", label: "Photos", category: "generic", kind: "glyph", keywords: ["camera", "gallery"] },
  { id: "video", label: "Video", category: "generic", kind: "glyph", keywords: ["film"] },
  { id: "music", label: "Music", category: "generic", kind: "glyph", keywords: ["song", "audio"] },
  { id: "game", label: "Games", category: "generic", kind: "glyph", keywords: ["gaming", "controller"] },
  { id: "code", label: "Code", category: "generic", kind: "glyph", keywords: ["dev", "projects"] },
  { id: "work", label: "Work", category: "generic", kind: "glyph", keywords: ["portfolio", "business", "hire"] },
  { id: "book", label: "Book", category: "generic", kind: "glyph", keywords: ["read", "blog"] },
  { id: "download", label: "Download", category: "generic", kind: "glyph", keywords: ["file", "get"] },
];

const ICONS_BY_ID = new Map(BIO_ICONS.map((icon) => [icon.id, icon]));

/** Shorthands kept so icons saved by earlier versions still resolve. */
export const ICON_ALIASES: Record<string, string> = {
  twitter: "x-twitter",
  x: "x-twitter",
  ig: "instagram",
  yt: "youtube",
  git: "github",
  globe: "website",
  mail: "email",
  "ko-fi": "kofi",
  "itch-io": "itchio",
  "x-twitter": "x-twitter",
};

const HOSTS_TO_ICON = new Map<string, string>(
  BIO_ICONS.flatMap((icon) => (icon.hosts ?? []).map((host) => [host, icon.id])),
);

/** Maps a stored icon value onto a catalogue id, or null if it isn't one. */
export function resolveIconId(icon: string): string | null {
  const normalized = icon.trim().toLowerCase();
  if (!normalized) return null;
  const aliased = ICON_ALIASES[normalized] ?? normalized;
  return ICONS_BY_ID.has(aliased) ? aliased : null;
}

export function getIconDef(icon: string): BioIconDef | null {
  const id = resolveIconId(icon);
  return id ? (ICONS_BY_ID.get(id) ?? null) : null;
}

export function getBrandIconUrl(id: string): string {
  return `/icons/${id}.svg`;
}

export function isEmojiIcon(icon: string): boolean {
  return (
    !resolveIconId(icon) &&
    icon.length <= 8 &&
    /\p{Extended_Pictographic}/u.test(icon)
  );
}

/**
 * Picker tint. Brands whose mark is essentially black are returned without a
 * colour so they follow the theme's text colour and stay visible in dark mode.
 */
export function getIconTint(def: BioIconDef): string | undefined {
  if (!def.color) return undefined;
  const hex = def.color.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.25 ? undefined : def.color;
}

/** Suggests an icon for a link URL by matching its hostname. */
export function suggestIconForUrl(url: string): string | null {
  let hostname: string;
  try {
    hostname = new URL(url.includes("://") ? url : `https://${url}`).hostname;
  } catch {
    return null;
  }
  hostname = hostname.toLowerCase().replace(/^www\./, "");

  const exact = HOSTS_TO_ICON.get(hostname);
  if (exact) return exact;

  for (const [host, id] of HOSTS_TO_ICON) {
    if (hostname.endsWith(`.${host}`)) return id;
  }
  return null;
}

export function searchIcons(
  query: string,
  category?: BioIconCategory | "all",
): BioIconDef[] {
  const q = query.trim().toLowerCase();
  return BIO_ICONS.filter((icon) => {
    if (category && category !== "all" && icon.category !== category) {
      return false;
    }
    if (!q) return true;
    return (
      icon.id.includes(q) ||
      icon.label.toLowerCase().includes(q) ||
      (icon.keywords ?? []).some((keyword) => keyword.includes(q))
    );
  });
}

export const COMMON_EMOJIS = [
  "🔗", "🌐", "✨", "🔥", "💖", "💜", "🖤", "⭐", "👑", "💎",
  "🚀", "🎀", "🌸", "🍓", "🍰", "🐾", "🦊", "🐰", "🐱", "🦋",
  "🎮", "🕹️", "🎧", "🎵", "🎤", "🎬", "📺", "📷", "🎨", "🖌️",
  "💻", "⌨️", "📱", "📧", "💬", "📌", "📚", "📝", "🗓️", "🛒",
  "💸", "🎁", "☕", "🍕", "🌙", "☁️", "🌈", "⚡", "❄️", "🌊",
] as const;
