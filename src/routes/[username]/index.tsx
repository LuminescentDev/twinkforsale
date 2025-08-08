import { component$, $ } from "@builder.io/qwik";
import { routeLoader$, routeAction$, z, zod$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Eye } from "lucide-icons-qwik";
import { getBioPageByUsername, trackBioView, trackLinkClick } from "~/lib/bio";
import { BioPageDisplay, type BioPageData } from "~/components/bio/bio-page-display";
import { getGradientCSS, type GradientConfig } from "~/components/ui/gradient-config-panel";

export const useBioPage = routeLoader$(async (requestEvent) => {
  const username = requestEvent.params.username;
  
  if (!username) {
    throw requestEvent.redirect(302, "/");
  }

  const bioPage = await getBioPageByUsername(username);
  
  if (!bioPage) {
    throw requestEvent.redirect(302, "/?error=bio_not_found");
  }

  // Track the view
  const clientIP = requestEvent.clientConn?.ip || 
    requestEvent.headers.get("x-forwarded-for") || 
    requestEvent.headers.get("x-real-ip") || 
    "unknown";
    
  const userAgent = requestEvent.headers.get("user-agent") || undefined;
  const referer = requestEvent.headers.get("referer") || undefined;

  // Track view in background
  trackBioView(username, clientIP, userAgent, referer).catch(console.error);

  return {
    bioPage,
    username,
  };
});

export const useLinkClickAction = routeAction$(async (data) => {
  const linkId = data.linkId as string;
  
  if (!linkId) {
    return { success: false, error: "Link ID is required" };
  }

  try {
    await trackLinkClick(linkId);
    return { success: true };
  } catch (error) {
    console.error("Error tracking link click:", error);
    return { success: false, error: "Failed to track click" };
  }
}, zod$({
  linkId: z.string()
}));

export default component$(() => {
  const bioData = useBioPage();
  const linkClickAction = useLinkClickAction();
  const { bioPage } = bioData.value;
  
  const handleLinkClick = $(async (linkId: string) => {
    // Track the click using the route action
    if (linkId) {
      linkClickAction.submit({ linkId }).catch(console.error);
    }  });

  // Parse and process gradient configuration
  const parseGradientConfig = (): GradientConfig | null => {
    try {
      if (bioPage.gradientConfig) {
        return JSON.parse(bioPage.gradientConfig);
      }
    } catch (e) {
      console.warn("Failed to parse gradient config:", e);
    }
    return null;
  };

  const gradientConfig = parseGradientConfig();
  const baseBackgroundColor = bioPage.backgroundColor || '#8B5CF6';
  const finalBackgroundColor = gradientConfig?.enabled 
    ? getGradientCSS(gradientConfig, baseBackgroundColor)
    : baseBackgroundColor;
  // Convert bioPage data to BioPageData format
  const bioDisplayData: BioPageData = {
    displayName: bioPage.displayName || `@${bioPage.username}`,
    description: bioPage.description,
    profileImage: bioPage.profileImage,
    backgroundImage: bioPage.backgroundImage,
    backgroundColor: finalBackgroundColor,
    textColor: bioPage.textColor || '#FFFFFF',
    accentColor: bioPage.accentColor || '#F59E0B',
    customCss: bioPage.customCss,
    spotifyTrack: bioPage.spotifyTrack,
    gradientConfig: bioPage.gradientConfig,
    particleConfig: bioPage.particleConfig,
    discordUserId: bioPage.discordUserId,
    showDiscord: bioPage.showDiscord,
    discordConfig: bioPage.discordConfig,
    bioLinks: bioPage.links.map(link => ({
      id: link.id!,
      userId: '', // Not needed for display
      title: link.title,
      url: link.url,
      icon: link.icon || null,
      order: link.order,
      isActive: link.isActive,
      clicks: 0, // We don't track clicks in the link data structure, using 0 as default
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  };

  return (
    <div class="min-h-screen">
      <BioPageDisplay 
        bioData={bioDisplayData}
        isPreview={false}
        onLinkClick={handleLinkClick}
      />
      
      {/* View Counter */}
      <div class="fixed bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1 text-white text-sm flex items-center gap-2">
        <Eye class="w-4 h-4" />
        <span>{bioPage.views.toLocaleString()} views</span>
      </div>
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const bioData = resolveValue(useBioPage);
  const { bioPage } = bioData;

  return {
    title: `${bioPage.displayName || `@${bioPage.username}`} - Bio Links`,
    meta: [
      {
        name: "description",
        content: bioPage.description || `Check out ${bioPage.displayName || bioPage.username}'s bio links`,
      },
      {
        property: "og:title",
        content: bioPage.displayName || `@${bioPage.username}`,
      },
      {
        property: "og:description",
        content: bioPage.description || `Check out ${bioPage.displayName || bioPage.username}'s bio links`,
      },
      {
        property: "og:image",
        content: bioPage.profileImage || "/favicon.ico",
      },
      {
        property: "og:type",
        content: "profile",
      },
      {
        name: "twitter:card",
        content: "summary",
      },
      {
        name: "twitter:title",
        content: bioPage.displayName || `@${bioPage.username}`,
      },
      {
        name: "twitter:description",
        content: bioPage.description || `Check out ${bioPage.displayName || bioPage.username}'s bio links`,
      },
      {
        name: "twitter:image",
        content: bioPage.profileImage || "/favicon.ico",
      },
      {
        name: "theme-color",
        content: bioPage.accentColor,
      },
    ],
  };
};
