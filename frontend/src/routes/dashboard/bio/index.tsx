import {
  component$,
  useSignal,
  useComputed$,
  $,
  useTask$,
} from "@builder.io/qwik";
import {
  routeLoader$,
  Form,
  routeAction$,
  z,
  zod$,
  Link,
} from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import {
  User,
  Link as LinkIcon,
  Plus,
  Eye,
  Palette,
  ExternalLink,
  GripVertical,
  Trash2,
  Globe,
  Lock,
  BarChart3,
  Edit,
  Save,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-icons-qwik";
import { createServerApi } from "~/lib/api/server";
import { bio as bioApi } from "~/lib/api/client";
import {
  BioPageDisplay,
  type BioPageData,
} from "~/components/bio/bio-page-display";
import { IconSelector } from "~/components/ui/icon-selector";
import { BioLinkIcon } from "~/components/bio/bio-link-icon";
import {
  defaultParticleConfigs,
  type ParticleConfig,
} from "~/components/effects/particle-background";
import { ParticleConfigPanel } from "~/components/ui/particle-config-panel";
import {
  GradientConfigPanel,
  getGradientCSS,
  type GradientConfig,
} from "~/components/ui/gradient-config-panel";
import { getLanyardData } from "~/lib/discord";
import { sanitizeCSS, hasDangerousCSS } from "~/lib/css-sanitizer";

export const useBioData = routeLoader$(async (requestEvent) => {
  const user = requestEvent.sharedMap.get("user");

  if (!user) {
    throw requestEvent.redirect(302, "/");
  }

  if (!user.isApproved) {
    throw requestEvent.redirect(302, "/dashboard?error=bio_not_approved");
  }

  try {
    const api = createServerApi(requestEvent);
    const bioData = await api.bio.get();

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isApproved: user.isApproved,
        bioUsername: bioData.username,
        bioDisplayName: bioData.displayName,
        bioDescription: bioData.description,
        bioProfileImage: bioData.profileImage,
        bioBackgroundImage: bioData.backgroundImage,
        bioBackgroundColor: bioData.backgroundColor || "#8B5CF6",
        bioTextColor: bioData.textColor || "#FFFFFF",
        bioAccentColor: bioData.accentColor || "#F59E0B",
        bioCustomCss: bioData.customCss,
        bioSpotifyTrack: bioData.spotifyTrack,
        bioIsPublic: bioData.isPublic,
        bioViews: bioData.views,
        bioGradientConfig: bioData.gradientConfig,
        bioParticleConfig: bioData.particleConfig,
        bioDiscordUserId: bioData.discordUserId,
        bioShowDiscord: bioData.showDiscord,
        bioDiscordConfig: bioData.discordConfig,
      },
      bioLinks: bioData.links.map(link => ({
        id: link.id,
        title: link.title,
        url: link.url,
        icon: link.icon,
        order: link.order,
        isActive: link.isActive,
        clicks: link.clicks ?? 0,
      })),
      bioLimits: {
        maxLinks: 20,
        maxBioLinks: 20,
        maxDescriptionLength: 500,
        maxCustomCssLength: 5000,
        maxUsernameLength: 30,
        maxDisplayNameLength: 50,
        maxUrlLength: 500,
        maxLinkTitleLength: 100,
        maxIconLength: 50,
        canUseCustomCss: true,
        canUseParticles: true,
        canUseGradients: true,
      },
      analytics: {
        totalViews: bioData.views,
        uniqueIPs: 0, // Not tracked separately yet
        topLinks: bioData.links
          .filter(link => (link.clicks ?? 0) > 0)
          .sort((a, b) => (b.clicks ?? 0) - (a.clicks ?? 0))
          .slice(0, 5)
          .map(link => ({
            id: link.id,
            title: link.title,
            clicks: link.clicks ?? 0,
          })),
      },
      baseUrl: requestEvent.url.origin,
    };
  } catch (error) {
    console.error("Failed to load bio data:", error);
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isApproved: user.isApproved,
        bioBackgroundColor: "#8B5CF6",
        bioTextColor: "#FFFFFF",
        bioAccentColor: "#F59E0B",
      },
      bioLinks: [],
      bioLimits: {
        maxLinks: 20,
        maxBioLinks: 20,
        maxDescriptionLength: 500,
        maxCustomCssLength: 5000,
        maxUsernameLength: 30,
        maxDisplayNameLength: 50,
        maxUrlLength: 500,
        maxLinkTitleLength: 100,
        maxIconLength: 50,
        canUseCustomCss: true,
        canUseParticles: true,
        canUseGradients: true,
      },
      analytics: {
        totalViews: 0,
        uniqueIPs: 0,
        topLinks: [],
      },
      baseUrl: requestEvent.url.origin,
    };
  }
});

export const useUpdateBio = routeAction$(
  async (values, requestEvent) => {
    const user = requestEvent.sharedMap.get("user");
    if (!user) {
      return requestEvent.fail(401, { message: "Not authenticated" });
    }

    if (!user.isApproved) {
      return requestEvent.fail(403, {
        message: "Account not approved for bio service",
      });
    }

    // Sanitize custom CSS to prevent XSS
    let sanitizedCSS = null;
    if (values.bioCustomCss) {
      sanitizedCSS = sanitizeCSS(values.bioCustomCss);

      if (hasDangerousCSS(values.bioCustomCss)) {
        console.warn(
          `Dangerous CSS detected and sanitized for user ${user.id}`,
        );
      }
    }

    try {
      await bioApi.update({
        username: values.bioUsername || undefined,
        displayName: values.bioDisplayName || undefined,
        description: values.bioDescription || undefined,
        profileImage: values.bioProfileImage || undefined,
        backgroundImage: values.bioBackgroundImage || undefined,
        backgroundColor: values.bioBackgroundColor || "#8B5CF6",
        textColor: values.bioTextColor || "#FFFFFF",
        accentColor: values.bioAccentColor || "#F59E0B",
        customCss: sanitizedCSS || undefined,
        spotifyTrack: values.bioSpotifyTrack || undefined,
        isPublic: values.bioIsPublic || false,
        gradientConfig: values.bioGradientConfig || undefined,
        particleConfig: values.bioParticleConfig || undefined,
        showDiscord: values.bioShowDiscord || false,
        discordConfig: values.bioDiscordConfig || undefined,
      });

      return { success: true, message: "Bio updated successfully" };
    } catch (error: any) {
      console.error("Failed to update bio:", error);
      return requestEvent.fail(500, { message: error?.message || "Failed to update bio" });
    }
  },
  zod$({
    bioUsername: z.string().optional(),
    bioDisplayName: z.string().optional(),
    bioDescription: z.string().optional(),
    bioProfileImage: z.string().optional(),
    bioBackgroundImage: z.string().optional(),
    bioBackgroundColor: z.string().optional(),
    bioTextColor: z.string().optional(),
    bioAccentColor: z.string().optional(),
    bioCustomCss: z.string().optional(),
    bioSpotifyTrack: z.string().optional(),
    bioGradientConfig: z.string().optional(),
    bioParticleConfig: z.string().optional(),
    bioShowDiscord: z.preprocess((val) => {
      return val === "true" || val === true;
    }, z.boolean().optional()),
    bioDiscordConfig: z.string().optional(),
    bioIsPublic: z.preprocess((val) => {
      // Handle checkbox: if unchecked, val will be undefined
      // If checked, val will be "true"
      return val === "true" || val === true;
    }, z.boolean().optional()),
  }),
);

export const useCreateBioLink = routeAction$(
  async (values, requestEvent) => {
    const user = requestEvent.sharedMap.get("user");
    if (!user) {
      return requestEvent.fail(401, { message: "Not authenticated" });
    }

    if (!user.isApproved) {
      return requestEvent.fail(403, { message: "Account not approved" });
    }

    try {
      await bioApi.links.create({
        title: values.title,
        url: values.url,
        icon: values.icon,
      });
      return { success: true, message: "Link added successfully" };
    } catch (error: any) {
      console.error("Failed to create bio link:", error);
      return requestEvent.fail(400, { message: error?.message || "Failed to create link" });
    }
  },
  zod$({
    title: z.string().min(1),
    url: z.string().url(),
    icon: z.string().optional(),
  }),
);

export const useUpdateBioLink = routeAction$(
  async (values, requestEvent) => {
    const user = requestEvent.sharedMap.get("user");
    if (!user) {
      return requestEvent.fail(401, { message: "Not authenticated" });
    }

    try {
      await bioApi.links.update(values.id, {
        title: values.title,
        url: values.url,
        icon: values.icon,
        isActive: values.isActive,
      });
      return { success: true, message: "Link updated successfully" };
    } catch (error: any) {
      console.error("Failed to update bio link:", error);
      return requestEvent.fail(400, { message: error?.message || "Failed to update link" });
    }
  },
  zod$({
    id: z.string(),
    title: z.string().min(1),
    url: z.string().url(),
    icon: z.string().optional(),
    isActive: z.preprocess(
      (val) => val === "true" || val === true,
      z.boolean(),
    ),
  }),
);

export const useDeleteBioLink = routeAction$(
  async (values, requestEvent) => {
    const user = requestEvent.sharedMap.get("user");
    if (!user) {
      return requestEvent.fail(401, { message: "Not authenticated" });
    }

    try {
      await bioApi.links.delete(values.id);
      return { success: true, message: "Link deleted successfully" };
    } catch (error: any) {
      console.error("Failed to delete bio link:", error);
      return requestEvent.fail(400, { message: error?.message || "Failed to delete link" });
    }
  },
  zod$({
    id: z.string(),
  }),
);

export default component$(() => {
  const bioData = useBioData();
  const updateBio = useUpdateBio();
  const createBioLink = useCreateBioLink();
  const updateBioLink = useUpdateBioLink();
  const deleteBioLink = useDeleteBioLink();
  const editingLink = useSignal<string | null>(null);
  const showNewLinkForm = useSignal(false);
  const newLinkIcon = useSignal("");
  const editingLinkIcons = useSignal<Record<string, string>>({});
  // Collapsible section states
  const basicInfoCollapsed = useSignal(false);
  const appearanceCollapsed = useSignal(false);
  const discordCollapsed = useSignal(false);
  const backgroundEffectsCollapsed = useSignal(false);
  const linksCollapsed = useSignal(false);
  const analyticsCollapsed = useSignal(false);

  // Function to reset new link form
  const resetNewLinkForm = $(() => {
    newLinkIcon.value = "";
    showNewLinkForm.value = false;
  });

  // Reset form when link is successfully created
  useTask$(({ track }) => {
    track(() => createBioLink.value);
    if (createBioLink.value?.success) {
      resetNewLinkForm();
    }
  });

  // State for managing form changes
  const hasChanges = useSignal(false);

  // Form signals
  const username = useSignal(bioData.value.user.bioUsername || "");
  const displayName = useSignal(bioData.value.user.bioDisplayName || "");
  const description = useSignal(bioData.value.user.bioDescription || "");
  const profileImage = useSignal(bioData.value.user.bioProfileImage || "");
  const backgroundImage = useSignal(
    bioData.value.user.bioBackgroundImage || "",
  );
  const backgroundColor = useSignal(bioData.value.user.bioBackgroundColor);
  const textColor = useSignal(bioData.value.user.bioTextColor);
  const accentColor = useSignal(bioData.value.user.bioAccentColor);
  const customCss = useSignal(bioData.value.user.bioCustomCss || "");
  const spotifyTrack = useSignal(bioData.value.user.bioSpotifyTrack || "");
  const isPublic = useSignal(bioData.value.user.bioIsPublic);
  const showDiscord = useSignal(bioData.value.user.bioShowDiscord);

  // Discord error tracking
  const discordError = useSignal<string | null>(null);
  const discordTesting = useSignal(false);

  // CSS security warning
  const cssWarning = useSignal<string | null>(null);
  // Parse Discord configuration
  const parseDiscordConfig = () => {
    try {
      if (bioData.value.user.bioDiscordConfig) {
        return JSON.parse(bioData.value.user.bioDiscordConfig);
      }
    } catch (e) {
      console.warn("Failed to parse Discord config:", e);
    }
    return {
      showAvatar: true,
      showStatus: true,
      showActivity: true,
      showSpotify: true,
      showBadges: true,
      showGuild: true,
      refreshInterval: 30,
    };
  };

  const discordConfig = useSignal(parseDiscordConfig());

  // Function to test Discord connectivity
  const testDiscordConnection = $(async () => {
    if (!bioData.value.user.bioDiscordUserId) {
      discordError.value =
        "No Discord user ID found. Please log in with Discord first.";
      return;
    }

    discordTesting.value = true;
    discordError.value = null;

    try {
      const result = await getLanyardData(bioData.value.user.bioDiscordUserId);
      if (!result.success) {
        discordError.value =
          result.error ||
          "Failed to connect to Discord. Please check if you've joined our Discord server (https://discord.gg/TDsQpa9tdT) or invited the bot to your server.";
      } else {
        discordError.value = null;
      }
    } catch (error) {
      discordError.value =
        "Error testing Discord connection. Please try again.";
      console.error("Discord test error:", error);
    } finally {
      discordTesting.value = false;
    }
  });

  // Auto-test Discord connection on load if enabled
  useTask$(async () => {
    if (showDiscord.value && bioData.value.user.bioDiscordUserId) {
      await testDiscordConnection();
    }
  });

  // Parse and initialize particle configuration
  const parseParticleConfig = (): ParticleConfig => {
    try {
      if (bioData.value.user.bioParticleConfig) {
        return JSON.parse(bioData.value.user.bioParticleConfig);
      }
    } catch (e) {
      console.warn("Failed to parse particle config:", e);
    }
    return defaultParticleConfigs.hearts;
  };

  // Parse and initialize gradient configuration
  const parseGradientConfig = (): GradientConfig => {
    try {
      if (bioData.value.user.bioGradientConfig) {
        return JSON.parse(bioData.value.user.bioGradientConfig);
      }
    } catch (e) {
      console.warn("Failed to parse gradient config:", e);
    }
    return {
      type: "linear",
      direction: "to right",
      colors: ["#8B5CF6", "#EC4899"],
      enabled: false,
    };
  };

  const particleConfig = useSignal<ParticleConfig>(parseParticleConfig());
  const gradientConfig = useSignal<GradientConfig>(parseGradientConfig());
  // Monitor for successful form submission to reset change tracking
  useTask$(({ track }) => {
    track(() => updateBio.value);

    if (updateBio.value?.success) {
      hasChanges.value = false;
    }
  });

  // Function to check if any values have changed
  const checkForChanges = $(() => {
    const originalParticleConfig = (() => {
      try {
        if (bioData.value.user.bioParticleConfig) {
          return JSON.parse(bioData.value.user.bioParticleConfig);
        }
      } catch {
        console.warn("Failed to parse particle config");
      }
      return defaultParticleConfigs.hearts;
    })();
    const originalGradientConfig = (() => {
      try {
        if (bioData.value.user.bioGradientConfig) {
          return JSON.parse(bioData.value.user.bioGradientConfig);
        }
      } catch {
        console.warn("Failed to parse gradient config");
      }
      return {
        type: "linear",
        direction: "to right",
        colors: ["#8B5CF6", "#EC4899"],
        enabled: false,
      };
    })();

    const originalDiscordConfig = (() => {
      try {
        if (bioData.value.user.bioDiscordConfig) {
          return JSON.parse(bioData.value.user.bioDiscordConfig);
        }
      } catch {
        console.warn("Failed to parse Discord config");
      }
      return {
        showAvatar: true,
        showStatus: true,
        showActivity: true,
        showSpotify: true,
        refreshInterval: 30,
      };
    })();

    const changed =
      username.value !== (bioData.value.user.bioUsername || "") ||
      displayName.value !== (bioData.value.user.bioDisplayName || "") ||
      description.value !== (bioData.value.user.bioDescription || "") ||
      profileImage.value !== (bioData.value.user.bioProfileImage || "") ||
      backgroundImage.value !== (bioData.value.user.bioBackgroundImage || "") ||
      backgroundColor.value !== bioData.value.user.bioBackgroundColor ||
      textColor.value !== bioData.value.user.bioTextColor ||
      accentColor.value !== bioData.value.user.bioAccentColor ||
      customCss.value !== (bioData.value.user.bioCustomCss || "") ||
      spotifyTrack.value !== (bioData.value.user.bioSpotifyTrack || "") ||
      isPublic.value !== bioData.value.user.bioIsPublic ||
      showDiscord.value !== bioData.value.user.bioShowDiscord ||
      JSON.stringify(particleConfig.value) !==
      JSON.stringify(originalParticleConfig) ||
      JSON.stringify(gradientConfig.value) !==
      JSON.stringify(originalGradientConfig) ||
      JSON.stringify(discordConfig.value) !==
      JSON.stringify(originalDiscordConfig);

    hasChanges.value = changed;
  });
  // Watch for changes in any signal and trigger change detection
  useTask$(({ track }) => {
    track(() => username.value);
    track(() => displayName.value);
    track(() => description.value);
    track(() => profileImage.value);
    track(() => backgroundImage.value);
    track(() => backgroundColor.value);
    track(() => textColor.value);
    track(() => accentColor.value);
    track(() => customCss.value);
    track(() => spotifyTrack.value);
    track(() => isPublic.value);
    track(() => showDiscord.value);
    track(() => JSON.stringify(discordConfig.value));
    track(() => JSON.stringify(particleConfig.value));
    track(() => JSON.stringify(gradientConfig.value));
    checkForChanges();
  });

  // Monitor CSS changes for security warnings
  useTask$(({ track }) => {
    track(() => customCss.value);

    if (customCss.value && hasDangerousCSS(customCss.value)) {
      cssWarning.value =
        "Warning: Your custom CSS contains potentially dangerous content that will be automatically sanitized for security.";
    } else {
      cssWarning.value = null;
    }
  });

  // Function to reset all values to original database values
  const resetToOriginal = $(() => {
    username.value = bioData.value.user.bioUsername || "";
    displayName.value = bioData.value.user.bioDisplayName || "";
    description.value = bioData.value.user.bioDescription || "";
    profileImage.value = bioData.value.user.bioProfileImage || "";
    backgroundImage.value = bioData.value.user.bioBackgroundImage || "";
    backgroundColor.value = bioData.value.user.bioBackgroundColor;
    textColor.value = bioData.value.user.bioTextColor;
    accentColor.value = bioData.value.user.bioAccentColor;
    customCss.value = bioData.value.user.bioCustomCss || "";
    spotifyTrack.value = bioData.value.user.bioSpotifyTrack || "";
    isPublic.value = bioData.value.user.bioIsPublic;

    // Reset configs to original values
    try {
      if (bioData.value.user.bioParticleConfig) {
        particleConfig.value = JSON.parse(bioData.value.user.bioParticleConfig);
      } else {
        particleConfig.value = defaultParticleConfigs.hearts;
      }
    } catch {
      particleConfig.value = defaultParticleConfigs.hearts;
    }
    try {
      if (bioData.value.user.bioGradientConfig) {
        gradientConfig.value = JSON.parse(bioData.value.user.bioGradientConfig);
      } else {
        gradientConfig.value = {
          type: "linear",
          direction: "to right",
          colors: ["#8B5CF6", "#EC4899"],
          enabled: false,
        };
      }
    } catch {
      gradientConfig.value = {
        type: "linear",
        direction: "to right",
        colors: ["#8B5CF6", "#EC4899"],
        enabled: false,
      };
    } // Reset Discord settings
    showDiscord.value = bioData.value.user.bioShowDiscord;
    discordError.value = null; // Clear Discord errors on reset
    cssWarning.value = null; // Clear CSS warnings on reset
    try {
      if (bioData.value.user.bioDiscordConfig) {
        discordConfig.value = JSON.parse(bioData.value.user.bioDiscordConfig);
      } else {
        discordConfig.value = {
          showAvatar: true,
          showStatus: true,
          showActivity: true,
          showSpotify: true,
          refreshInterval: 30,
        };
      }
    } catch {
      discordConfig.value = {
        showAvatar: true,
        showStatus: true,
        showActivity: true,
        showSpotify: true,
        refreshInterval: 30,
      };
    }

    hasChanges.value = false;
  });

  // Computed bio data for preview
  const previewBioData = useComputed$<BioPageData>(() => {
    const baseBackgroundColor = backgroundColor.value;
    const finalBackgroundColor = gradientConfig.value.enabled
      ? getGradientCSS(gradientConfig.value, baseBackgroundColor)
      : baseBackgroundColor;
    return {
      displayName: displayName.value || bioData.value.user.name,
      description: description.value,
      profileImage: profileImage.value,
      backgroundImage: backgroundImage.value,
      backgroundColor: finalBackgroundColor,
      textColor: textColor.value,
      accentColor: accentColor.value,
      customCss: customCss.value,
      spotifyTrack: spotifyTrack.value,
      bioLinks: bioData.value.bioLinks,
      gradientConfig: JSON.stringify(gradientConfig.value),
      particleConfig: JSON.stringify(particleConfig.value),
      discordUserId: bioData.value.user.bioDiscordUserId,
      showDiscord: showDiscord.value,
      discordConfig: JSON.stringify(discordConfig.value),
    };
  });

  const inputClasses =
    "w-full px-4 py-3 glass rounded-2xl placeholder:text-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent-primary/50 transition-all duration-300 text-theme-text-primary";
  const buttonClasses =
    "px-6 py-3 rounded-2xl font-medium transition-all duration-300 flex items-center gap-2";

  return (
    <div class="bg-theme-bg min-h-screen">
      <div class="container mx-auto px-4 py-8">
        {/* Header */}
        <div class="mb-8">
          <h1 class="text-theme-text-primary mb-2 text-3xl font-bold">
            Bio Page Builder
          </h1>
          <p class="text-theme-text-secondary">
            Create your custom bio link page for sharing all your important
            links
          </p>
          {updateBio.value?.success && (
            <div class="from-theme-accent-secondary/20 to-theme-accent-tertiary/20 glass mt-4 rounded-2xl border border-theme-accent-secondary/30 bg-gradient-to-br p-3">
              <p class="text-theme-accent-secondary text-sm">
                ✅ {updateBio.value.message}
              </p>
            </div>
          )}
          {updateBio.value?.failed && (
            <div class="from-theme-accent-primary/20 to-theme-accent-secondary/20 glass mt-4 rounded-2xl border border-theme-accent-primary/30 bg-gradient-to-br p-3">
              <p class="text-theme-accent-primary text-sm">
                ❌ {updateBio.value.message}
              </p>
            </div>
          )}
          {!bioData.value.user.isApproved && (
            <div class="glass mt-4 rounded-2xl border border-yellow-500/20 p-4">
              <p class="text-yellow-400">
                ⚠️ Your account needs to be approved to use the bio service.
              </p>
            </div>
          )}
        </div>

        <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Settings Panel */}
          <div class="space-y-6">
            {/* Basic Settings */}
            <div class="glass rounded-2xl p-6">
              <button
                type="button"
                onClick$={() =>
                  (basicInfoCollapsed.value = !basicInfoCollapsed.value)
                }
                class="hover:bg-theme-bg-secondary/50 -m-2 mb-4 flex w-full items-center justify-between rounded-lg p-2 text-left transition-colors"
              >
                <h2 class="text-theme-text-primary flex items-center gap-2 text-xl font-semibold">
                  <User class="h-5 w-5" />
                  Basic Information
                </h2>
                {basicInfoCollapsed.value ? (
                  <ChevronDown class="text-theme-text-muted h-5 w-5" />
                ) : (
                  <ChevronUp class="text-theme-text-muted h-5 w-5" />
                )}
              </button>

              {!basicInfoCollapsed.value && (
                <Form action={updateBio} class="space-y-4">
                  <div>
                    <label class="text-theme-text-secondary mb-2 block text-sm font-medium">
                      Username
                      <span class="text-theme-text-muted ml-2 text-xs">
                        ({username.value.length}/
                        {bioData.value.bioLimits.maxUsernameLength})
                      </span>
                    </label>
                    <div class="relative">
                      <input
                        type="text"
                        name="bioUsername"
                        bind:value={username}
                        placeholder="your-username"
                        maxLength={bioData.value.bioLimits.maxUsernameLength}
                        class={inputClasses}
                      />
                      <div class="text-theme-text-muted absolute inset-y-0 right-3 flex items-center text-sm">
                        {bioData.value.baseUrl}/
                      </div>
                    </div>
                    {username.value && (
                      <div class="text-theme-text-muted mt-2 text-sm">
                        Your bio will be available at: {bioData.value.baseUrl}/
                        {username.value}
                      </div>
                    )}
                  </div>
                  <div>
                    <label class="text-theme-text-secondary mb-2 block text-sm font-medium">
                      Display Name
                      <span class="text-theme-text-muted ml-2 text-xs">
                        ({displayName.value.length}/
                        {bioData.value.bioLimits.maxDisplayNameLength})
                      </span>
                    </label>
                    <input
                      type="text"
                      name="bioDisplayName"
                      bind:value={displayName}
                      placeholder="Your Name"
                      maxLength={bioData.value.bioLimits.maxDisplayNameLength}
                      class={inputClasses}
                    />
                  </div>
                  <div>
                    <label class="text-theme-text-secondary mb-2 block text-sm font-medium">
                      Description
                      <span class="text-theme-text-muted ml-2 text-xs">
                        ({description.value.length}/
                        {bioData.value.bioLimits.maxDescriptionLength})
                      </span>
                    </label>
                    <textarea
                      name="bioDescription"
                      bind:value={description}
                      placeholder="Tell people about yourself..."
                      maxLength={bioData.value.bioLimits.maxDescriptionLength}
                      rows={3}
                      class={inputClasses}
                    />
                  </div>
                  <div>
                    <label class="text-theme-text-secondary mb-2 block text-sm font-medium">
                      Profile Image URL
                      <span class="text-theme-text-muted ml-2 text-xs">
                        ({profileImage.value.length}/
                        {bioData.value.bioLimits.maxUrlLength})
                      </span>
                    </label>
                    <input
                      type="url"
                      name="bioProfileImage"
                      bind:value={profileImage}
                      placeholder="https://example.com/image.jpg"
                      maxLength={bioData.value.bioLimits.maxUrlLength}
                      class={inputClasses}
                    />
                  </div>
                  <div class="glass flex items-center justify-between gap-3 rounded-2xl p-3">
                    {/* Fancy toggle switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isPublic.value ? "true" : "false"}
                      onClick$={() => (isPublic.value = !isPublic.value)}
                      onKeyDown$={(e) => {
                        const key = (e as KeyboardEvent).key;
                        if (key === "Enter" || key === " ") {
                          e.preventDefault();
                          isPublic.value = !isPublic.value;
                        }
                      }}
                      class={`relative inline-flex h-8 w-16 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-theme-accent-primary/60 ${
                        isPublic.value
                          ? "from-theme-accent-primary to-theme-accent-secondary bg-gradient-to-r shadow-[0_0_0_3px_rgba(255,255,255,0.08)]"
                          : "bg-theme-card-border/80"
                      }`}
                    >
                      {/* Track icons */}
                      <span class="pointer-events-none absolute left-2 flex h-4 w-4 items-center justify-center text-white/80">
                        <Globe class={`h-3.5 w-3.5 transition-opacity ${isPublic.value ? "opacity-90" : "opacity-30"}`} />
                      </span>
                      <span class="pointer-events-none absolute right-2 flex h-4 w-4 items-center justify-center text-theme-text-muted">
                        <Lock class={`h-3.5 w-3.5 transition-opacity ${isPublic.value ? "opacity-30" : "opacity-70"}`} />
                      </span>
                      {/* Knob */}
                      <span
                        class={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                          isPublic.value ? "translate-x-8" : "translate-x-2"
                        }`}
                      />
                    </button>

                    {/* Label and hint */}
                    <div class="flex-1">
                      <div class="text-theme-text-primary font-medium">
                        {isPublic.value ? (
                          <span class="flex items-center gap-2">
                            <Globe class="h-4 w-4" />
                            Public
                          </span>
                        ) : (
                          <span class="flex items-center gap-2">
                            <Lock class="h-4 w-4" />
                            Private
                          </span>
                        )}
                      </div>
                      <div class="text-theme-text-secondary text-sm">
                        {isPublic.value
                          ? "Anyone can view your bio page"
                          : "Your bio page is hidden from public"}
                      </div>
                    </div>

                    {/* Hidden input to submit with this form if used */}
                    <input
                      type="hidden"
                      name="bioIsPublic"
                      value={isPublic.value ? "true" : "false"}
                    />
                  </div>
                  {isPublic.value && !username.value && (
                    <div class="mt-2 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-2">
                      <p class="text-xs text-yellow-400">
                        Set a username above to publish your bio.
                      </p>
                    </div>
                  )}
                </Form>
              )}
            </div>
            {/* Appearance Settings */}
            <div class="glass rounded-2xl p-6">
              <button
                type="button"
                onClick$={() =>
                  (appearanceCollapsed.value = !appearanceCollapsed.value)
                }
                class="hover:bg-theme-bg-secondary/50 -m-2 mb-4 flex w-full items-center justify-between rounded-lg p-2 text-left transition-colors"
              >
                <h2 class="text-theme-text-primary flex items-center gap-2 text-xl font-semibold">
                  <Palette class="h-5 w-5" />
                  Appearance
                </h2>
                {appearanceCollapsed.value ? (
                  <ChevronDown class="text-theme-text-muted h-5 w-5" />
                ) : (
                  <ChevronUp class="text-theme-text-muted h-5 w-5" />
                )}
              </button>

              {!appearanceCollapsed.value && (
                <Form action={updateBio} class="space-y-4">
                  <div>
                    <label class="text-theme-text-secondary mb-2 block text-sm font-medium">
                      Background Image URL
                      <span class="text-theme-text-muted ml-2 text-xs">
                        ({backgroundImage.value.length}/
                        {bioData.value.bioLimits.maxUrlLength})
                      </span>
                    </label>
                    <input
                      type="url"
                      name="bioBackgroundImage"
                      bind:value={backgroundImage}
                      placeholder="https://example.com/background.jpg"
                      maxLength={bioData.value.bioLimits.maxUrlLength}
                      class={inputClasses}
                    />
                  </div>
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label class="text-theme-text-secondary mb-2 block text-sm font-medium">
                        Background Color
                      </label>
                      <input
                        type="color"
                        name="bioBackgroundColor"
                        bind:value={backgroundColor}
                        class="border-theme-card-border h-10 w-full cursor-pointer rounded-xl border-2 bg-transparent"
                      />
                    </div>
                    <div>
                      <label class="text-theme-text-secondary mb-2 block text-sm font-medium">
                        Text Color
                      </label>
                      <input
                        type="color"
                        name="bioTextColor"
                        bind:value={textColor}
                        class="border-theme-card-border h-10 w-full cursor-pointer rounded-xl border-2 bg-transparent"
                      />
                    </div>
                    <div>
                      <label class="text-theme-text-secondary mb-2 block text-sm font-medium">
                        Accent Color
                      </label>
                      <input
                        type="color"
                        name="bioAccentColor"
                        bind:value={accentColor}
                        class="border-theme-card-border h-10 w-full cursor-pointer rounded-xl border-2 bg-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label class="text-theme-text-secondary mb-2 block text-sm font-medium">
                      Spotify Track/Playlist URL
                      <span class="text-theme-text-muted ml-2 text-xs">
                        ({spotifyTrack.value.length}/
                        {bioData.value.bioLimits.maxUrlLength})
                      </span>
                    </label>
                    <input
                      type="url"
                      name="bioSpotifyTrack"
                      bind:value={spotifyTrack}
                      placeholder="https://open.spotify.com/track/..."
                      maxLength={bioData.value.bioLimits.maxUrlLength}
                      class={inputClasses}
                    />
                  </div>
                  {/* Copy hidden fields */}
                  <input
                    type="hidden"
                    name="bioUsername"
                    value={username.value}
                  />
                  <input
                    type="hidden"
                    name="bioDisplayName"
                    value={displayName.value}
                  />
                  <input
                    type="hidden"
                    name="bioDescription"
                    value={description.value}
                  />
                  <input
                    type="hidden"
                    name="bioProfileImage"
                    value={profileImage.value}
                  />
                  <input
                    type="hidden"
                    name="bioBackgroundColor"
                    value={backgroundColor.value}
                  />
                  <input
                    type="hidden"
                    name="bioTextColor"
                    value={textColor.value}
                  />
                  <input
                    type="hidden"
                    name="bioAccentColor"
                    value={accentColor.value}
                  />
                  <input
                    type="hidden"
                    name="bioIsPublic"
                    value={isPublic.value ? "true" : "false"}
                  />
                </Form>
              )}
            </div>
            {/* Discord Integration */}
            <div class="glass rounded-2xl p-6">
              <button
                type="button"
                onClick$={() =>
                  (discordCollapsed.value = !discordCollapsed.value)
                }
                class="hover:bg-theme-bg-secondary/50 -m-2 mb-4 flex w-full items-center justify-between rounded-lg p-2 text-left transition-colors"
              >
                <h2 class="text-theme-text-primary flex items-center gap-2 text-xl font-semibold">
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.010c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                  Discord Profile
                </h2>
                {discordCollapsed.value ? (
                  <ChevronDown class="text-theme-text-muted h-5 w-5" />
                ) : (
                  <ChevronUp class="text-theme-text-muted h-5 w-5" />
                )}
              </button>

              {!discordCollapsed.value && (
                <Form action={updateBio} class="space-y-4">
                  {bioData.value.user.bioDiscordUserId && (
                    <div class="bg-theme-accent-primary/5 border-theme-accent-primary/20 rounded-xl border p-4">
                      <div class="mb-3 flex items-center gap-2">
                        <div class="bg-theme-accent-primary/20 rounded-full p-2">
                          <svg
                            class="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.010c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                          </svg>
                        </div>
                        <div>
                          <p class="text-theme-text-primary text-sm font-medium">
                            Discord Connected
                          </p>
                          <p class="text-theme-text-muted text-xs">
                            ID: {bioData.value.user.bioDiscordUserId}
                          </p>
                        </div>
                      </div>
                      <div class="space-y-3">
                        <div class="flex items-center justify-between">
                          <label class="text-theme-text-secondary flex items-center gap-2 text-sm font-medium">
                            Show Discord Profile
                          </label>
                          <button
                            type="button"
                            onClick$={async () => {
                              const newValue = !showDiscord.value;
                              showDiscord.value = newValue;

                              // Test Discord connection when enabling
                              if (newValue) {
                                await testDiscordConnection();
                              } else {
                                // Clear errors when disabling
                                discordError.value = null;
                              }
                            }}
                            class={`focus:ring-theme-accent-primary relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none ${showDiscord.value
                                ? "bg-theme-accent-primary"
                                : "bg-theme-card-border"
                              }`}
                          >
                            <span
                              class={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showDiscord.value
                                  ? "translate-x-6"
                                  : "translate-x-1"
                                }`}
                            />
                          </button>
                        </div>

                        {/* Discord Connection Test Button */}
                        <div class="flex items-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick$={testDiscordConnection}
                            disabled={discordTesting.value}
                            class="btn-secondary flex items-center gap-2 px-3 py-1.5 text-xs"
                          >
                            {discordTesting.value ? (
                              <>
                                <div class="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                                Testing...
                              </>
                            ) : (
                              <>🔍 Test Connection</>
                            )}
                          </button>
                        </div>

                        {/* Discord Error Display */}
                        {discordError.value && (
                          <div class="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                            <div class="flex items-start gap-2">
                              <div class="text-lg text-red-400">⚠️</div>
                              <div>
                                <p class="mb-1 text-sm font-medium text-red-400">
                                  Discord Connection Failed
                                </p>
                                <p class="text-xs text-red-300">
                                  {discordError.value}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {showDiscord.value && (
                          <div class="space-y-3 pt-2">
                            <h4 class="text-theme-text-primary text-sm font-medium">
                              Display Options
                            </h4>

                            <div class="grid grid-cols-2 gap-3">
                              <label class="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={discordConfig.value.showAvatar}
                                  onChange$={(e) => {
                                    discordConfig.value = {
                                      ...discordConfig.value,
                                      showAvatar: (e.target as HTMLInputElement)
                                        .checked,
                                    };
                                  }}
                                  class="border-theme-card-border bg-theme-bg-secondary text-theme-accent-primary focus:ring-theme-accent-primary rounded"
                                />
                                <span class="text-theme-text-secondary text-sm">
                                  Avatar
                                </span>
                              </label>
                              <label class="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={discordConfig.value.showStatus}
                                  onChange$={(e) => {
                                    discordConfig.value = {
                                      ...discordConfig.value,
                                      showStatus: (e.target as HTMLInputElement)
                                        .checked,
                                    };
                                  }}
                                  class="border-theme-card-border bg-theme-bg-secondary text-theme-accent-primary focus:ring-theme-accent-primary rounded"
                                />
                                <span class="text-theme-text-secondary text-sm">
                                  Status
                                </span>
                              </label>
                              <label class="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={discordConfig.value.showActivity}
                                  onChange$={(e) => {
                                    discordConfig.value = {
                                      ...discordConfig.value,
                                      showActivity: (
                                        e.target as HTMLInputElement
                                      ).checked,
                                    };
                                  }}
                                  class="border-theme-card-border bg-theme-bg-secondary text-theme-accent-primary focus:ring-theme-accent-primary rounded"
                                />
                                <span class="text-theme-text-secondary text-sm">
                                  Activity
                                </span>
                              </label>{" "}
                              <label class="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={discordConfig.value.showSpotify}
                                  onChange$={(e) => {
                                    discordConfig.value = {
                                      ...discordConfig.value,
                                      showSpotify: (
                                        e.target as HTMLInputElement
                                      ).checked,
                                    };
                                  }}
                                  class="border-theme-card-border bg-theme-bg-secondary text-theme-accent-primary focus:ring-theme-accent-primary rounded"
                                />
                                <span class="text-theme-text-secondary text-sm">
                                  Spotify
                                </span>
                              </label>
                              <label class="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={
                                    discordConfig.value.showBadges ?? true
                                  }
                                  onChange$={(e) => {
                                    discordConfig.value = {
                                      ...discordConfig.value,
                                      showBadges: (e.target as HTMLInputElement)
                                        .checked,
                                    };
                                  }}
                                  class="border-theme-card-border bg-theme-bg-secondary text-theme-accent-primary focus:ring-theme-accent-primary rounded"
                                />
                                <span class="text-theme-text-secondary text-sm">
                                  Badges
                                </span>
                              </label>
                              <label class="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={
                                    discordConfig.value.showGuild ?? true
                                  }
                                  onChange$={(e) => {
                                    discordConfig.value = {
                                      ...discordConfig.value,
                                      showGuild: (e.target as HTMLInputElement)
                                        .checked,
                                    };
                                  }}
                                  class="border-theme-card-border bg-theme-bg-secondary text-theme-accent-primary focus:ring-theme-accent-primary rounded"
                                />
                                <span class="text-theme-text-secondary text-sm">
                                  Guild
                                </span>
                              </label>
                            </div>

                            <div>
                              <label class="text-theme-text-secondary mb-2 block text-sm font-medium">
                                Refresh Interval (seconds)
                              </label>
                              <input
                                type="number"
                                min="10"
                                max="300"
                                value={discordConfig.value.refreshInterval}
                                onInput$={(e) => {
                                  const value = parseInt(
                                    (e.target as HTMLInputElement).value,
                                  );
                                  if (value >= 10 && value <= 300) {
                                    discordConfig.value = {
                                      ...discordConfig.value,
                                      refreshInterval: value,
                                    };
                                  }
                                }}
                                class={inputClasses}
                              />
                              <p class="text-theme-text-muted mt-1 text-xs">
                                How often to update Discord status (10-300
                                seconds)
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {!bioData.value.user.bioDiscordUserId && (
                    <div class="border-theme-card-border/50 bg-theme-bg-secondary/30 rounded-xl border p-4 text-center">
                      <div class="text-theme-text-muted mb-2">
                        <svg
                          class="mx-auto h-8 w-8"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.010c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                        </svg>
                      </div>
                      <p class="text-theme-text-secondary mb-2 text-sm font-medium">
                        Discord Not Connected
                      </p>
                      <p class="text-theme-text-muted text-xs">
                        Log in with Discord to display your real-time Discord
                        profile on your bio page. This will show your status,
                        current activity, and Spotify listening status.
                      </p>
                    </div>
                  )}
                  {/* Hidden fields */}
                  <input
                    type="hidden"
                    name="bioShowDiscord"
                    value={showDiscord.value ? "true" : "false"}
                  />
                  <input
                    type="hidden"
                    name="bioDiscordConfig"
                    value={JSON.stringify(discordConfig.value)}
                  />
                  <input
                    type="hidden"
                    name="bioUsername"
                    value={username.value}
                  />
                  <input
                    type="hidden"
                    name="bioDisplayName"
                    value={displayName.value}
                  />
                  <input
                    type="hidden"
                    name="bioDescription"
                    value={description.value}
                  />
                  <input
                    type="hidden"
                    name="bioProfileImage"
                    value={profileImage.value}
                  />
                  <input
                    type="hidden"
                    name="bioBackgroundImage"
                    value={backgroundImage.value}
                  />
                  <input
                    type="hidden"
                    name="bioBackgroundColor"
                    value={backgroundColor.value}
                  />
                  <input
                    type="hidden"
                    name="bioTextColor"
                    value={textColor.value}
                  />
                  <input
                    type="hidden"
                    name="bioAccentColor"
                    value={accentColor.value}
                  />
                  <input
                    type="hidden"
                    name="bioCustomCss"
                    value={customCss.value}
                  />
                  <input
                    type="hidden"
                    name="bioSpotifyTrack"
                    value={spotifyTrack.value}
                  />
                  <input
                    type="hidden"
                    name="bioIsPublic"
                    value={isPublic.value ? "true" : "false"}
                  />
                </Form>
              )}
            </div>
            {/* Background Effects */}
            <div class="glass rounded-2xl p-6">
              <button
                type="button"
                onClick$={() =>
                (backgroundEffectsCollapsed.value =
                  !backgroundEffectsCollapsed.value)
                }
                class="hover:bg-theme-bg-secondary/50 -m-2 mb-4 flex w-full items-center justify-between rounded-lg p-2 text-left transition-colors"
              >
                <h2 class="text-theme-text-primary flex items-center gap-2 text-xl font-semibold">
                  <Palette class="h-5 w-5" />
                  Background Effects
                </h2>
                {backgroundEffectsCollapsed.value ? (
                  <ChevronDown class="text-theme-text-muted h-5 w-5" />
                ) : (
                  <ChevronUp class="text-theme-text-muted h-5 w-5" />
                )}
              </button>

              {!backgroundEffectsCollapsed.value && (
                <div class="space-y-6">
                  {/* Gradient Configuration */}
                  <GradientConfigPanel
                    config={gradientConfig}
                    fallbackColor={backgroundColor.value}
                  />
                  {/* Particle Configuration */}
                  <ParticleConfigPanel
                    config={particleConfig}
                    previewEnabled={true}
                  />
                  {/* Save Background Effects */}
                  <Form action={updateBio}>
                    {/* Copy hidden fields */}
                    <input
                      type="hidden"
                      name="bioUsername"
                      value={username.value}
                    />
                    <input
                      type="hidden"
                      name="bioDisplayName"
                      value={displayName.value}
                    />
                    <input
                      type="hidden"
                      name="bioDescription"
                      value={description.value}
                    />
                    <input
                      type="hidden"
                      name="bioProfileImage"
                      value={profileImage.value}
                    />
                    <input
                      type="hidden"
                      name="bioBackgroundImage"
                      value={backgroundImage.value}
                    />
                    <input
                      type="hidden"
                      name="bioBackgroundColor"
                      value={backgroundColor.value}
                    />
                    <input
                      type="hidden"
                      name="bioTextColor"
                      value={textColor.value}
                    />
                    <input
                      type="hidden"
                      name="bioAccentColor"
                      value={accentColor.value}
                    />
                    <input
                      type="hidden"
                      name="bioCustomCss"
                      value={customCss.value}
                    />
                    <input
                      type="hidden"
                      name="bioSpotifyTrack"
                      value={spotifyTrack.value}
                    />
                    <input
                      type="hidden"
                      name="bioIsPublic"
                      value={isPublic.value ? "true" : "false"}
                    />
                    {/* Background effect configurations */}
                    <input
                      type="hidden"
                      name="bioGradientConfig"
                      value={JSON.stringify(gradientConfig.value)}
                    />
                    <input
                      type="hidden"
                      name="bioParticleConfig"
                      value={JSON.stringify(particleConfig.value)}
                    />
                  </Form>
                </div>
              )}
            </div>
            {/* Links Management */}
            <div class="glass rounded-2xl p-6">
              <button
                type="button"
                onClick$={() => (linksCollapsed.value = !linksCollapsed.value)}
                class="hover:bg-theme-bg-secondary/50 -m-2 mb-4 flex w-full items-center justify-between rounded-lg p-2 text-left transition-colors"
              >
                <h2 class="text-theme-text-primary flex items-center gap-2 text-xl font-semibold">
                  <LinkIcon class="h-5 w-5" />
                  Bio Links
                  <span class="text-theme-text-muted ml-2 text-sm">
                    ({bioData.value.bioLinks.length}/
                    {bioData.value.bioLimits.maxBioLinks})
                  </span>
                </h2>
                {linksCollapsed.value ? (
                  <ChevronDown class="text-theme-text-muted h-5 w-5" />
                ) : (
                  <ChevronUp class="text-theme-text-muted h-5 w-5" />
                )}
              </button>

              {!linksCollapsed.value && (
                <div>
                  <div class="mb-4 flex items-center justify-end">
                    <button
                      onClick$={() =>
                        (showNewLinkForm.value = !showNewLinkForm.value)
                      }
                      class={`btn-cute ${buttonClasses}`}
                      disabled={
                        bioData.value.bioLinks.length >=
                        bioData.value.bioLimits.maxBioLinks
                      }
                    >
                      <Plus class="h-4 w-4" />
                      Add Link
                    </button>
                  </div>
                  {/* Add New Link Form */}
                  {showNewLinkForm.value &&
                    bioData.value.bioLinks.length <
                    bioData.value.bioLimits.maxBioLinks && (
                      <div class="bg-theme-accent-primary/5 border-theme-accent-primary/20 mb-6 rounded-2xl border p-4">
                        <Form action={createBioLink}>
                          <div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                              <label class="text-theme-text-secondary mb-1 block text-xs">
                                Title (max
                                {bioData.value.bioLimits.maxLinkTitleLength})
                              </label>
                              <input
                                type="text"
                                name="title"
                                placeholder="Link Title"
                                maxLength={
                                  bioData.value.bioLimits.maxLinkTitleLength
                                }
                                required
                                class={inputClasses}
                              />
                            </div>
                            <div>
                              <label class="text-theme-text-secondary mb-1 block text-xs">
                                URL (max {bioData.value.bioLimits.maxUrlLength})
                              </label>
                              <input
                                type="url"
                                name="url"
                                placeholder="https://example.com"
                                maxLength={bioData.value.bioLimits.maxUrlLength}
                                required
                                class={inputClasses}
                              />
                            </div>
                          </div>
                          <div class="mb-4">
                            <label class="text-theme-text-secondary mb-1 block text-xs">
                              Icon (max {bioData.value.bioLimits.maxIconLength})
                            </label>
                            <IconSelector
                              selectedIcon={newLinkIcon.value}
                              onIconSelect={$((icon) => {
                                newLinkIcon.value = icon;
                              })}
                            />
                            <input
                              type="hidden"
                              name="icon"
                              value={newLinkIcon.value}
                            />
                          </div>
                          <div class="flex gap-2">
                            <button
                              type="submit"
                              class={`btn-cute ${buttonClasses}`}
                            >
                              <Plus class="h-4 w-4" />
                              Add Link
                            </button>
                            <button
                              type="button"
                              onClick$={resetNewLinkForm}
                              class={`btn-secondary ${buttonClasses}`}
                            >
                              <X class="h-4 w-4" />
                              Cancel
                            </button>
                          </div>
                        </Form>
                      </div>
                    )}
                  {/* Max links reached message */}
                  {bioData.value.bioLinks.length >=
                    bioData.value.bioLimits.maxBioLinks && (
                      <div class="mb-6 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4">
                        <p class="text-sm text-orange-400">
                          You've reached your maximum bio links limit (
                          {bioData.value.bioLimits.maxBioLinks}).
                          {bioData.value.bioLinks.length > 0 &&
                            " Delete some links to add new ones."}
                        </p>
                      </div>
                    )}
                  {/* Existing Links */}
                  <div class="space-y-3">
                    {bioData.value.bioLinks.map((link) => (
                      <div
                        key={link.id}
                        class="glass flex items-center gap-3 rounded-2xl p-3"
                      >
                        <div class="cursor-move">
                          <GripVertical class="text-theme-text-muted h-4 w-4" />
                        </div>

                        {editingLink.value === link.id ? (
                          <Form action={updateBioLink} class="flex-1">
                            <input type="hidden" name="id" value={link.id} />
                            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <input
                                type="text"
                                name="title"
                                value={link.title}
                                class={`${inputClasses} text-sm`}
                              />
                              <input
                                type="url"
                                name="url"
                                value={link.url}
                                class={`${inputClasses} text-sm`}
                              />
                            </div>
                            <div class="mt-2">
                              <IconSelector
                                selectedIcon={
                                  editingLinkIcons.value[link.id] ??
                                  link.icon ??
                                  ""
                                }
                                onIconSelect={$((icon) => {
                                  editingLinkIcons.value = {
                                    ...editingLinkIcons.value,
                                    [link.id]: icon,
                                  };
                                })}
                              />
                              <input
                                type="hidden"
                                name="icon"
                                value={
                                  editingLinkIcons.value[link.id] ??
                                  link.icon ??
                                  ""
                                }
                              />
                            </div>
                            <input
                              type="hidden"
                              name="isActive"
                              value={link.isActive ? "true" : "false"}
                            />
                            <div class="mt-2 flex gap-2">
                              <button
                                type="submit"
                                class="btn-cute rounded-lg px-3 py-1 text-sm"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick$={() => (editingLink.value = null)}
                                class="btn-secondary rounded-lg px-3 py-1 text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </Form>
                        ) : (
                          <>
                            <div class="max-w-4/5 flex-1">
                              <div class="flex items-center gap-2">
                                <BioLinkIcon
                                  icon={link.icon}
                                  size={16}
                                  class="flex-shrink-0"
                                />
                                <span class="text-theme-text-primary font-medium">
                                  {link.title}
                                </span>
                              </div>
                              <div class="text-theme-text-secondary truncate text-sm">
                                {link.url}
                              </div>
                              <div class="text-theme-text-muted text-xs">
                                {link.clicks} clicks
                              </div>
                            </div>
                            <div class="flex gap-2">
                              <button
                                onClick$={() => (editingLink.value = link.id)}
                                class="hover:bg-theme-accent-primary/10 rounded-lg p-2 transition-all"
                              >
                                <Edit class="text-theme-text-muted h-4 w-4" />
                              </button>
                              <Form action={deleteBioLink}>
                                <input
                                  type="hidden"
                                  name="id"
                                  value={link.id}
                                />
                                <button
                                  type="submit"
                                  class="rounded-lg p-2 transition-all hover:bg-red-500/10"
                                >
                                  <Trash2 class="h-4 w-4 text-red-400" />
                                </button>
                              </Form>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                    {bioData.value.bioLinks.length === 0 && (
                      <div class="text-theme-text-muted py-8 text-center">
                        <LinkIcon class="mx-auto mb-3 h-12 w-12 opacity-50" />
                        <p>No links added yet</p>
                        <p class="text-sm">Click "Add Link" to get started</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {bioData.value.analytics && (
              <div class="glass rounded-2xl p-6">
                <button
                  type="button"
                  onClick$={() =>
                    (analyticsCollapsed.value = !analyticsCollapsed.value)
                  }
                  class="hover:bg-theme-bg-secondary/50 -m-2 mb-4 flex w-full items-center justify-between rounded-lg p-2 text-left transition-colors"
                >
                  <h2 class="text-theme-text-primary flex items-center gap-2 text-xl font-semibold">
                    <BarChart3 class="h-5 w-5" />
                    Analytics (Last 7 Days)
                  </h2>
                  {analyticsCollapsed.value ? (
                    <ChevronDown class="text-theme-text-muted h-5 w-5" />
                  ) : (
                    <ChevronUp class="text-theme-text-muted h-5 w-5" />
                  )}
                </button>

                {!analyticsCollapsed.value && (
                  <div>
                    <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                      <div class="text-center">
                        <div class="text-theme-accent-primary text-2xl font-bold">
                          {bioData.value.user.bioViews}
                        </div>
                        <div class="text-theme-text-secondary text-sm">
                          Total Views
                        </div>
                      </div>
                      <div class="text-center">
                        <div class="text-theme-accent-primary text-2xl font-bold">
                          {bioData.value.analytics.totalViews}
                        </div>
                        <div class="text-theme-text-secondary text-sm">
                          Recent Views
                        </div>
                      </div>
                      <div class="text-center">
                        <div class="text-theme-accent-primary text-2xl font-bold">
                          {bioData.value.analytics.uniqueIPs}
                        </div>
                        <div class="text-theme-text-secondary text-sm">
                          Unique Visitors
                        </div>
                      </div>
                    </div>

                    {bioData.value.analytics.topLinks.length > 0 && (
                      <div>
                        <h3 class="text-theme-text-primary mb-3 font-medium">
                          Top Links
                        </h3>
                        <div class="space-y-2">
                          {bioData.value.analytics.topLinks
                            .slice(0, 5)
                            .map((link) => (
                              <div
                                key={link.id}
                                class="bg-theme-accent-primary/5 flex items-center justify-between rounded-lg p-2"
                              >
                                <span class="text-theme-text-primary text-sm font-medium">
                                  {link.title}
                                </span>
                                <span class="text-theme-text-secondary text-sm">
                                  {link.clicks} clicks
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div class="sticky top-8">
            <div class="glass rounded-2xl p-6">
              <div class="mb-4 flex items-center justify-between">
                <h2 class="text-theme-text-primary flex items-center gap-2 text-xl font-semibold">
                  <Eye class="h-5 w-5" />
                  Preview
                </h2>
                {bioData.value.user.bioUsername &&
                  bioData.value.user.bioIsPublic && (
                    <Link
                      href={`/${bioData.value.user.bioUsername}`}
                      class="text-theme-accent-primary hover:text-theme-accent-primary/80 flex items-center gap-2 transition-colors"
                    >
                      <ExternalLink class="h-4 w-4" />
                      View Live
                    </Link>
                  )}
              </div>
              {/* Bio Preview */}
              <div class="border-theme-card-border relative overflow-hidden rounded-2xl border">
                <BioPageDisplay
                  bioData={previewBioData.value}
                  isPreview={true}
                  class="relative z-10 !min-h-1/3"
                />
              </div>
              {!bioData.value.user.bioUsername && (
                <div class="mt-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                  <p class="text-sm text-yellow-400">
                    Set a username to make your bio page accessible to others
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Save/Reset Bar */}
        {hasChanges.value && (
          <div class="border-theme-card-border bg-theme-bg/80 fixed right-0 bottom-0 left-0 z-50 border-t p-4 backdrop-blur-lg">
            <div class="container mx-auto flex items-center justify-between">
              <div class="text-theme-text-secondary text-sm">
                You have unsaved changes
              </div>
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  onClick$={resetToOriginal}
                  class="btn-secondary flex items-center gap-2 rounded-2xl px-6 py-3 font-medium transition-all duration-300"
                >
                  <X class="h-4 w-4" />
                  Reset
                </button>
                <Form action={updateBio}>
                  {/* All form fields as hidden inputs */}
                  <input
                    type="hidden"
                    name="bioUsername"
                    value={username.value}
                  />
                  <input
                    type="hidden"
                    name="bioDisplayName"
                    value={displayName.value}
                  />
                  <input
                    type="hidden"
                    name="bioDescription"
                    value={description.value}
                  />
                  <input
                    type="hidden"
                    name="bioProfileImage"
                    value={profileImage.value}
                  />
                  <input
                    type="hidden"
                    name="bioBackgroundImage"
                    value={backgroundImage.value}
                  />
                  <input
                    type="hidden"
                    name="bioBackgroundColor"
                    value={backgroundColor.value}
                  />
                  <input
                    type="hidden"
                    name="bioTextColor"
                    value={textColor.value}
                  />
                  <input
                    type="hidden"
                    name="bioAccentColor"
                    value={accentColor.value}
                  />
                  <input
                    type="hidden"
                    name="bioCustomCss"
                    value={customCss.value}
                  />
                  <input
                    type="hidden"
                    name="bioSpotifyTrack"
                    value={spotifyTrack.value}
                  />
                  <input
                    type="hidden"
                    name="bioIsPublic"
                    value={isPublic.value ? "true" : "false"}
                  />
                  <input
                    type="hidden"
                    name="bioGradientConfig"
                    value={JSON.stringify(gradientConfig.value)}
                  />
                  <input
                    type="hidden"
                    name="bioParticleConfig"
                    value={JSON.stringify(particleConfig.value)}
                  />
                  <input
                    type="hidden"
                    name="bioShowDiscord"
                    value={showDiscord.value ? "true" : "false"}
                  />
                  <input
                    type="hidden"
                    name="bioDiscordConfig"
                    value={JSON.stringify(discordConfig.value)}
                  />
                  <button
                    type="submit"
                    class="btn-cute flex items-center gap-2 rounded-2xl px-6 py-3 font-medium transition-all duration-300"
                  >
                    <Save class="h-4 w-4" />
                    Save All Changes
                  </button>
                </Form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Bio Page Builder - twink.forsale",
  meta: [
    {
      name: "description",
      content: "Create your custom bio link page",
    },
  ],
};
