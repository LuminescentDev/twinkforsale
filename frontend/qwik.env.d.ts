// This file can be used to add references for global types like `vite/client`.

// Add global `vite/client` types. For more info, see: https://vitejs.dev/guide/features#client-types
/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Base URL of the C# backend API. Empty string ("") means same-origin,
   * which is correct in production where /auth, /uploads, /admin, /analytics, /f and /l are proxied to the
   * backend. In local dev this points at the running backend, e.g.
   * http://localhost:5000.
   */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
