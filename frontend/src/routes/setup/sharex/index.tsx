import { component$, $, useSignal } from "@builder.io/qwik";
import { routeLoader$, server$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Camera, Key, Sparkle, Shield } from "lucide-icons-qwik";
import { SelectMenu } from "@luminescent/ui-qwik";
import {
  generateShareXConfig,
  downloadShareXConfig,
  getRecommendedVersion,
  SHAREX_VERSIONS,
  type ShareXVersion,
} from "~/lib/sharex-config";
export const useUserApiKeys = routeLoader$(async (requestEvent) => {
  const user = requestEvent.sharedMap.get("user");

  if (!user) {
    throw requestEvent.redirect(302, "/");
  }

  const apiUrl = process.env.API_URL || "http://localhost:5000";
  const cookies = requestEvent.request.headers.get("cookie") || "";
  let apiKey: { id: string; name: string; key: string; createdAt: string } | null = null;
  try {
    const response = await fetch(`${apiUrl}/api/api-keys/latest`, {
      headers: { Cookie: cookies }
    });
    if (response.ok) {
      apiKey = await response.json();
    }
  } catch {
    apiKey = null;
  }

  // Get the base URL from the request
  const baseUrl = requestEvent.url.origin;
  return { user, baseUrl, apiKey };
});

export const createApiKey = server$(async function (name: string) {
  const user = this.sharedMap.get("user");

  if (!user) {
    throw new Error("Not authenticated");
  }
  if (!user.isApproved) {
    throw new Error(
      "Account pending approval. Please wait for admin approval before creating API keys.",
    );
  }

  const apiUrl = process.env.API_URL || "http://localhost:5000";
  const cookies = this.request.headers.get("cookie") || "";

  const response = await fetch(`${apiUrl}/api/api-keys`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookies,
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to create API key");
  }

  return response.json();
});

export default component$(() => {
  const userData = useUserApiKeys();
  const selectedVersion = useSignal<ShareXVersion>(getRecommendedVersion());

  const handleCreateApiKey = $(async () => {
    try {
      await createApiKey("ShareX API Key");
      window.location.reload();
    } catch (error) {
      console.error("Failed to create API key:", error);
      alert("Failed to create API key");
    }
  });

  const handleDownloadConfig = $((apiKey: string) => {
    const config = generateShareXConfig({
      apiKey,
      baseUrl: userData.value.baseUrl,
      version: selectedVersion.value,
    });
    downloadShareXConfig(config);
  });

  return (
    <>
      <div class="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-12 lg:px-8">
        <div class="mb-8 text-center sm:mb-12">
          <h1 class="text-gradient-cute mb-4 flex items-center justify-center gap-2 text-2xl font-bold sm:text-3xl md:text-4xl">
            ShareX Setup~
            <Camera class="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10" />
          </h1>{" "}
          <p class="text-theme-text-secondary px-2 text-lg sm:text-xl">
            Configure ShareX to work with twink.forsale in just a few clicks!
            (◕‿◕)♡
          </p>
        </div>{" "}
        {/* Step 1: API Key */}
        <div class="card-cute mb-6 rounded-2xl p-4 sm:mb-8 sm:rounded-3xl sm:p-6 md:p-8">
          <div class="flex flex-col items-start gap-4 sm:flex-row">
            {" "}
            <div class="bg-gradient-to-br from-theme-accent-primary to-theme-accent-secondary text-theme-text-primary pulse-soft flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold sm:h-10 sm:w-10 sm:text-base">
              1
            </div>
            <div class="w-full flex-1">
              <h2 class="text-gradient-cute mb-3 flex flex-col items-start gap-2 text-xl font-bold sm:mb-4 sm:flex-row sm:items-center sm:text-2xl">
                <span>Get Your API Key~</span>
                <div class="flex items-center gap-1">
                  <Key class="h-4 w-4 sm:h-6 sm:w-6" />
                  <Sparkle class="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </h2>{" "}
              {userData.value.apiKey ? (
                <div class="space-y-3 sm:space-y-4">
                  {[userData.value.apiKey].map((apiKey) => (
                    <div
                      key={apiKey.id}
                      class="glass border-theme-card-border hover:border-theme-accent-primary/40 flex flex-col gap-4 rounded-xl border p-3 transition-all duration-300 sm:rounded-2xl sm:p-4"
                    >
                      {/* API Key Info */}
                      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div class="min-w-0 flex-1">
                          <p class="text-theme-text-primary flex items-center gap-2 text-sm font-medium sm:text-base">
                            <Shield class="h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
                            <span class="truncate">{apiKey.name}</span>
                          </p>
                          <p class="text-theme-text-secondary mt-1 rounded bg-black/20 px-2 py-1 font-mono text-xs break-all sm:text-sm">
                            {apiKey.key}
                          </p>
                        </div>
                        
                        {/* Version Selector */}
                        <div class="flex flex-col gap-1 sm:min-w-[200px]">
                          <label class="text-theme-text-secondary flex items-center gap-1 text-xs font-medium">
                            <Sparkle class="h-3 w-3" />
                            <span>Version</span>
                          </label>
                          <SelectMenu
                            id={`sharex-version-${apiKey.id}`}
                            values={Object.entries(SHAREX_VERSIONS).map(([version, info]) => ({
                              name: (
                                <div class="flex items-center justify-between w-full">
                                  <span>{info.label}</span>
                                  {info.recommended && <span class="text-yellow-400">⭐</span>}
                                </div>
                              ),
                              value: version,
                            }))}
                            value={selectedVersion.value}
                            onChange$={(e, el) => {
                              selectedVersion.value = el.value as ShareXVersion;
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Download Button */}
                      <button
                        onClick$={() => handleDownloadConfig(apiKey.key)}
                        class="btn-cute w-full rounded-full px-4 py-2 text-sm font-medium text-white sm:px-6 sm:py-3 sm:text-base"
                      >
                        Download Config~ 📥✨
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div class="py-6 text-center sm:py-8">
                  <div class="glass mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full sm:mb-4 sm:h-16 sm:w-16">
                    <div class="text-2xl sm:text-3xl">🔑</div>
                  </div>{" "}
                  <p class="text-theme-text-secondary mb-3 px-2 text-sm sm:mb-4 sm:text-base">
                    You need an API key to use ShareX with twink.forsale~ ✨
                  </p>
                  {/* Create API Key Form */}
                  <button
                    onClick$={handleCreateApiKey}
                    class="btn-cute text-theme-text-primary w-full rounded-full px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-6 sm:text-base"
                  >
                    Create API Key 🚀
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>{" "}
        {/* Step 2: Download ShareX */}
        <div class="card-cute mb-6 rounded-2xl p-4 sm:mb-8 sm:rounded-3xl sm:p-6 md:p-8">
          <div class="flex flex-col items-start gap-4 sm:flex-row">
            {" "}
            <div class="bg-gradient-to-br from-theme-accent-secondary to-theme-accent-primary text-theme-text-primary pulse-soft flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold sm:h-10 sm:w-10 sm:text-base">
              2
            </div>
            <div class="w-full flex-1">
              <h2 class="text-gradient-cute mb-3 flex flex-col items-start gap-2 text-xl font-bold sm:mb-4 sm:flex-row sm:items-center sm:text-2xl">
                <span>Install ShareX~</span>
                <div class="flex items-center gap-1">
                  <span class="text-lg sm:text-xl">📱</span>
                  <span class="sparkle ml-1 text-sm sm:text-base">✨</span>
                </div>
              </h2>{" "}
              <p class="text-theme-text-secondary mb-3 text-sm sm:mb-4 sm:text-base">
                If you don't have ShareX installed, download it from the
                official website~ (◕‿◕)♡
              </p>{" "}
              <a
                href="https://getsharex.com/"
                target="_blank"
                class="glass text-theme-text-primary hover:bg-theme-accent-primary/20 border-theme-card-border hover:border-theme-accent-primary/40 inline-block rounded-full border px-4 py-2 text-sm transition-all duration-300 sm:px-6 sm:py-3 sm:text-base"
              >
                Download ShareX~ 📥
              </a>
            </div>
          </div>
        </div>{" "}
        {/* Step 3: Import Config */}
        <div class="card-cute mb-6 rounded-2xl p-4 sm:mb-8 sm:rounded-3xl sm:p-6 md:p-8">
          <div class="flex flex-col items-start gap-4 sm:flex-row">
            {" "}
            <div class="bg-gradient-to-br from-theme-accent-secondary to-theme-accent-tertiary text-theme-text-primary pulse-soft flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold sm:h-10 sm:w-10 sm:text-base">
              3
            </div>
            <div class="w-full flex-1">
              <h2 class="text-gradient-cute mb-3 flex flex-col items-start gap-2 text-xl font-bold sm:mb-4 sm:flex-row sm:items-center sm:text-2xl">
                <span>Import Configuration~</span>
                <div class="flex items-center gap-1">
                  <span class="text-lg sm:text-xl">⚙️</span>
                  <span class="sparkle ml-1 text-sm sm:text-base">✨</span>
                </div>
              </h2>
              <div class="space-y-3 sm:space-y-4">
                {" "}
                <div class="text-theme-text-secondary flex flex-col items-start gap-2 text-sm sm:flex-row sm:gap-3 sm:text-base">
                  <span class="bg-gradient-to-br from-theme-accent-primary to-theme-accent-secondary text-theme-text-primary flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold sm:h-8 sm:w-8 sm:text-sm">
                    1
                  </span>
                  <span>
                    Download your configuration file using the button above~ 📥
                  </span>
                </div>
                <div class="text-theme-text-secondary flex flex-col items-start gap-2 text-sm sm:flex-row sm:gap-3 sm:text-base">
                  <span class="bg-gradient-to-br from-theme-accent-primary to-theme-accent-secondary text-theme-text-primary flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold sm:h-8 sm:w-8 sm:text-sm">
                    2
                  </span>
                  <span>
                    Double-click the downloaded .sxcu file to import it into
                    ShareX~ 🖱️
                  </span>
                </div>
                <div class="text-theme-text-secondary flex flex-col items-start gap-2 text-sm sm:flex-row sm:gap-3 sm:text-base">
                  <span class="bg-gradient-to-br from-theme-accent-primary to-theme-accent-secondary text-theme-text-primary flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold sm:h-8 sm:w-8 sm:text-sm">
                    3
                  </span>
                  <span>
                    ShareX will automatically configure twink.forsale as your
                    upload destination~ ✨
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>{" "}
        {/* Step 4: Start Uploading */}
        <div class="card-cute rounded-2xl p-4 sm:rounded-3xl sm:p-6 md:p-8">
          <div class="flex flex-col items-start gap-4 sm:flex-row">
            {" "}
            <div class="bg-gradient-theme-secondary-primary text-theme-text-primary pulse-soft flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold sm:h-10 sm:w-10 sm:text-base">
              4
            </div>
            <div class="w-full flex-1">
              <h2 class="text-gradient-cute mb-3 flex flex-col items-start gap-2 text-xl font-bold sm:mb-4 sm:flex-row sm:items-center sm:text-2xl">
                <span>Start Uploading!~</span>
                <div class="flex items-center gap-1">
                  <span class="text-lg sm:text-xl">🚀</span>
                  <span class="sparkle ml-1 text-sm sm:text-base">✨</span>
                </div>
              </h2>{" "}
              <p class="text-theme-text-secondary mb-3 text-sm sm:mb-4 sm:text-base">
                You're all set! Use ShareX's capture tools or drag files to
                upload them to twink.forsale~ (◕‿◕)♡
              </p>{" "}
              <div class="glass border-theme-card-border rounded-xl border p-3 sm:rounded-2xl sm:p-4">
                <h3 class="text-theme-accent-primary mb-2 flex flex-col items-start gap-2 text-sm font-semibold sm:mb-3 sm:flex-row sm:items-center sm:text-base">
                  <span>Quick Tips~</span>
                  <div class="flex items-center gap-1">
                    <span class="text-sm sm:text-base">💡</span>
                    <span class="ml-1 text-xs sm:text-sm">✨</span>
                  </div>
                </h3>
                <ul class="text-theme-text-secondary space-y-1 text-xs sm:space-y-2 sm:text-sm">
                  <li class="flex items-start gap-2">
                    <span class="mt-0.5">•</span>
                    <span>
                      Use Ctrl+Shift+4 for region capture (default hotkey)~ ⌨️
                    </span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="mt-0.5">•</span>
                    <span>Drag and drop files directly onto ShareX~ 🖱️</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="mt-0.5">•</span>
                    <span>View your uploads in the Dashboard~ 📊</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="mt-0.5">•</span>
                    <span>Each upload gets a short, shareable URL~ 🔗</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

export const head: DocumentHead = {
  title: "ShareX Setup~ - twink.forsale",
  meta: [
    {
      name: "description",
      content:
        "Configure ShareX to work with twink.forsale file sharing service~ (◕‿◕)♡",
    },
  ],
};
