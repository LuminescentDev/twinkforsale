import { component$, useSignal, $ } from "@builder.io/qwik";
import { routeLoader$, server$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { createServerApi } from "~/lib/api/server";
import { apiKeys as apiKeysApi } from "~/lib/api/client";

export const useApiKeys = routeLoader$(async (requestEvent) => {
  const user = requestEvent.sharedMap.get("user");

  if (!user) {
    throw requestEvent.redirect(302, "/");
  }

  try {
    const api = createServerApi(requestEvent);
    const apiKeys = await api.apiKeys.list();

    // Get the current origin from the request
    const origin = requestEvent.url.origin;

    return {
      user,
      apiKeys,
      origin,
    };
  } catch (error) {
    console.error("Failed to load API keys:", error);
    throw requestEvent.redirect(302, "/");
  }
});

export const createApiKey = server$(async function (name: string) {
  const user = this.sharedMap.get("user");

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Check if user is approved
  if (!user.isApproved) {
    throw new Error(
      "Account pending approval. Please wait for admin approval before creating API keys.",
    );
  }

  try {
    const result = await apiKeysApi.create({ name });
    return {
      id: result.id,
      key: result.key,
      name: result.name,
      createdAt: result.createdAt,
    };
  } catch (error) {
    console.error("Failed to create API key:", error);
    throw new Error("Failed to create API key");
  }
});

export const deleteApiKey = server$(async function (keyId: string) {
  const user = this.sharedMap.get("user");

  if (!user) {
    throw new Error("Not authenticated");
  }

  try {
    await apiKeysApi.delete(keyId);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete API key:", error);
    throw new Error("API key not found or access denied");
  }
});

export default component$(() => {
  const apiKeysData = useApiKeys();
  const newKeyName = useSignal("");
  const isCreating = useSignal(false);
  const showNewKey = useSignal<{ key: string; name: string } | null>(null);

  const handleCreateApiKey = $(async () => {
    if (!newKeyName.value.trim()) return;

    isCreating.value = true;
    try {
      const newKey = await createApiKey(newKeyName.value.trim());
      showNewKey.value = { key: newKey.key, name: newKey.name };
      newKeyName.value = "";
      // Reload the page to show updated list
      window.location.reload();
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
      // Reload the page to show updated list
      window.location.reload();
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
      {/* Page Header */}
      <div class="mb-6 text-center sm:mb-8">
        <h1 class="text-gradient-cute mb-3 flex flex-wrap items-center justify-center gap-2 text-3xl font-bold sm:text-4xl">
          API Keys Manager
        </h1>
        <p class="text-theme-text-secondary px-4 text-base sm:text-lg">
          Create and manage API keys for ShareX integration~ Keep them safe and
          secure! (◕‿◕)♡
        </p>
      </div>
      {/* Account Status Check */}
      {!apiKeysData.value.user.isApproved && (
        <div class="bg-theme-secondary/10 border-theme-accent-secondary text-theme-text-primary mb-6 rounded-xl border p-4 sm:mb-8 sm:p-6">
          <div class="text-center">
            <h3 class="mb-2 text-lg font-semibold">Account Pending Approval</h3>
            <p class="text-theme-text-secondary text-sm">
              You cannot create API keys until your account is approved by an
              administrator. Please wait for approval before proceeding.
            </p>
          </div>
        </div>
      )}
      {/* Create New API Key */}
      {apiKeysData.value.user.isApproved && (
        <div class="card-cute mb-6 rounded-3xl p-4 sm:mb-8 sm:p-6">
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
        <div class="bg-gradient-to-br from-theme-accent-secondary/20 to-theme-accent-tertiary/20 border-theme-accent-secondary/30 glass mb-6 rounded-3xl border p-4 sm:mb-8 sm:p-6">
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
      <div class="card-cute rounded-3xl p-4 sm:p-6">
        <h2 class="text-gradient-cute mb-4 flex flex-wrap items-center text-lg font-bold sm:text-xl">
          Your API Keys
        </h2>

        {apiKeysData.value.apiKeys.length === 0 ? (
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
            {apiKeysData.value.apiKeys.map((apiKey) => (
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
                      {apiKey.lastUsedAt && (
                        <span>
                          Last used:{" "}
                          {new Date(apiKey.lastUsedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div class="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <span class="text-theme-text-secondary text-xs sm:text-sm">
                        Key:
                      </span>
                      <code class="bg-theme-bg-tertiary/30 text-theme-accent-tertiary rounded-full px-2 py-1 font-mono text-xs break-all sm:px-3 sm:text-sm">
                        {apiKey.keyPrefix}...
                      </code>
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
        <div class="bg-gradient-to-br from-theme-accent-tertiary/20 to-theme-accent-quaternary/20 border-theme-accent-tertiary/30 glass mt-6 rounded-3xl border p-4 sm:mt-8 sm:p-6">
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
              {apiKeysData.value.origin}/api/upload
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
