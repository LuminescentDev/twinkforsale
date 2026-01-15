import {
  component$,
  Slot,
  useStore,
  useContextProvider,
  $,
  useVisibleTask$,
} from "@builder.io/qwik";
import { routeLoader$, useLocation } from "@builder.io/qwik-city";
import { ImagePreview } from "~/components/layout/image-preview";
import {
  ImagePreviewContext,
  type ImagePreviewStore,
} from "~/lib/image-preview-store";
import Navigation from "~/components/layout/navigation";
import { Footer } from "~/components/layout/footer";
import { ParticleBackground } from "~/components/effects/particle-background";
import { useGlobalParticle } from "~/lib/global-particle-store";
import {
  getServerThemePreference,
  getThemePreference,
} from "~/lib/cookie-utils";
import { generateThemeCSS, themes } from "~/lib/theme-store";

export const useServerTheme = routeLoader$(async (requestEvent) => {
  const cookieHeader = requestEvent.request.headers.get("cookie");
  const serverTheme = getServerThemePreference(cookieHeader || "") || "auto";
  const themeCSS = generateThemeCSS(serverTheme);

  return {
    theme: serverTheme,
    css: themeCSS,
  };
});

export default component$(() => {
  // Get server-side theme data
  const serverThemeData = useServerTheme();
  const location = useLocation();
  const globalParticle = useGlobalParticle();

  // Check if this is a bio page (username route)
  const isBioPage =
    location.url.pathname.match(/^\/[^/]+\/?$/) &&
    !location.url.pathname.startsWith("/dashboard") &&
    !location.url.pathname.startsWith("/admin") &&
    !location.url.pathname.startsWith("/setup") &&
    !location.url.pathname.startsWith("/f/") &&
    !location.url.pathname.startsWith("/upload") &&
    location.url.pathname !== "/";
  // Apply server-side theme only on initial load to prevent flash
  // Don't track serverThemeData to avoid overriding client-side theme changes on navigation
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    if (typeof document !== "undefined" && serverThemeData.value) {
      const root = document.documentElement;

      // Only apply server theme if no client theme is already set
      const currentThemeVariant = root.getAttribute("data-theme-variant");
      if (!currentThemeVariant || currentThemeVariant === "undefined") {
        const { theme, css } = serverThemeData.value;

        // Apply CSS variables immediately
        const cssVars = css.split("\n    ").filter((line) => line.trim());
        cssVars.forEach((cssVar) => {
          if (cssVar.includes(":")) {
            const [property, value] = cssVar.split(":").map((s) => s.trim());
            if (property && value) {
              root.style.setProperty(property, value.replace(";", ""));
            }
          }
        });

        // Set data attributes immediately
        const effectiveTheme = theme === "auto" ? "dark" : theme;
        root.setAttribute("data-theme", effectiveTheme);
        root.setAttribute("data-theme-variant", theme);
      }
    }
  });
  // Ensure theme persistence across page navigations
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      const currentThemeVariant = root.getAttribute("data-theme-variant");

      // If no theme is set or if we need to check cookies for user preference
      if (!currentThemeVariant || currentThemeVariant === "undefined") {
        try {
          const savedTheme = await getThemePreference();
          if (savedTheme && themes[savedTheme]) {
            let effectiveTheme = savedTheme;
            if (savedTheme === "auto") {
              effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)")
                .matches
                ? "dark"
                : "light";
            }

            const themeColors = themes[effectiveTheme as keyof typeof themes];
            Object.entries(themeColors).forEach(([key, value]) => {
              const cssVarName = `--theme-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
              root.style.setProperty(cssVarName, value);
            });

            root.setAttribute("data-theme", effectiveTheme);
            root.setAttribute("data-theme-variant", savedTheme);
          }
        } catch (error) {
          console.warn("Failed to load theme preference:", error);
        }
      }
    }
  });

  // Global image preview store
  const imagePreviewStore = useStore({
    state: {
      isOpen: false,
      imageUrl: "",
      imageName: "",
    },
  });

  const openPreview = $((url: string, name?: string) => {
    imagePreviewStore.state.imageUrl = url;
    imagePreviewStore.state.imageName = name || "";
    imagePreviewStore.state.isOpen = true;
    // Prevent body scroll when modal is open
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
    }
  });

  const closePreview = $(() => {
    imagePreviewStore.state.isOpen = false;
    imagePreviewStore.state.imageUrl = "";
    imagePreviewStore.state.imageName = "";
    // Restore body scroll
    if (typeof document !== "undefined") {
      document.body.style.overflow = "unset";
    }
  });

  const contextStore: ImagePreviewStore = {
    state: imagePreviewStore.state,
    openPreview,
    closePreview,
  };

  // Provide the context
  useContextProvider(ImagePreviewContext, contextStore);
  return (
    <>
      {/* Inject server-side theme CSS to prevent flashing */}
      {serverThemeData.value?.css && (
        <style
          dangerouslySetInnerHTML={`
          :root {
            ${serverThemeData.value.css}
          }
        `}
        />
      )}

      {isBioPage ? (
        // Bio page layout - minimal, no navigation or background
        <div class="min-h-screen">
          <Slot />

          {/* Image Preview Modal for bio pages */}
          <ImagePreview
            isOpen={contextStore.state.isOpen}
            imageUrl={contextStore.state.imageUrl}
            imageName={contextStore.state.imageName}
            onClose={closePreview}
          />
        </div>
      ) : (
        // Regular site layout with navigation and background
        <div
          class="relative min-h-screen overflow-hidden"
          style="background: linear-gradient(135deg, var(--theme-bg-gradient-from), var(--theme-bg-gradient-via), var(--theme-bg-gradient-to))"        >
          {" "}
          {/* Particle background - rendered behind everything */}
          {globalParticle.isInitialized && globalParticle.config.enabled && (
            <ParticleBackground config={globalParticle.config} />
          )}          <Navigation />
          <div class="relative z-10 mx-auto mt-18 max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <Slot />
          </div>
          <Footer />
          {/* Global Image Preview Modal */}
          <ImagePreview
            isOpen={contextStore.state.isOpen}
            imageUrl={contextStore.state.imageUrl}
            imageName={contextStore.state.imageName}
            onClose={closePreview}
          />
        </div>
      )}
    </>
  );
});
