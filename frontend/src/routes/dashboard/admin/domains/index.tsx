import { component$, useSignal } from "@builder.io/qwik";
import {
  routeLoader$,
  routeAction$,
  Form,
  z,
  zod$,
  type DocumentHead,
} from "@builder.io/qwik-city";
import { Globe, Plus, Trash2, Edit } from "lucide-icons-qwik";
import { api, serverAuth, ApiError, type DomainDto } from "~/lib/api-client";
import {
  PageHeader,
  Surface,
  Button,
  IconButton,
  Field,
  Input,
  Switch,
  Badge,
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

export const useUploadDomainsLoader = routeLoader$(async (requestEvent) => {
  const { domains } = await api.domains
    .list(serverAuth(requestEvent))
    .catch(() => ({ domains: [] }));
  return domains;
});

export const useCreateDomainAction = routeAction$(
  async (values, requestEvent) => {
    try {
      await api.domains.create(
        {
          domain: values.domain,
          name: values.name,
          isActive: true,
          isDefault: values.isDefault ?? false,
          supportsSubdomains: values.supportsSubdomains ?? false,
        },
        serverAuth(requestEvent),
      );
      return { success: true, message: "Domain added." };
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500;
      return requestEvent.fail(status, {
        message:
          error instanceof Error ? error.message : "Could not add the domain.",
      });
    }
  },
  zod$({
    domain: z.string().min(1, "Enter the domain"),
    name: z.string().min(1, "Enter a name"),
    isDefault: z
      .string()
      .optional()
      .transform((val) => val === "on"),
    supportsSubdomains: z
      .string()
      .optional()
      .transform((val) => val === "on"),
  }),
);

export const useUpdateDomainAction = routeAction$(
  async (values, requestEvent) => {
    try {
      await api.domains.update(
        values.id,
        {
          domain: values.domain,
          name: values.name,
          isActive: values.isActive ?? true,
          isDefault: values.isDefault ?? false,
          supportsSubdomains: values.supportsSubdomains ?? false,
        },
        serverAuth(requestEvent),
      );
      return { success: true, message: "Domain updated." };
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500;
      return requestEvent.fail(status, {
        message:
          error instanceof Error
            ? error.message
            : "Could not update the domain.",
      });
    }
  },
  zod$({
    id: z.string(),
    domain: z.string().min(1, "Enter the domain"),
    name: z.string().min(1, "Enter a name"),
    isActive: z
      .string()
      .optional()
      .transform((val) => val === "on"),
    isDefault: z
      .string()
      .optional()
      .transform((val) => val === "on"),
    supportsSubdomains: z
      .string()
      .optional()
      .transform((val) => val === "on"),
  }),
);

export const useDeleteDomainAction = routeAction$(
  async (values, requestEvent) => {
    try {
      await api.domains.delete(values.id, serverAuth(requestEvent));
      return { success: true, message: "Domain deleted." };
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500;
      return requestEvent.fail(status, {
        message:
          error instanceof Error
            ? error.message
            : "Could not delete the domain.",
      });
    }
  },
  zod$({ id: z.string() }),
);

export default component$(() => {
  const domains = useUploadDomainsLoader();
  const createAction = useCreateDomainAction();
  const updateAction = useUpdateDomainAction();
  const deleteAction = useDeleteDomainAction();

  const createOpen = useSignal(false);
  const editing = useSignal<DomainDto | null>(null);
  const editOpen = useSignal(false);
  const pendingDelete = useSignal<DomainDto | null>(null);
  const deleteOpen = useSignal(false);

  // Switch state for the edit dialog, mirrored into hidden checkbox inputs so
  // the existing `on`-based action contract is unchanged.
  const editIsActive = useSignal(false);
  const editIsDefault = useSignal(false);
  const editSupportsSubdomains = useSignal(false);
  const newIsDefault = useSignal(false);
  const newSupportsSubdomains = useSignal(false);

  return (
    <>
      <PageHeader
        title="Domains"
        description="Domains that can serve uploaded files. The default is used for accounts that have not chosen one."
      >
        <Button
          q:slot="actions"
          variant="primary"
          onClick$={() => {
            newIsDefault.value = false;
            newSupportsSubdomains.value = false;
            createOpen.value = true;
          }}
        >
          <Plus class="h-4 w-4" aria-hidden="true" />
          Add domain
        </Button>
      </PageHeader>

      {createAction.value?.failed && (
        <Callout tone="danger" title="Could not add the domain" class="mb-4">
          {createAction.value.message}
        </Callout>
      )}
      {updateAction.value?.failed && (
        <Callout tone="danger" title="Could not update the domain" class="mb-4">
          {updateAction.value.message}
        </Callout>
      )}
      {deleteAction.value?.failed && (
        <Callout tone="danger" title="Could not delete the domain" class="mb-4">
          {deleteAction.value.message}
        </Callout>
      )}

      {domains.value.length === 0 ? (
        <Surface flush>
          <EmptyState
            icon={Globe}
            title="No domains configured"
            description="Add at least one domain so uploaded files have an address."
          >
            <Button
              variant="primary"
              onClick$={() => (createOpen.value = true)}
            >
              Add domain
            </Button>
          </EmptyState>
        </Surface>
      ) : (
        <>
          <Surface flush class="hidden overflow-hidden md:block">
            <Table label="Upload domains" minWidth="720px">
              <Thead>
                <Tr hover={false}>
                  <Th>Domain</Th>
                  <Th>Name</Th>
                  <Th class="w-44">Status</Th>
                  <Th class="w-24">In use by</Th>
                  <Th class="w-24 text-right">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {domains.value.map((domain) => (
                  <Tr key={domain.id}>
                    <Td class="font-mono">{domain.domain}</Td>
                    <Td>{domain.name}</Td>
                    <Td>
                      <div class="flex flex-wrap gap-1">
                        <Badge tone={domain.isActive ? "success" : "neutral"}>
                          {domain.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {domain.isDefault && (
                          <Badge tone="accent">Default</Badge>
                        )}
                        {domain.supportsSubdomains && (
                          <Badge tone="info">Subdomains</Badge>
                        )}
                      </div>
                    </Td>
                    <TdMeta class="tabular-nums">
                      {domain.userSettingsCount} account
                      {domain.userSettingsCount === 1 ? "" : "s"}
                    </TdMeta>
                    <Td class="text-right">
                      <div class="flex items-center justify-end gap-1">
                        <IconButton
                          size="sm"
                          label={`Edit ${domain.domain}`}
                          onClick$={() => {
                            editing.value = domain;
                            editIsActive.value = domain.isActive;
                            editIsDefault.value = domain.isDefault;
                            editSupportsSubdomains.value =
                              domain.supportsSubdomains;
                            editOpen.value = true;
                          }}
                        >
                          <Edit class="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          size="sm"
                          variant="danger"
                          label={`Delete ${domain.domain}`}
                          onClick$={() => {
                            pendingDelete.value = domain;
                            deleteOpen.value = true;
                          }}
                        >
                          <Trash2 class="h-4 w-4" />
                        </IconButton>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Surface>

          <Surface flush class="overflow-hidden md:hidden">
            <ul class="divide-edge divide-y">
              {domains.value.map((domain) => (
                <li
                  key={domain.id}
                  class="flex items-start gap-2.5 px-3 py-2.5"
                >
                  <div class="min-w-0 flex-1">
                    <p class="text-ink truncate font-mono text-[13px] font-medium">
                      {domain.domain}
                    </p>
                    <p class="text-ink-muted truncate text-xs">{domain.name}</p>
                    <div class="mt-1.5 flex flex-wrap gap-1">
                      <Badge tone={domain.isActive ? "success" : "neutral"}>
                        {domain.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {domain.isDefault && <Badge tone="accent">Default</Badge>}
                      {domain.supportsSubdomains && (
                        <Badge tone="info">Subdomains</Badge>
                      )}
                    </div>
                  </div>
                  <div class="flex shrink-0 items-center gap-1">
                    <IconButton
                      size="sm"
                      label={`Edit ${domain.domain}`}
                      onClick$={() => {
                        editing.value = domain;
                        editIsActive.value = domain.isActive;
                        editIsDefault.value = domain.isDefault;
                        editSupportsSubdomains.value =
                          domain.supportsSubdomains;
                        editOpen.value = true;
                      }}
                    >
                      <Edit class="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      size="sm"
                      variant="danger"
                      label={`Delete ${domain.domain}`}
                      onClick$={() => {
                        pendingDelete.value = domain;
                        deleteOpen.value = true;
                      }}
                    >
                      <Trash2 class="h-4 w-4" />
                    </IconButton>
                  </div>
                </li>
              ))}
            </ul>
          </Surface>
        </>
      )}

      {/* Add */}
      <Dialog open={createOpen} title="Add upload domain">
        <Form action={createAction} class="grid gap-4">
          <Field
            label="Domain"
            for="new-domain"
            required
            help="Hostname only, without a scheme. DNS must already point here."
          >
            <Input
              id="new-domain"
              name="domain"
              required
              placeholder="cdn.example.com"
            />
          </Field>
          <Field
            label="Name"
            for="new-domain-name"
            required
            help="Shown to users when picking a domain."
          >
            <Input
              id="new-domain-name"
              name="name"
              required
              placeholder="Primary CDN"
            />
          </Field>
          <Switch
            checked={newIsDefault.value}
            label="Make this the default"
            help="New accounts and accounts without a choice use this domain."
            onChange$={(checked) => (newIsDefault.value = checked)}
          />
          <Switch
            checked={newSupportsSubdomains.value}
            label="Allow per-user subdomains"
            help="Users can serve files from name.domain instead of the bare domain."
            onChange$={(checked) => (newSupportsSubdomains.value = checked)}
          />
          {newIsDefault.value && (
            <input type="hidden" name="isDefault" value="on" />
          )}
          {newSupportsSubdomains.value && (
            <input type="hidden" name="supportsSubdomains" value="on" />
          )}
          <div class="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick$={() => (createOpen.value = false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={createAction.isRunning}
            >
              Add domain
            </Button>
          </div>
        </Form>
      </Dialog>

      {/* Edit */}
      <Dialog
        open={editOpen}
        title={`Edit ${editing.value?.domain ?? "domain"}`}
      >
        <Form action={updateAction} class="grid gap-4">
          <input type="hidden" name="id" value={editing.value?.id} />
          <Field label="Domain" for="edit-domain" required>
            <Input
              id="edit-domain"
              name="domain"
              required
              value={editing.value?.domain}
            />
          </Field>
          <Field label="Name" for="edit-domain-name" required>
            <Input
              id="edit-domain-name"
              name="name"
              required
              value={editing.value?.name}
            />
          </Field>
          <Switch
            checked={editIsActive.value}
            label="Active"
            help="Inactive domains stop being offered and stop serving new links."
            onChange$={(checked) => (editIsActive.value = checked)}
          />
          <Switch
            checked={editIsDefault.value}
            label="Default domain"
            onChange$={(checked) => (editIsDefault.value = checked)}
          />
          <Switch
            checked={editSupportsSubdomains.value}
            label="Allow per-user subdomains"
            onChange$={(checked) => (editSupportsSubdomains.value = checked)}
          />
          {editIsActive.value && (
            <input type="hidden" name="isActive" value="on" />
          )}
          {editIsDefault.value && (
            <input type="hidden" name="isDefault" value="on" />
          )}
          {editSupportsSubdomains.value && (
            <input type="hidden" name="supportsSubdomains" value="on" />
          )}
          <div class="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick$={() => (editOpen.value = false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={updateAction.isRunning}
            >
              Save domain
            </Button>
          </div>
        </Form>
      </Dialog>

      {/* Delete */}
      <Dialog open={deleteOpen} title="Delete this domain?" size="sm">
        <p class="text-ink-muted text-[13px] leading-5">
          <span class="text-ink font-mono">{pendingDelete.value?.domain}</span>{" "}
          is removed from the list of upload domains.
          {pendingDelete.value && pendingDelete.value.userSettingsCount > 0 && (
            <>
              {" "}
              {pendingDelete.value.userSettingsCount} account
              {pendingDelete.value.userSettingsCount === 1 ? "" : "s"} currently
              use it and will fall back to the default.
            </>
          )}{" "}
          Existing links on this domain stop resolving.
        </p>
        <Button
          q:slot="footer"
          variant="secondary"
          onClick$={() => (deleteOpen.value = false)}
        >
          Cancel
        </Button>
        <Form q:slot="footer" action={deleteAction}>
          <input type="hidden" name="id" value={pendingDelete.value?.id} />
          <Button
            type="submit"
            variant="danger"
            loading={deleteAction.isRunning}
          >
            Delete domain
          </Button>
        </Form>
      </Dialog>
    </>
  );
});

export const head: DocumentHead = {
  title: "Domains - Admin - twink.forsale",
};
