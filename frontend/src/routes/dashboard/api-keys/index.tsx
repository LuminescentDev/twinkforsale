import { component$, useSignal, $ } from "@builder.io/qwik";
import { routeLoader$, server$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Key } from "lucide-icons-qwik";
import { api, serverAuth } from "~/lib/api-client";
import { getCurrentUser } from "~/lib/auth-client";
import { Callout, PageHeader } from "~/components/ui";

export const useApiKeys = routeLoader$(async (requestEvent) => {
  const auth = serverAuth(requestEvent);
  const user = await getCurrentUser(auth);
  if (!user) {
    throw requestEvent.redirect(302, "/");
  }

  const { apiKeys } = await api.apiKeys
    .list(auth)
    .catch(() => ({ apiKeys: [] }));

  return {
    user,
    // The backend only returns a masked key for security; the full key is
    // shown once at creation time. Alias it as `key` for the existing view.
    apiKeys: apiKeys.map((k) => ({ ...k, key: k.maskedKey })),
    origin: requestEvent.url.origin,
  };
});

export const createApiKey = server$(async function (name: string) {
  return api.apiKeys.create(name, {
    cookie: this.request.headers.get("cookie"),
  });
});

export const deleteApiKey = server$(async function (keyId: string) {
  await api.apiKeys.delete(keyId, {
    cookie: this.request.headers.get("cookie"),
  });
  return { success: true };
});

export default component$(() => {
  const apiKeysData = useApiKeys();
  const newKeyName = useSignal("");
  const isCreating = useSignal(false);
  const showNewKey = useSignal<{ key: string; name: string } | null>(null);
  // Local, reactive copy of the list so we can update it without a full page
  // reload (a reload would discard the one-time full-key display).
  const keys = useSignal(apiKeysData.value.apiKeys);

  const handleCreateApiKey = $(async () => {
    if (!newKeyName.value.trim()) return;

    isCreating.value = true;
    try {
      const newKey = await createApiKey(newKeyName.value.trim());
      showNewKey.value = { key: newKey.key, name: newKey.name };
      // Prepend the new key (keeping its full value in memory so "Copy Full
      // Key" works until the next navigation reloads masked values).
      keys.value = [
        {
          id: newKey.id,
          name: newKey.name,
          key: newKey.key,
          maskedKey: newKey.key,
          createdAt: newKey.createdAt,
          lastUsed: null,
        },
        ...keys.value,
      ];
      newKeyName.value = "";
    } catch (error) {
      console.error("Failed to create API key:", error);
      alert("Failed to create API key");
    } finally {
      isCreating.value = false;
    }
  });

  const handleDeleteApiKey = $(async (keyId: string, keyName: string) => {
    if (!confirm(`Are you sure you want to delete the API key "${keyName}"?`)) {
      return;
    }

    try {
      await deleteApiKey(keyId);
      keys.value = keys.value.filter((k) => k.id !== keyId);
    } catch (error) {
      console.error("Failed to delete API key:", error);
      alert("Failed to delete API key");
    }
  });

  const copyToClipboard = $(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("API key copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy:", error);
      alert("Failed to copy API key");
    }
  });
  return (
    <>
      <PageHeader
        title="API Keys Manager"
        icon={Key}
        subtitle="Create and manage API keys for ShareX integration~ Keep them safe and secure! (◕‿◕)♡"
      />
      {/* Account Status Check */}
      {!apiKeysData.value.user.isApproved && (
        <Callout tone="warning" title="Account Pending Approval" class="mb-6 sm:mb-8">
          You cannot create API keys until your account is approved by an
          administrator. Please wait for approval before proceeding.
        </Callout>
      )}
      {/* Create New API Key */}
      {apiKeysData.value.user.isApproved && (
        <div class="card-cute mb-6 rounded-2xl p-4 sm:mb-8 sm:p-6">
          <h2 class="text-gradient-cute mb-4 flex items-center gap-2 text-lg font-bold sm:text-xl">
            Create New API Key
          </h2>
          <div class="flex flex-col gap-3 sm:flex-row sm:gap-4">
            {" "}
            <input
              type="text"
              placeholder="API Key Name (e.g., ShareX, Development) uwu"
              class="glass text-theme-text-primary placeholder:theme-text-muted focus:ring-theme-accent-primary/50 flex-1 rounded-full px-4 py-3 text-sm transition-all duration-300 focus:ring-2 focus:outline-none sm:px-6 sm:text-base"
              value={newKeyName.value}
              onInput$={(e) => {
                newKeyName.value = (e.target as HTMLInputElement).value;
              }}
              onKeyDown$={(e) => {
                if (e.key === "Enter") {
                  handleCreateApiKey();
                }
              }}
            />
            <button
              onClick$={handleCreateApiKey}
              disabled={!newKeyName.value.trim() || isCreating.value}
              class="btn-cute text-theme-text-primary w-full rounded-full px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-6 sm:text-base"
            >
              {isCreating.value ? "Creating... ⏳" : "Create API Key 🚀"}
            </button>
          </div>
        </div>
      )}
      {/* New Key Display */}
      {showNewKey.value && (
        <div class="bg-gradient-to-br from-theme-accent-secondary/20 to-theme-accent-tertiary/20 border-theme-accent-secondary/30 glass mb-6 rounded-2xl border p-4 sm:mb-8 sm:p-6">
          <h3 class="text-theme-accent-secondary mb-2 flex flex-wrap items-center text-base font-bold sm:text-lg">
            API Key Created! 🎉 <span class="sparkle ml-2">✨</span>
          </h3>
          <p class="text-theme-text-secondary mb-4 text-sm sm:text-base">
            Save this API key now~ For security reasons, it won't be shown
            again! (◕‿◕)♡
          </p>
          <div class="glass rounded-2xl p-3 sm:p-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="min-w-0 flex-1">
                <p class="text-theme-text-secondary mb-1 text-xs sm:text-sm">
                  Name: {showNewKey.value.name}
                </p>
                <p class="text-theme-text-primary bg-theme-bg-tertiary/20 rounded-lg p-2 font-mono text-xs break-all sm:text-sm">
                  {showNewKey.value.key}
                </p>
              </div>
              <button
                onClick$={() => copyToClipboard(showNewKey.value!.key)}
                class="btn-cute text-theme-text-primary w-full rounded-full px-3 py-2 text-xs sm:w-auto sm:px-4 sm:text-sm"
              >
                {" "}
                Copy 📋
              </button>
            </div>
          </div>
          <button
            onClick$={() => (showNewKey.value = null)}
            class="text-theme-accent-tertiary hover:text-theme-text-primary mt-4 text-sm underline"
          >
            I've saved it safely ✓
          </button>
        </div>
      )}
      {/* API Keys List */}
      <div class="card-cute rounded-2xl p-4 sm:p-6">
        <h2 class="text-gradient-cute mb-4 flex flex-wrap items-center text-lg font-bold sm:text-xl">
          Your API Keys
        </h2>

        {keys.value.length === 0 ? (
          <div class="py-8 text-center sm:py-12">
            <div class="glass mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full sm:h-16 sm:w-16">
              <div class="text-xl sm:text-2xl">🔑</div>
            </div>{" "}
            <h3 class="text-theme-text-primary mb-2 text-base font-medium sm:text-lg">
              No API Keys Yet! ✨
            </h3>
            <p class="text-theme-text-secondary px-4 text-sm sm:text-base">
              Create your first API key to start using the API or configure
              ShareX~ (◕‿◕)♡
            </p>
          </div>
        ) : (
          <div class="space-y-3 sm:space-y-4">
            {" "}
            {keys.value.map((apiKey) => (
              <div
                key={apiKey.id}
                class="glass border-theme-card-border hover:border-theme-accent-primary rounded-2xl border p-3 transition-all duration-300 sm:p-4"
              >
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div class="min-w-0 flex-1">
                    <h3 class="text-theme-text-primary mb-1 flex items-center text-base font-medium sm:text-lg">
                      🔐 <span class="ml-1 truncate">{apiKey.name}</span>
                    </h3>
                    <div class="text-theme-text-secondary flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:gap-4 sm:text-sm">
                      <span>
                        Created:{" "}
                        {new Date(apiKey.createdAt).toLocaleDateString()}
                      </span>
                      {apiKey.lastUsed && (
                        <span>
                          Last used:{" "}
                          {new Date(apiKey.lastUsed).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div class="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <span class="text-theme-text-secondary text-xs sm:text-sm">
                        Key:
                      </span>
                      <code class="bg-theme-bg-tertiary/30 text-theme-accent-tertiary rounded-full px-2 py-1 font-mono text-xs break-all sm:px-3 sm:text-sm">
                        {apiKey.key.substring(0, 8)}...
                        {apiKey.key.substring(apiKey.key.length - 4)}
                      </code>
                      <button
                        onClick$={() => copyToClipboard(apiKey.key)}
                        class="text-theme-accent-tertiary hover:text-theme-accent-tertiary hover:bg-theme-accent-primary/20 w-full rounded-full px-2 py-1 text-center text-xs transition-all duration-300 sm:w-auto sm:px-3 sm:text-sm"
                      >
                        Copy Full Key 📋
                      </button>
                    </div>
                  </div>
                  <button
                    onClick$={() => handleDeleteApiKey(apiKey.id, apiKey.name)}
                    class="text-theme-accent-primary hover:text-theme-accent-primary hover:bg-theme-accent-primary/20 self-end rounded-full p-2 transition-all duration-300 sm:self-auto sm:p-3"
                    title="Delete API Key"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>{" "}
      {/* ShareX Integration Info */}
      {apiKeysData.value.user.isApproved && (
        <div class="bg-gradient-to-br from-theme-accent-tertiary/20 to-theme-accent-quaternary/20 border-theme-accent-tertiary/30 glass mt-6 rounded-2xl border p-4 sm:mt-8 sm:p-6">
          <h3 class="text-theme-accent-tertiary mb-2 flex flex-wrap items-center text-base font-bold sm:text-lg">
            ShareX Integration
          </h3>
          <p class="text-theme-text-secondary mb-4 text-sm sm:text-base">
            Use your API key to configure ShareX for automatic uploads~ Visit
            the{" "}
            <a
              href="/dashboard/embed"
              class="text-theme-accent-secondary hover:text-theme-accent-tertiary font-medium underline"
            >
              Setup page
            </a>{" "}
            to download ShareX configuration files! (◕‿◕)♡
          </p>
          <div class="glass border-theme-accent-quaternary/20 rounded-2xl border p-3 sm:p-4">
            <p class="text-theme-text-secondary mb-2 text-xs sm:text-sm">
              API Endpoint:
            </p>
            <code class="text-theme-accent-quaternary font-mono text-xs break-all sm:text-sm">
              {apiKeysData.value.origin}/upload
            </code>
          </div>
        </div>
      )}
    </>
  );
});

export const head: DocumentHead = {
  title: "API Keys - twink.forsale",
  meta: [
    {
      name: "description",
      content:
        "Create and manage API keys for ShareX integration and programmatic access.",
    },
  ],
};
