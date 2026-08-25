import { component$, useSignal, useStore, $ } from "@builder.io/qwik";
import { routeLoader$, server$ } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Key, Trash2 } from "lucide-icons-qwik";
import { api, serverAuth, type ApiKeyListItem } from "~/lib/api-client";
import { getCurrentUser } from "~/lib/auth-client";
import { useToast } from "~/lib/toast-store";
import { formatRelativeDate, formatAbsoluteDate } from "~/lib/file-kinds";
import {
  Page,
  PageHeader,
  Surface,
  Button,
  IconButton,
  CopyButton,
  Field,
  Input,
  Callout,
  EmptyState,
  Dialog,
  Table,
  Thead,
  Tbody,
  Th,
  Tr,
  Td,
  TdMeta,
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

  return { apiKeys, isApproved: user.isApproved };
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
  const data = useApiKeys();
  const toast = useToast();

  const keys = useStore<{ items: ApiKeyListItem[] }>({
    items: [...data.value.apiKeys],
  });

  const name = useSignal("");
  const nameError = useSignal("");
  const creating = useSignal(false);
  /** The full key, shown once. The server only ever returns it at creation. */
  const revealed = useSignal<{ key: string; name: string } | null>(null);

  const pendingDelete = useSignal<ApiKeyListItem | null>(null);
  const deleteOpen = useSignal(false);
  const deleteBusy = useSignal(false);

  const create = $(async () => {
    nameError.value = "";
    if (!name.value.trim()) {
      nameError.value = "Give the key a name so you can recognise it later.";
      return;
    }

    creating.value = true;
    try {
      const created = await createApiKey(name.value.trim());
      revealed.value = { key: created.key, name: created.name };
      keys.items = [
        {
          id: created.id,
          name: created.name,
          maskedKey: `${created.key.slice(0, 8)}…${created.key.slice(-4)}`,
          createdAt: created.createdAt,
          lastUsed: null,
        },
        ...keys.items,
      ];
      name.value = "";
    } catch (error) {
      toast.error(
        "Could not create the key",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    } finally {
      creating.value = false;
    }
  });

  const confirmDelete = $(async () => {
    const target = pendingDelete.value;
    if (!target) return;
    deleteBusy.value = true;
    try {
      await deleteApiKey(target.id);
      keys.items = keys.items.filter((k) => k.id !== target.id);
      deleteOpen.value = false;
      toast.success(`Revoked “${target.name}”`);
    } catch (error) {
      toast.error(
        "Could not revoke the key",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    } finally {
      deleteBusy.value = false;
    }
  });

  return (
    <Page width="narrow">
      <PageHeader
        title="API keys"
        description="An API key lets a tool such as ShareX upload on your behalf. Each key works until you revoke it."
      />

      {!data.value.isApproved && (
        <Callout tone="warning" title="Account pending approval" class="mb-4">
          You can create keys once an administrator approves your account.
        </Callout>
      )}

      {revealed.value && (
        <Callout
          tone="success"
          title={`“${revealed.value.name}” created`}
          class="mb-4"
        >
          Copy it now — this is the only time the full key is shown. If you lose
          it, revoke the key and create a new one.
          <div class="border-edge bg-surface rounded-control mt-2 flex items-center gap-2 border px-2 py-1.5">
            <code class="text-ink min-w-0 flex-1 truncate font-mono text-xs">
              {revealed.value.key}
            </code>
            <CopyButton
              value={revealed.value.key}
              label="Copy key"
              variant="secondary"
            />
          </div>
          <Button
            q:slot="actions"
            size="sm"
            variant="ghost"
            onClick$={() => (revealed.value = null)}
          >
            Dismiss
          </Button>
        </Callout>
      )}

      <Surface class="mb-5">
        <div class="flex flex-wrap items-end gap-3">
          <Field
            label="Key name"
            for="key-name"
            error={nameError.value}
            help="Something you will recognise, e.g. “ShareX on my laptop”."
            class="min-w-[14rem] flex-1"
          >
            <Input
              id="key-name"
              value={name.value}
              maxLength={64}
              placeholder="ShareX desktop"
              onInput$={(_, el) => {
                name.value = el.value;
                nameError.value = "";
              }}
            />
          </Field>
          <Button
            variant="primary"
            loading={creating.value}
            disabled={!data.value.isApproved}
            onClick$={create}
            class={nameError.value ? "mb-[1.65rem]" : "mb-[1.65rem]"}
          >
            Create key
          </Button>
        </div>
      </Surface>

      {keys.items.length === 0 ? (
        <Surface flush>
          <EmptyState
            icon={Key}
            title="No API keys yet"
            description="Create one to connect ShareX or your own scripts."
          />
        </Surface>
      ) : (
        <Surface flush class="overflow-hidden">
          <Table label="Your API keys" minWidth="600px">
            <Thead>
              <Tr hover={false}>
                <Th>Name</Th>
                <Th class="w-44">Key</Th>
                <Th class="w-28">Created</Th>
                <Th class="w-32">Last used</Th>
                <Th class="w-20 text-right">Revoke</Th>
              </Tr>
            </Thead>
            <Tbody>
              {keys.items.map((key) => (
                <Tr key={key.id}>
                  <Td class="font-medium">{key.name}</Td>
                  <TdMeta class="font-mono">{key.maskedKey}</TdMeta>
                  <TdMeta title={formatAbsoluteDate(key.createdAt)}>
                    {formatRelativeDate(key.createdAt)}
                  </TdMeta>
                  <TdMeta
                    title={
                      key.lastUsed
                        ? formatAbsoluteDate(key.lastUsed)
                        : undefined
                    }
                  >
                    {key.lastUsed ? formatRelativeDate(key.lastUsed) : "Never"}
                  </TdMeta>
                  <Td class="text-right">
                    <IconButton
                      size="sm"
                      variant="danger"
                      label={`Revoke ${key.name}`}
                      onClick$={() => {
                        pendingDelete.value = key;
                        deleteOpen.value = true;
                      }}
                    >
                      <Trash2 class="h-4 w-4" />
                    </IconButton>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Surface>
      )}

      <Dialog open={deleteOpen} title="Revoke this API key?" size="sm">
        <p class="text-ink-muted text-[13px] leading-5">
          <span class="text-ink font-medium">{pendingDelete.value?.name}</span>{" "}
          stops working immediately. Anything using it — ShareX, scripts,
          integrations — will fail to upload until you give it a new key. This
          cannot be undone.
        </p>
        <Button
          q:slot="footer"
          variant="secondary"
          onClick$={() => (deleteOpen.value = false)}
        >
          Cancel
        </Button>
        <Button
          q:slot="footer"
          variant="danger"
          loading={deleteBusy.value}
          onClick$={confirmDelete}
        >
          Revoke key
        </Button>
      </Dialog>
    </Page>
  );
});

export const head: DocumentHead = {
  title: "API keys - twink.forsale",
  meta: [
    {
      name: "description",
      content: "Create and revoke API keys for uploading from other tools.",
    },
  ],
};
