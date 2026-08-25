import {
  component$,
  Slot,
  useStore,
  useContextProvider,
  $,
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
  getServerSidebarCollapsed,
} from "~/lib/cookie-utils";
import { generateThemeCSS, generateAutoLightCSS } from "~/lib/theme-store";
import { getCurrentUser } from "~/lib/auth-client";

/**
 * Root-level current-user loader. Available to every route and component via
 * the exported `useCurrentUser` hook. Resolves the signed-in user from the
 * backend (`/auth/me`) by forwarding the request cookie; returns `null`
 * when unauthenticated.
 */
export const useCurrentUser = routeLoader$(async (requestEvent) => {
  return getCurrentUser({
    cookie: requestEvent.request.headers.get("cookie"),
  });
});

/**
 * Restore the rail collapsed state from the request cookie so the shell
 * renders at the correct width on first paint.
 */
export const useSidebarState = routeLoader$((requestEvent) => {
  const cookieHeader = requestEvent.request.headers.get("cookie");
  return { collapsed: getServerSidebarCollapsed(cookieHeader || undefined) };
});

export const useServerTheme = routeLoader$((requestEvent) => {
  const cookieHeader = requestEvent.request.headers.get("cookie");
  const theme = getServerThemePreference(cookieHeader || "") || "auto";
  return {
    theme,
    css: generateThemeCSS(theme),
    // `auto` cannot be resolved server-side, so the Light palette ships as a
    // media-query override and applies before hydration when the system asks
    // for it. Fixed themes need no override.
    autoLightCss: theme === "auto" ? generateAutoLightCSS() : null,
  };
});

export default component$(() => {
  const serverTheme = useServerTheme();
  const location = useLocation();
  const globalParticle = useGlobalParticle();

  const pathname = location.url.pathname;

  const publicPages = new Set([
    "/acceptable-use",
    "/dmca",
    "/privacy",
    "/terms",
  ]);

  // A public bio page: a single non-reserved path segment.
  const isBioPage =
    !!pathname.match(/^\/[^/]+\/?$/) &&
    !pathname.startsWith("/dashboard") &&
    !pathname.startsWith("/setup") &&
    !pathname.startsWith("/f/") &&
    !pathname.startsWith("/upload") &&
    !publicPages.has(pathname.replace(/\/$/, "")) &&
    pathname !== "/";

  // Signed-in application routes render their own shell.
  const isAppPage = ["/dashboard", "/upload", "/setup"].some(
    (r) => pathname === r || pathname.startsWith(r + "/"),
  );

  const imagePreviewStore = useStore({
    state: { isOpen: false, imageUrl: "", imageName: "" },
  });

  const openPreview = $((url: string, name?: string) => {
    imagePreviewStore.state.imageUrl = url;
    imagePreviewStore.state.imageName = name || "";
    imagePreviewStore.state.isOpen = true;
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
    }
  });

  const closePreview = $(() => {
    imagePreviewStore.state.isOpen = false;
    imagePreviewStore.state.imageUrl = "";
    imagePreviewStore.state.imageName = "";
    if (typeof document !== "undefined") {
      document.body.style.overflow = "unset";
    }
  });

  const contextStore: ImagePreviewStore = {
    state: imagePreviewStore.state,
    openPreview,
    closePreview,
  };

  useContextProvider(ImagePreviewContext, contextStore);

  const previewModal = (
    <ImagePreview
      isOpen={contextStore.state.isOpen}
      imageUrl={contextStore.state.imageUrl}
      imageName={contextStore.state.imageName}
      onClose={closePreview}
    />
  );

  return (
    <>
      {/* Palette applied during SSR so the first paint is already correct. */}
      <style
        dangerouslySetInnerHTML={`:root {\n    ${serverTheme.value.css}\n  }${
          serverTheme.value.autoLightCss
            ? `\n  @media (prefers-color-scheme: light) {\n    :root:not([data-palette]) {\n    ${serverTheme.value.autoLightCss}\n    }\n  }`
            : ""
        }`}
      />

      {isBioPage ? (
        <div class="min-h-screen">
          <Slot />
          {previewModal}
        </div>
      ) : isAppPage ? (
        // Signed-in application. Particles sit behind the shell, subdued and
        // non-interactive; the shell owns its own navigation and gutters.
        <div class="bg-canvas text-ink relative min-h-screen">
          {globalParticle.isInitialized && globalParticle.config.enabled && (
            <ParticleBackground config={globalParticle.config} />
          )}
          <div class="relative z-10">
            <Slot />
          </div>
          {previewModal}
        </div>
      ) : (
        <div class="bg-canvas text-ink relative flex min-h-screen flex-col">
          {globalParticle.isInitialized && globalParticle.config.enabled && (
            <ParticleBackground config={globalParticle.config} />
          )}
          <a
            href="#main-content"
            class="focus-ring bg-surface text-ink rounded-control border-edge fixed top-2 left-2 z-50 -translate-y-16 border px-3 py-2 text-sm focus:translate-y-0"
          >
            Skip to content
          </a>
          <Navigation />
          <main id="main-content" class="relative z-10 flex-1">
            <Slot />
          </main>
          <Footer />
          {previewModal}
        </div>
      )}
    </>
  );
});
