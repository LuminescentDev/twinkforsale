import {
  component$,
  type QRL,
} from "@builder.io/qwik";
import { Music } from "lucide-icons-qwik";
import type { BioLink } from "@prisma/client";
import {
  ParticleBackground,
  type ParticleConfig,
} from "~/components/effects/particle-background";
import { BioLinkIcon } from "~/components/bio/bio-link-icon";
import { DiscordProfile } from "~/components/bio/discord-profile";
import { Markdown } from "~/components/markdown";
import { AsyncDiscordAvatar } from "~/components/bio/async-discord-avatar";
// import { sanitizeCSS } from "~/lib/css-sanitizer";

export interface BioPageData {
  displayName?: string | null;
  description?: string | null;
  profileImage?: string | null;
  backgroundImage?: string | null;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  customCss?: string | null;
  spotifyTrack?: string | null;
  bioLinks: BioLink[];
  gradientConfig?: string | null;
  particleConfig?: string | null;
  discordUserId?: string | null;
  showDiscord?: boolean;
  discordConfig?: string | null;
}

export interface BioPageDisplayProps {
  bioData: BioPageData;
  isPreview?: boolean;
  onLinkClick?: QRL<(linkId: string) => void>;
  class?: string;
}

export const BioPageDisplay = component$<BioPageDisplayProps>(
  ({ bioData, isPreview = false, onLinkClick, class: className = "" }) => {    const activeLinks = bioData.bioLinks.filter((link) => link.isActive);

    // Parse particle configuration
    const parseParticleConfig = (): ParticleConfig | null => {
      try {
        if (bioData.particleConfig) {
          return JSON.parse(bioData.particleConfig);
        }
      } catch (e) {
        console.warn("Failed to parse particle config:", e);
      }
      return null;
    };

    const particleConfig = parseParticleConfig();

    // Extract Spotify track ID for embed
    const getSpotifyEmbedId = (url: string) => {
      const trackMatch = url.match(/track\/([a-zA-Z0-9]+)/);
      const playlistMatch = url.match(/playlist\/([a-zA-Z0-9]+)/);
      const albumMatch = url.match(/album\/([a-zA-Z0-9]+)/);

      if (trackMatch) return { type: "track", id: trackMatch[1] };
      if (playlistMatch) return { type: "playlist", id: playlistMatch[1] };
      if (albumMatch) return { type: "album", id: albumMatch[1] };
      return null;
    };
    const spotifyEmbed = bioData.spotifyTrack
      ? getSpotifyEmbedId(bioData.spotifyTrack)
      : null; // Check if backgroundColor contains gradient CSS
    const isGradient = bioData.backgroundColor.includes("gradient");
    const backgroundStyle = isGradient
      ? { backgroundImage: bioData.backgroundColor }
      : { backgroundColor: bioData.backgroundColor };
    return (
      <div
        class={`bio-container relative flex flex-col gap-3 ${className} ${isPreview ? "" : "min-h-screen"}`}
        style={{
          ...backgroundStyle,
          color: bioData.textColor,
          ...(bioData.backgroundImage
            ? {
                backgroundImage: `url(${bioData.backgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : {}),
        }}
      >
        {/* Particle Background */}
        {particleConfig?.enabled && (
          <ParticleBackground
            config={particleConfig}
            class={
              isPreview ? "!absolute !inset-0 !z-0" : "!fixed !inset-0 !z-0"
            }
          />
        )}
        {/* Custom CSS injection */}
        {/* {bioData.customCss && !isPreview && (
          <style dangerouslySetInnerHTML={sanitizeCSS(bioData.customCss)} />
        )} */}
        {/* Background overlay if background image exists */}
        {bioData.backgroundImage && (
          <div
            class="absolute inset-0 bg-black/40"
            style={{ backgroundColor: `${bioData.backgroundColor}80` }}
          />
        )}{" "}
        {/* Main content - centered */}
        <div class="flex items-center justify-center p-6">
          <div
            class="bio-content relative z-10 mx-auto w-full max-w-xl rounded-3xl border border-white/10 bg-black/20 p-8 text-center shadow-2xl backdrop-blur-sm"
            style={{ backgroundColor: `${bioData.backgroundColor}15` }}
          >            {/* Profile Image */}
            {bioData.profileImage ? (
              <img
                src={bioData.profileImage}
                alt="Profile"
                class="profile-image mx-auto mb-6 h-32 w-32 rounded-full border-4 border-white/20 object-cover shadow-lg"
                width="128"
                height="128"
              />
            ) : bioData.discordUserId ? (
              <AsyncDiscordAvatar
                discordUserId={bioData.discordUserId}
                size={128}
                class="profile-image mx-auto mb-6 h-32 w-32 border-4 border-white/20 shadow-lg"
              />
            ) : null}
            {/* Display Name */}
            <h1 class="display-name mb-4 text-4xl font-bold tracking-tight">
              {bioData.displayName || "Your Name"}
            </h1>{" "}            {/* Description */}
            {bioData.description ? (
              <Markdown 
                content={bioData.description}
                class="bio-description mx-auto mb-8 max-w-md text-lg leading-relaxed opacity-90"
              />
            ) : (
              isPreview && (
                <p class="bio-description mx-auto mb-8 max-w-md text-lg leading-relaxed opacity-50">
                  Your description will appear here
                </p>
              )
            )}
            {/* Bio Links */}
            <div class="bio-links mb-8">
              {activeLinks.length > 0 ? (
                <div class="flex flex-wrap items-center justify-center gap-4">
                  {activeLinks.map((link) => (
                    <div key={link.id} class="group relative">
                      <button
                        class="bio-link-circle flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border-2 transition-all duration-300 hover:scale-110 hover:shadow-lg active:scale-95"
                        style={{
                          backgroundColor: `${bioData.accentColor}20`,
                          borderColor: bioData.accentColor,
                          color: bioData.textColor,
                        }}
                        onClick$={async () => {
                          if (isPreview) {
                            return; // No action in preview
                          }

                          if (onLinkClick) {
                            await onLinkClick(link.id);
                          }

                          // Open link in new tab
                          window.open(
                            link.url,
                            "_blank",
                            "noopener,noreferrer",
                          );
                        }}
                        disabled={isPreview}
                        title={link.title}
                      >
                        <BioLinkIcon
                          icon={link.icon}
                          class="link-icon"
                          size={24}
                        />
                      </button>

                      {/* Tooltip */}
                      <div class="tooltip absolute -bottom-10 left-1/2 z-10 -translate-x-1/2 transform rounded-lg bg-black/80 px-2 py-1 text-xs text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
                        {link.title}
                        <div class="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 transform bg-black/80"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                isPreview && (
                  <div class="space-y-3 opacity-50">
                    <div class="flex justify-center gap-4">
                      <div class="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-white/30">
                        <span class="text-xs">Link</span>
                      </div>
                      <div class="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-white/30">
                        <span class="text-xs">Link</span>
                      </div>
                      <div class="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-white/30">
                        <span class="text-xs">Link</span>
                      </div>
                    </div>
                    <p class="text-center text-sm">
                      Your links will appear here
                    </p>
                  </div>
                )
              )}{" "}
            </div>
            {/* Spotify Embed */}
            {spotifyEmbed && (
              <div class="spotify-section mt-8">
                <div class="mb-4 flex items-center justify-center gap-2 text-lg opacity-75">
                  <Music class="h-5 w-5" />
                  Currently Playing
                </div>

                {isPreview ? (
                  <div class="mx-auto max-w-sm rounded-2xl bg-black/30 p-6 backdrop-blur-sm">
                    <div class="mb-2 text-sm opacity-75">
                      🎵 Spotify {spotifyEmbed.type}
                    </div>
                    <div class="text-xs opacity-60">
                      Preview mode - embed will appear on live page
                    </div>
                  </div>
                ) : (
                  <div class="spotify-embed mx-auto max-w-sm">
                    <iframe
                      src={`https://open.spotify.com/embed/${spotifyEmbed.type}/${spotifyEmbed.id}?utm_source=generator&theme=0`}
                      width="100%"
                      height="152"
                      allowFullscreen
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      class="rounded-2xl"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Discord Profile - Separate box under main bio */}
        {bioData.showDiscord && bioData.discordUserId && (
          <div class="-mt-4 flex justify-center px-6 pb-6">
            <div class="w-full max-w-xl">
              <DiscordProfile
                discordId={bioData.discordUserId}
                config={
                  bioData.discordConfig
                    ? JSON.parse(bioData.discordConfig)
                    : undefined
                }
              />
            </div>
          </div>
        )}
        {/* Powered by footer - fixed at bottom */}
        {!isPreview && (
          <div class="powered-by relative z-10 p-6 text-center">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm opacity-50 transition-opacity hover:opacity-75"
              style={{ color: bioData.textColor }}
            >
              Powered by twink.forsale
            </a>
          </div>
        )}
      </div>
    );
  },
);
