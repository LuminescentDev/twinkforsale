import { component$, $, useSignal } from "@builder.io/qwik";
import { routeLoader$, server$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Camera, Key, Sparkle, Shield } from "lucide-icons-qwik";
import { SelectMenu } from "@luminescent/ui-qwik";
import { PageContainer, PageHeader } from "~/components/ui";
import { api, serverAuth } from "~/lib/api-client";
import { getCurrentUser } from "~/lib/auth-client";
import {
  generateShareXConfig,
  downloadShareXConfig,
  getRecommendedVersion,
  SHAREX_VERSIONS,
  type ShareXVersion,
} from "~/lib/sharex-config";
export const useUserApiKeys = routeLoader$(async (requestEvent) => {
  const auth = serverAuth(requestEvent);
  const currentUser = await getCurrentUser(auth);
  if (!currentUser) {
    throw requestEvent.redirect(302, "/");
  }

  const { apiKeys } = await api.apiKeys
    .list(auth)
    .catch(() => ({ apiKeys: [] }));

  return {
    // The backend masks stored keys; the full key is only returned at
    // creation time (see `createApiKey`), which powers a working config.
    user: {
      ...currentUser,
      apiKeys: apiKeys.map((k) => ({ ...k, key: k.maskedKey })),
    },
    baseUrl: requestEvent.url.origin,
  };
});

export const createApiKey = server$(async function (name: string) {
  return api.apiKeys.create(name, {
    cookie: this.request.headers.get("cookie"),
  });
});

export default component$(() => {
  const userData = useUserApiKeys();
  const selectedVersion = useSignal<ShareXVersion>(getRecommendedVersion());
  // The full API key is only returned by the backend at creation time (stored
  // keys are masked), so we hold it in memory to build a working ShareX config.
  const createdKey = useSignal<{ name: string; key: string } | null>(null);
  const creating = useSignal(false);

  const handleCreateApiKey = $(async () => {
    creating.value = true;
    try {
      const result = await createApiKey("ShareX API Key");
      createdKey.value = { name: result.name, key: result.key };
    } catch (error) {
      console.error("Failed to create API key:", error);
      alert("Failed to create API key");
    } finally {
      creating.value = false;
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

  const copyKey = $((key: string) => {
    navigator.clipboard.writeText(key);
  });

  return (
    <PageContainer width="narrow">
      <PageHeader
        title="ShareX Setup~"
        icon={Camera}
        subtitle="Configure ShareX to work with twink.forsale in just a few clicks! (◕‿◕)♡"
      />
      <div>{" "}
        {/* Step 1: API Key */}
        <div class="card-cute mb-6 rounded-2xl p-4 sm:mb-8 sm:p-6 md:p-8">
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
              {/* Freshly created key — shown once with the full, working value */}
              {createdKey.value && (
                <div class="glass border-theme-accent-primary/40 mb-4 flex flex-col gap-4 rounded-xl border p-3 sm:rounded-2xl sm:p-4">
                  <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div class="min-w-0 flex-1">
                      <p class="text-theme-text-primary flex items-center gap-2 text-sm font-medium sm:text-base">
                        <Shield class="h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
                        <span class="truncate">{createdKey.value.name}</span>
                      </p>
                      <p class="text-theme-text-secondary mt-1 rounded bg-black/20 px-2 py-1 font-mono text-xs break-all sm:text-sm">
                        {createdKey.value.key}
                      </p>
                      <p class="text-theme-accent-primary mt-2 text-xs">
                        ⚠️ Copy this key now — for security it won't be shown
                        again after you leave this page!
                      </p>
                    </div>

                    {/* Version Selector */}
                    <div class="flex flex-col gap-1 sm:min-w-[200px]">
                      <label class="text-theme-text-secondary flex items-center gap-1 text-xs font-medium">
                        <Sparkle class="h-3 w-3" />
                        <span>Version</span>
                      </label>
                      <SelectMenu
                        id="sharex-version"
                        values={Object.entries(SHAREX_VERSIONS).map(
                          ([version, info]) => ({
                            name: (
                              <div class="flex items-center justify-between w-full">
                                <span>{info.label}</span>
                                {info.recommended && (
                                  <span class="text-theme-warning">⭐</span>
                                )}
                              </div>
                            ),
                            value: version,
                          }),
                        )}
                        value={selectedVersion.value}
                        onChange$={(e, el) => {
                          selectedVersion.value = el.value as ShareXVersion;
                        }}
                      />
                    </div>
                  </div>

                  <div class="flex flex-col gap-2 sm:flex-row">
                    <button
                      onClick$={() => handleDownloadConfig(createdKey.value!.key)}
                      class="btn-cute w-full rounded-full px-4 py-2 text-sm font-medium text-white sm:px-6 sm:py-3 sm:text-base"
                    >
                      Download Config~ 📥✨
                    </button>
                    <button
                      onClick$={() => copyKey(createdKey.value!.key)}
                      class="glass border-theme-card-border hover:border-theme-accent-primary/40 w-full rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300 sm:px-6 sm:py-3 sm:text-base"
                    >
                      Copy Key 📋
                    </button>
                  </div>
                </div>
              )}

              {/* Existing keys (masked, for reference only) */}
              {userData.value.user?.apiKeys &&
                userData.value.user.apiKeys.length > 0 && (
                  <div class="mb-4 space-y-2">
                    <p class="text-theme-text-secondary text-xs sm:text-sm">
                      Your existing API keys~ (values are hidden for security, so
                      generate a new key below to download a fresh config):
                    </p>
                    {userData.value.user.apiKeys.map((apiKey) => (
                      <div
                        key={apiKey.id}
                        class="glass border-theme-card-border flex items-center gap-2 rounded-xl border p-3 text-sm"
                      >
                        <Shield class="h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
                        <span class="text-theme-text-primary truncate font-medium">
                          {apiKey.name}
                        </span>
                        <span class="text-theme-text-secondary ml-auto font-mono text-xs break-all">
                          {apiKey.key}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

              {/* Create a new key + config */}
              <div class="py-4 text-center sm:py-6">
                {!createdKey.value && (
                  <>
                    <div class="glass mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full sm:mb-4 sm:h-16 sm:w-16">
                      <div class="text-2xl sm:text-3xl">🔑</div>
                    </div>{" "}
                    <p class="text-theme-text-secondary mb-3 px-2 text-sm sm:mb-4 sm:text-base">
                      Generate an API key to download your ShareX config~ ✨
                    </p>
                  </>
                )}
                <button
                  onClick$={handleCreateApiKey}
                  disabled={creating.value}
                  class="btn-cute text-theme-text-primary w-full rounded-full px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-6 sm:text-base"
                >
                  {creating.value
                    ? "Creating..."
                    : userData.value.user?.apiKeys.length ||
                        createdKey.value
                      ? "Create Another API Key 🚀"
                      : "Create API Key 🚀"}
                </button>
              </div>
            </div>
          </div>
        </div>{" "}
        {/* Step 2: Download ShareX */}
        <div class="card-cute mb-6 rounded-2xl p-4 sm:mb-8 sm:p-6 md:p-8">
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
        <div class="card-cute mb-6 rounded-2xl p-4 sm:mb-8 sm:p-6 md:p-8">
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
        <div class="card-cute rounded-2xl p-4 sm:p-6 md:p-8">
          <div class="flex flex-col items-start gap-4 sm:flex-row">
            {" "}
            <div class="bg-gradient-to-br from-theme-accent-tertiary to-theme-accent-quaternary text-theme-text-primary pulse-soft flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold sm:h-10 sm:w-10 sm:text-base">
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
    </PageContainer>
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
