/**
 * Spotify Web API integration for custom embed
 */

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    name: string;
    external_urls: {
      spotify: string;
    };
  }>;
  album: {
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
    external_urls: {
      spotify: string;
    };
  };
  external_urls: {
    spotify: string;
  };
  preview_url: string | null;
  duration_ms: number;
  popularity: number;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  owner: {
    display_name: string;
  };
  tracks: {
    total: number;
  };
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  artists: Array<{
    name: string;
  }>;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  external_urls: {
    spotify: string;
  };
  tracks: {
    total: number;
  };
  release_date: string;
}

/**
 * Get Spotify access token using Client Credentials flow
 */
async function getSpotifyAccessToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn('Spotify credentials not configured');
    return null;
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(`Spotify auth failed: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Failed to get Spotify access token:', error);
    return null;
  }
}

/**
 * Parse Spotify URL to extract type and ID
 */
export function parseSpotifyUrl(url: string): { type: 'track' | 'playlist' | 'album'; id: string } | null {
  const trackMatch = url.match(/track\/([a-zA-Z0-9]+)/);
  const playlistMatch = url.match(/playlist\/([a-zA-Z0-9]+)/);
  const albumMatch = url.match(/album\/([a-zA-Z0-9]+)/);

  if (trackMatch) return { type: 'track', id: trackMatch[1] };
  if (playlistMatch) return { type: 'playlist', id: playlistMatch[1] };
  if (albumMatch) return { type: 'album', id: albumMatch[1] };
  
  return null;
}

/**
 * Fetch track data from Spotify API
 */
export async function getSpotifyTrack(trackId: string): Promise<SpotifyTrack | null> {
  const accessToken = await getSpotifyAccessToken();
  if (!accessToken) return null;

  try {
    const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch track: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Spotify track:', error);
    return null;
  }
}

/**
 * Fetch playlist data from Spotify API
 */
export async function getSpotifyPlaylist(playlistId: string): Promise<SpotifyPlaylist | null> {
  const accessToken = await getSpotifyAccessToken();
  if (!accessToken) return null;

  try {
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch playlist: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Spotify playlist:', error);
    return null;
  }
}

/**
 * Fetch album data from Spotify API
 */
export async function getSpotifyAlbum(albumId: string): Promise<SpotifyAlbum | null> {
  const accessToken = await getSpotifyAccessToken();
  if (!accessToken) return null;

  try {
    const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch album: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Spotify album:', error);
    return null;
  }
}

/**
 * Format duration from milliseconds to MM:SS
 */
export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Get the best image from Spotify images array
 */
export function getBestImage(images: Array<{ url: string; height: number; width: number }>): string | null {
  if (!images.length) return null;
  
  // Sort by size (largest first) and return the medium size (~300px) if available
  const sorted = images.sort((a, b) => b.width - a.width);
  const medium = sorted.find(img => img.width >= 200 && img.width <= 400);
  return medium?.url || sorted[0]?.url || null;
}
