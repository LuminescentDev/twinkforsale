/**
 * WHAT IS THIS FILE?
 *
 * SSR entry point, in all cases the application is rendered outside the browser, this
 * entry point will be the common one.
 *
 * - Server (express, cloudflare...)
 * - npm run start
 * - npm run preview
 * - npm run build
 *
 */
import {
  renderToStream,
  type RenderToStreamOptions,
} from "@builder.io/qwik/server";
import Root from "./root";

export default function (opts: RenderToStreamOptions) {
  // Ensure environment variables are available in SSR context
  const serverData = {
    ...opts.serverData,
    env: {
      BASE_URL: process.env.BASE_URL || "https://twink.forsale",
      UPLOAD_DIR: process.env.UPLOAD_DIR || "./uploads",
      MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || "10485760",
      ALLOWED_MIME_TYPES:
        process.env.ALLOWED_MIME_TYPES ||
        "image/png,image/jpeg,image/gif,image/webp,text/plain,application/pdf",
      NODE_ENV: process.env.NODE_ENV || "development",
    },
  };

  return renderToStream(<Root />, {
    ...opts,
    // Use container attributes to set attributes on the html tag.
    containerAttributes: {
      lang: "en-us",
      ...opts.containerAttributes,
    },
    serverData,
  });
}
