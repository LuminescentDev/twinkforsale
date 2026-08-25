import { component$, isDev } from "@builder.io/qwik";
import { QwikCityProvider, RouterOutlet } from "@builder.io/qwik-city";
import { RouterHead } from "./components/router-head";
import { useThemeProvider } from "./lib/theme-store";
import { useToastProvider } from "./lib/toast-store";
import { useGlobalParticleProvider } from "./lib/global-particle-store";
import { Toaster } from "./components/ui";

import "./global.css";

export default component$(() => {
  /**
   * The root of a QwikCity site always start with the <QwikCityProvider> component,
   * immediately followed by the document's <head> and <body>.
   *
   * Don't remove the `<head>` and `<body>` elements.
   */

  // Initialize theme provider
  useThemeProvider();

  // Status/toast announcements
  useToastProvider();

  // Initialize global particle provider
  useGlobalParticleProvider();

  return (
    <QwikCityProvider>
      <head>
        <meta charset="utf-8" />
        {!isDev && (
          <>
            <link
              rel="manifest"
              href={`${import.meta.env.BASE_URL}manifest.json`}
            />
            <script
              defer
              src="https://umami.bwmp.dev/script.js"
              data-website-id="999be449-668c-4557-a5bd-6b8a27eb28e1"
            />
          </>
        )}
        <RouterHead />
      </head>
      <body
        lang="en"
        style="background-color: var(--ui-canvas); color: var(--ui-ink);"
      >
        <RouterOutlet />
        <Toaster />
      </body>
    </QwikCityProvider>
  );
});
