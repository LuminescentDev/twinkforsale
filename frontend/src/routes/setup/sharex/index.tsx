import { component$, $, useSignal, useComputed$ } from "@builder.io/qwik";
import { routeLoader$, server$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Check, Download, ExternalLink } from "lucide-icons-qwik";
import { api, serverAuth, type ApiKeyListItem } from "~/lib/api-client";
import { getCurrentUser } from "~/lib/auth-client";
import { useToast } from "~/lib/toast-store";
import {
  generateShareXConfig,
  downloadShareXConfig,
  getRecommendedVersion,
  SHAREX_VERSIONS,
  type ShareXVersion,
} from "~/lib/sharex-config";
import {
  Page,
  PageHeader,
  Surface,
  Button,
  CopyButton,
  Field,
  Input,
  Select,
  Callout,
  Badge,
} from "~/components/ui";

export const useShareXSetup = routeLoader$(async (requestEvent) => {
  const auth = serverAuth(requestEvent);
  const user = await getCurrentUser(auth);
  if (!user) {
    throw requestEvent.redirect(302, "/");
  }

  const { apiKeys } = await api.apiKeys
    .list(auth)
    .catch(() => ({ apiKeys: [] }));

  return {
    apiKeys,
    isApproved: user.isApproved,
    baseUrl: requestEvent.url.origin,
  };
});

export const createApiKey = server$(async function (name: string) {
  return api.apiKeys.create(name, {
    cookie: this.request.headers.get("cookie"),
  });
});

export default component$(() => {
  const data = useShareXSetup();
  const toast = useToast();

  const version = useSignal<ShareXVersion>(getRecommendedVersion());
  const keys = useSignal<ApiKeyListItem[]>([...data.value.apiKeys]);
  /** Full key held in memory: the server only returns it at creation time. */
  const activeKey = useSignal<{ name: string; key: string } | null>(null);
  const keyName = useSignal("ShareX");
  const creating = useSignal(false);
  const downloaded = useSignal(false);

  const configJson = useComputed$(() =>
    JSON.stringify(
      generateShareXConfig({
        apiKey: activeKey.value?.key ?? "YOUR_API_KEY",
        baseUrl: data.value.baseUrl,
        version: version.value,
      }),
      null,
      2,
    ),
  );

  const create = $(async () => {
    creating.value = true;
    try {
      const result = await createApiKey(keyName.value.trim() || "ShareX");
      activeKey.value = { name: result.name, key: result.key };
      keys.value = [
        {
          id: result.id,
          name: result.name,
          maskedKey: `${result.key.slice(0, 8)}…${result.key.slice(-4)}`,
          createdAt: result.createdAt,
          lastUsed: null,
        },
        ...keys.value,
      ];
    } catch (error) {
      toast.error(
        "Could not create the key",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    } finally {
      creating.value = false;
    }
  });

  const download = $(() => {
    if (!activeKey.value) return;
    downloadShareXConfig(
      generateShareXConfig({
        apiKey: activeKey.value.key,
        baseUrl: data.value.baseUrl,
        version: version.value,
      }),
    );
    downloaded.value = true;
  });

  return (
    <Page width="narrow">
      <PageHeader
        title="ShareX setup"
        description="ShareX is a Windows screenshot tool. Connect it once and every screenshot you take uploads here automatically."
      />

      {!data.value.isApproved && (
        <Callout tone="warning" title="Account pending approval" class="mb-5">
          You can read through the steps now, but uploads and API keys only work
          once an administrator approves your account.
        </Callout>
      )}

      <div class="mt-1">
        {/* Step 1 — key */}
        <div class="flex gap-3">
          <div class="flex flex-col items-center">
            <span
              class={`flex h-7 w-7 shrink-0 items-center justify-center border-2 text-[13px] font-bold ${
                activeKey.value
                  ? "border-accent bg-accent text-on-accent"
                  : "border-edge-strong text-ink-muted"
              }`}
              aria-hidden="true"
            >
              {activeKey.value ? <Check class="h-4 w-4" /> : 1}
            </span>
            <span class="bg-edge mt-1 w-px flex-1" aria-hidden="true" />
          </div>
          <div class="min-w-0 flex-1 pb-6">
            <h2 class="text-ink mb-1 text-base leading-6 font-semibold">
              Create an API key
            </h2>
            <p class="text-ink-muted mb-3 text-[13px] leading-5">
              An API key is a long password that lets ShareX upload as you,
              without knowing your account password. It only works for
              uploading, and you can revoke it at any time.
            </p>

            {activeKey.value ? (
              <Callout
                tone="success"
                title={`“${activeKey.value.name}” is ready`}
              >
                Keep this window open until you have downloaded the
                configuration below — the full key is only shown once.
              </Callout>
            ) : (
              <Surface>
                <div class="flex flex-wrap items-end gap-3">
                  <Field
                    label="Key name"
                    for="sharex-key-name"
                    help="Shown in your API key list so you can recognise this device."
                    class="min-w-[12rem] flex-1"
                  >
                    <Input
                      id="sharex-key-name"
                      value={keyName.value}
                      maxLength={64}
                      onInput$={(_, el) => (keyName.value = el.value)}
                    />
                  </Field>
                  <Button
                    variant="primary"
                    loading={creating.value}
                    disabled={!data.value.isApproved}
                    onClick$={create}
                    class="mb-[1.65rem]"
                  >
                    Create key
                  </Button>
                </div>
                {keys.value.length > 0 && (
                  <p class="text-ink-muted mt-3 text-xs">
                    You already have {keys.value.length} key
                    {keys.value.length === 1 ? "" : "s"}. Existing keys cannot
                    be shown again, so create a new one for this device.
                  </p>
                )}
              </Surface>
            )}
          </div>
        </div>

        {/* Step 2 — download config */}
        <div class="flex gap-3">
          <div class="flex flex-col items-center">
            <span
              class={`flex h-7 w-7 shrink-0 items-center justify-center border-2 text-[13px] font-bold ${
                downloaded.value
                  ? "border-accent bg-accent text-on-accent"
                  : "border-edge-strong text-ink-muted"
              }`}
              aria-hidden="true"
            >
              {downloaded.value ? <Check class="h-4 w-4" /> : 2}
            </span>
            <span class="bg-edge mt-1 w-px flex-1" aria-hidden="true" />
          </div>
          <div class="min-w-0 flex-1 pb-6">
            <h2 class="text-ink mb-1 text-base leading-6 font-semibold">
              Download the configuration
            </h2>
            <p class="text-ink-muted mb-3 text-[13px] leading-5">
              A <code class="text-ink font-mono text-xs">.sxcu</code> file tells
              ShareX where to send your uploads. Pick the version of ShareX you
              have — it is shown in ShareX under Help, then About.
            </p>

            <Surface>
              <div class="flex flex-wrap items-end gap-3">
                <Field
                  label="ShareX version"
                  for="sharex-version"
                  class="w-56"
                  help="Choose the newest one you have installed."
                >
                  <Select
                    id="sharex-version"
                    value={version.value}
                    onChange$={(_, el) =>
                      (version.value = el.value as ShareXVersion)
                    }
                  >
                    {(Object.keys(SHAREX_VERSIONS) as ShareXVersion[]).map(
                      (v) => (
                        <option key={v} value={v}>
                          {SHAREX_VERSIONS[v].label}
                        </option>
                      ),
                    )}
                  </Select>
                </Field>
                <Button
                  variant="primary"
                  disabled={!activeKey.value}
                  onClick$={download}
                  class="mb-[1.65rem]"
                >
                  <Download class="h-4 w-4" aria-hidden="true" />
                  Download .sxcu
                </Button>
                {SHAREX_VERSIONS[version.value].recommended && (
                  <Badge tone="accent" class="mb-[1.9rem]">
                    Recommended
                  </Badge>
                )}
              </div>

              {!activeKey.value && (
                <p class="text-ink-muted mt-3 text-xs">
                  Create a key in step 1 first — the configuration file has to
                  contain it.
                </p>
              )}

              <details class="mt-4">
                <summary class="focus-ring text-ink-muted hover:text-ink cursor-pointer text-xs">
                  Show the file contents
                </summary>
                <div class="border-edge rounded-surface bg-surface-subtle relative mt-2 border">
                  <CopyButton
                    value={configJson.value}
                    label="Copy"
                    variant="secondary"
                    class="absolute top-2 right-2"
                  />
                  <pre class="text-ink max-h-64 overflow-auto p-3 pr-24 font-mono text-xs leading-5">
                    {configJson.value}
                  </pre>
                </div>
              </details>
            </Surface>
          </div>
        </div>

        {/* Step 3 — import */}
        <div class="flex gap-3">
          <div class="flex flex-col items-center">
            <span
              class="border-edge-strong text-ink-muted flex h-7 w-7 shrink-0 items-center justify-center border-2 text-[13px] font-bold"
              aria-hidden="true"
            >
              3
            </span>
            <span class="bg-edge mt-1 w-px flex-1" aria-hidden="true" />
          </div>
          <div class="min-w-0 flex-1 pb-6">
            <h2 class="text-ink mb-1 text-base leading-6 font-semibold">
              Import it into ShareX
            </h2>
            <ol class="text-ink-muted list-decimal space-y-1.5 pl-4 text-[13px] leading-5">
              <li>
                Double-click the downloaded{" "}
                <code class="text-ink font-mono text-xs">.sxcu</code> file.
                ShareX asks whether to import it — choose Yes.
              </li>
              <li>
                If nothing happens, open ShareX, go to{" "}
                <span class="text-ink">
                  Destinations → Destination settings
                </span>
                , then <span class="text-ink">Custom uploaders</span>, and use{" "}
                <span class="text-ink">Import → From file</span>.
              </li>
              <li>
                In the same window, set{" "}
                <span class="text-ink">Image, Text and File uploader</span> to
                twink.forsale.
              </li>
            </ol>
            <p class="text-ink-muted mt-3 text-[13px] leading-5">
              Do not have ShareX yet?{" "}
              <a
                href="https://getsharex.com/"
                target="_blank"
                rel="noopener noreferrer"
                class="focus-ring text-accent-text rounded-[4px] underline underline-offset-2"
              >
                Download it from getsharex.com
                <ExternalLink
                  class="ml-0.5 inline h-3 w-3"
                  aria-hidden="true"
                />
              </a>
            </p>
          </div>
        </div>

        {/* Step 4 — verify */}
        <div class="flex gap-3">
          <div class="flex flex-col items-center">
            <span
              class="border-edge-strong text-ink-muted flex h-7 w-7 shrink-0 items-center justify-center border-2 text-[13px] font-bold"
              aria-hidden="true"
            >
              4
            </span>
          </div>
          <div class="min-w-0 flex-1">
            <h2 class="text-ink mb-1 text-base leading-6 font-semibold">
              Take a screenshot
            </h2>
            <p class="text-ink-muted text-[13px] leading-5">
              Capture anything with ShareX. The link is copied to your clipboard
              automatically, and the file appears in Files.
            </p>
            <div class="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" href="/dashboard">
                Go to Files
              </Button>
              <Button variant="ghost" href="/dashboard/api-keys">
                Manage API keys
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
});

export const head: DocumentHead = {
  title: "ShareX setup - twink.forsale",
  meta: [
    {
      name: "description",
      content: "Connect ShareX so screenshots upload here automatically.",
    },
  ],
};
