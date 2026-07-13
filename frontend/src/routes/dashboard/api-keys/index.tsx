import { component$, useSignal, $ } from "@builder.io/qwik";
import { routeLoader$, server$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Key, Trash2, Rocket, CheckCircle } from "lucide-icons-qwik";
import { api, serverAuth } from "~/lib/api-client";
import { getCurrentUser } from "~/lib/auth-client";
import {
  Badge,
  Button,
  Callout,
  CopyButton,
  EmptyState,
  IconButton,
  Input,
  PageHeader,
  Panel,
} from "~/components/ui";

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

  return (
    <>
      <PageHeader
        align="left"
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
        <Panel title="Create New API Key" icon={Key} class="mb-6 sm:mb-8">
          <div class="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Input
              type="text"
              placeholder="API Key Name (e.g., ShareX, Development) uwu"
              class="flex-1"
              value={newKeyName.value}
              onInput$={(e) => {
                newKeyName.value = (e.target as HTMLInputElement).value;
              }}
              onKeyDown$={(e) => {
                if (e.key === "Enter") handleCreateApiKey();
              }}
            />
            <Button
              onClick$={handleCreateApiKey}
              disabled={!newKeyName.value.trim() || isCreating.value}
            >
              {isCreating.value ? (
                "Creating..."
              ) : (
                <>
                  <Rocket class="h-4 w-4" />
                  Create API Key
                </>
              )}
            </Button>
          </div>
        </Panel>
      )}

      {/* New Key Display (one-time) */}
      {showNewKey.value && (
        <Callout
          tone="success"
          icon={CheckCircle}
          title="API Key Created!"
          class="mb-6 sm:mb-8"
        >
          <p class="mb-3">
            Save this API key now~ For security reasons, it won't be shown
            again! (◕‿◕)♡
          </p>
          <div class="bg-theme-bg-secondary/40 border-theme-card-border flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="min-w-0 flex-1">
              <p class="text-theme-text-muted mb-1 text-xs">
                {showNewKey.value.name}
              </p>
              <p class="text-theme-text-primary font-mono text-xs break-all sm:text-sm">
                {showNewKey.value.key}
              </p>
            </div>
            <CopyButton value={showNewKey.value.key} label="Copy" size="md" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            class="mt-3"
            onClick$={() => (showNewKey.value = null)}
          >
            I've saved it safely
          </Button>
        </Callout>
      )}

      {/* API Keys List */}
      <Panel title="Your API Keys" icon={Key} flush>
        {keys.value.length === 0 ? (
          <EmptyState
            icon={Key}
            title="No API Keys Yet!"
            description="Create your first API key to start using the API or configure ShareX~ (◕‿◕)♡"
            class="px-4 sm:px-6"
          />
        ) : (
          <div class="divide-theme-card-border/60 divide-y">
            {keys.value.map((apiKey) => (
              <div
                key={apiKey.id}
                class="hover:bg-theme-bg-tertiary/20 flex flex-col gap-3 px-4 py-4 transition-colors sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div class="min-w-0 flex-1">
                  <h3 class="text-theme-text-primary mb-1 flex items-center gap-1.5 font-medium">
                    <Key class="h-4 w-4 flex-shrink-0" />
                    <span class="truncate">{apiKey.name}</span>
                  </h3>
                  <div class="mb-2 flex flex-wrap items-center gap-1.5">
                    <Badge status="neutral">
                      Created {new Date(apiKey.createdAt).toLocaleDateString()}
                    </Badge>
                    {apiKey.lastUsed && (
                      <Badge status="neutral">
                        Used {new Date(apiKey.lastUsed).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                  <div class="flex flex-wrap items-center gap-2">
                    <code class="bg-theme-bg-tertiary/30 text-theme-accent-tertiary rounded-lg px-2 py-1 font-mono text-xs break-all">
                      {apiKey.key.substring(0, 8)}...
                      {apiKey.key.substring(apiKey.key.length - 4)}
                    </code>
                    <CopyButton value={apiKey.key} label="Copy full key" />
                  </div>
                </div>
                <IconButton
                  variant="danger"
                  title="Delete API Key"
                  class="self-end sm:self-auto"
                  onClick$={() => handleDeleteApiKey(apiKey.id, apiKey.name)}
                >
                  <Trash2 class="h-5 w-5" />
                </IconButton>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* ShareX Integration Info */}
      {apiKeysData.value.user.isApproved && (
        <Callout tone="accent" title="ShareX Integration" class="mt-6 sm:mt-8">
          <p class="mb-3">
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
          <div class="bg-theme-bg-secondary/40 border-theme-card-border flex items-center justify-between gap-2 rounded-xl border p-3">
            <div class="min-w-0">
              <p class="text-theme-text-muted text-xs">API Endpoint</p>
              <code class="text-theme-accent-quaternary font-mono text-xs break-all sm:text-sm">
                {apiKeysData.value.origin}/upload
              </code>
            </div>
            <CopyButton value={`${apiKeysData.value.origin}/upload`} />
          </div>
        </Callout>
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
