import { component$, isDev } from "@builder.io/qwik";
import { QwikCityProvider, RouterOutlet } from "@builder.io/qwik-city";
import { RouterHead } from "./components/router-head";
import { useThemeProvider } from "./lib/theme-store";
import { useAlertProvider } from "./lib/alert-store";
import { useGlobalParticleProvider } from "./lib/global-particle-store";
import { AlertContainer } from "./components/alert";

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

  // Initialize alert provider
  useAlertProvider();

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
            <script defer src="https://umami.bwmp.dev/script.js" data-website-id="bb1fc7c0-9baf-43d2-a16d-dcb5c6138617" />
          </>
        )}
        <RouterHead />
      </head>
      <body
        lang="en"
        style="background-color: var(--theme-bg-primary); color: var(--theme-text-primary);"
      >
        <RouterOutlet />
        <AlertContainer />
      </body>
    </QwikCityProvider>
  );
});
