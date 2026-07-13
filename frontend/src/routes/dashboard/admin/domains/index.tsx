import { component$, useSignal } from "@builder.io/qwik";
import {
  routeLoader$,
  Form,
  routeAction$,
  z,
  zod$,
} from "@builder.io/qwik-city";
import {
  Plus,
  Edit,
  Trash2,
  Globe,
  List,
  Save,
  CheckCircle,
  CircleX,
} from "lucide-icons-qwik";
import { Toggle } from "@luminescent/ui-qwik";
import { api, serverAuth, ApiError } from "~/lib/api-client";
import { getCurrentUser } from "~/lib/auth-client";
import {
  Badge,
  Button,
  Callout,
  FieldLabel,
  IconButton,
  Input,
  PageContainer,
  PageHeader,
  Panel,
} from "~/components/ui";

export const useAdminCheck = routeLoader$(async (requestEvent) => {
  const user = await getCurrentUser(serverAuth(requestEvent));
  if (!user) {
    throw requestEvent.redirect(302, "/");
  }
  if (!user.isAdmin) {
    throw requestEvent.redirect(302, "/dashboard");
  }
  return { isAdmin: true };
});

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
      return { success: true, message: "Upload domain created successfully" };
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500;
      return requestEvent.fail(status, {
        message:
          error instanceof Error ? error.message : "Failed to create domain",
      });
    }
  },
  zod$({
    domain: z.string().min(1, "Domain is required"),
    name: z.string().min(1, "Name is required"),
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
      return { success: true, message: "Upload domain updated successfully" };
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500;
      return requestEvent.fail(status, {
        message:
          error instanceof Error ? error.message : "Failed to update domain",
      });
    }
  },
  zod$({
    id: z.string(),
    domain: z.string().min(1, "Domain is required"),
    name: z.string().min(1, "Name is required"),
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
      return { success: true, message: "Upload domain deleted successfully" };
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500;
      return requestEvent.fail(status, {
        message:
          error instanceof Error ? error.message : "Failed to delete domain",
      });
    }
  },
  zod$({
    id: z.string(),
  }),
);

export default component$(() => {
  useAdminCheck();
  const domains = useUploadDomainsLoader();
  const createAction = useCreateDomainAction();
  const updateAction = useUpdateDomainAction();
  const deleteAction = useDeleteDomainAction();

  const showCreateForm = useSignal(false);
  const editingDomain = useSignal<string | null>(null);

  // Signals for edit form toggle states
  const editIsActive = useSignal(false);
  const editIsDefault = useSignal(false);
  const editSupportsSubdomains = useSignal(false);

  return (
    <PageContainer>
      <PageHeader
        align="left"
        title="Upload Domains Management~"
        icon={Globe}
        subtitle="Manage available upload domains for users."
      />

      {/* Create Domain Button */}
      <div class="mb-6 flex justify-start">
        <Button
          onClick$={() => {
            showCreateForm.value = !showCreateForm.value;
            editingDomain.value = null;
            // Reset edit form signals when switching to create form
            editIsActive.value = false;
            editIsDefault.value = false;
            editSupportsSubdomains.value = false;
          }}
        >
          <Plus class="h-4 w-4" />
          Add New Domain
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm.value && (
        <Panel title="Create New Upload Domain~" icon={Globe} class="mb-6">
          <Form action={createAction}>
            <div class="space-y-4 sm:space-y-6">
              <div>
                <FieldLabel>Domain</FieldLabel>
                <Input
                  type="text"
                  name="domain"
                  placeholder="example.com"
                  required
                />
                <p class="text-theme-text-muted mt-1.5 text-xs">
                  The top-level domain (e.g., "twink.forsale", "example.com")~
                </p>
              </div>

              <div>
                <FieldLabel>Display Name</FieldLabel>
                <Input
                  type="text"
                  name="name"
                  placeholder="Example Domain"
                  required
                />
                <p class="text-theme-text-muted mt-1.5 text-xs">
                  Friendly name shown to users~
                </p>
              </div>

              <div class="flex items-center gap-3">
                <Toggle
                  id="isDefault"
                  label="Set as default domain~"
                  checkbox
                  name="isDefault"
                />
              </div>

              <div class="flex items-center gap-3">
                <Toggle
                  id="supportsSubdomains"
                  label="Supports subdomains~"
                  checkbox
                  name="supportsSubdomains"
                />
              </div>

              {/* Hidden inputs to ensure checkbox values are always submitted */}
              <input type="hidden" name="isDefault" value="off" />
              <input type="hidden" name="supportsSubdomains" value="off" />

              <div class="flex gap-3">
                <Button type="submit" block>
                  <Save class="h-4 w-4" />
                  Create Domain~
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  block
                  onClick$={() => {
                    showCreateForm.value = false;
                    editIsActive.value = false;
                    editIsDefault.value = false;
                    editSupportsSubdomains.value = false;
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Form>

          {createAction.value?.success && (
            <Callout tone="success" icon={CheckCircle} class="mt-4 sm:mt-6">
              {createAction.value.message}~
            </Callout>
          )}

          {createAction.value?.failed && (
            <Callout tone="danger" icon={CircleX} class="mt-4 sm:mt-6">
              {createAction.value.message}~
            </Callout>
          )}
        </Panel>
      )}

      {/* Domains List */}
      <Panel title="Existing Domains~" icon={List}>
        <div class="space-y-4">
          {domains.value.map((domain) => (
            <div key={domain.id} class="glass rounded-2xl p-4 sm:p-5">
              {editingDomain.value === domain.id ? (
                <Form action={updateAction}>
                  <input type="hidden" name="id" value={domain.id} />
                  <div class="space-y-4">
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <FieldLabel>Domain</FieldLabel>
                        <Input
                          type="text"
                          name="domain"
                          value={domain.domain}
                          required
                        />
                      </div>
                      <div>
                        <FieldLabel>Display Name</FieldLabel>
                        <Input
                          type="text"
                          name="name"
                          value={domain.name}
                          required
                        />
                      </div>
                    </div>
                    <div class="flex flex-wrap gap-4">
                      <div class="flex items-center gap-2">
                        <Toggle
                          id={`isActive-${domain.id}`}
                          label="Active"
                          checkbox
                          name="isActive"
                          checked={editIsActive.value}
                          onChange$={(e, el) => {
                            editIsActive.value = el.checked;
                          }}
                        />
                      </div>
                      <div class="flex items-center gap-2">
                        <Toggle
                          id={`isDefault-${domain.id}`}
                          label="Default"
                          checkbox
                          name="isDefault"
                          checked={editIsDefault.value}
                          onChange$={(e, el) => {
                            editIsDefault.value = el.checked;
                          }}
                        />
                      </div>
                      <div class="flex items-center gap-2">
                        <Toggle
                          id={`supportsSubdomains-${domain.id}`}
                          label="Supports Subdomains"
                          checkbox
                          name="supportsSubdomains"
                          checked={editSupportsSubdomains.value}
                          onChange$={(e, el) => {
                            editSupportsSubdomains.value = el.checked;
                          }}
                        />
                      </div>
                    </div>
                    {/* Hidden inputs to ensure checkbox values are always submitted */}
                    <input
                      type="hidden"
                      name="isActive"
                      value={editIsActive.value ? "on" : "off"}
                    />
                    <input
                      type="hidden"
                      name="isDefault"
                      value={editIsDefault.value ? "on" : "off"}
                    />
                    <input
                      type="hidden"
                      name="supportsSubdomains"
                      value={editSupportsSubdomains.value ? "on" : "off"}
                    />

                    <div class="flex gap-2">
                      <Button type="submit" size="sm">
                        <Save class="h-4 w-4" />
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick$={() => {
                          editingDomain.value = null;
                          editIsActive.value = false;
                          editIsDefault.value = false;
                          editSupportsSubdomains.value = false;
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Form>
              ) : (
                <div class="flex items-center gap-4">
                  <div class="min-w-0 flex-1">
                    <div class="flex min-w-0 items-center gap-3">
                      <Globe class="text-theme-accent-primary h-5 w-5 flex-shrink-0" />
                      <div class="min-w-0">
                        <div class="flex min-w-0 flex-wrap items-center gap-2">
                          <h3 class="text-theme-text-primary font-semibold break-words">
                            {domain.name}
                          </h3>
                          {domain.isDefault && (
                            <Badge status="accent">Default</Badge>
                          )}
                          {domain.supportsSubdomains && (
                            <Badge status="info">Subdomains</Badge>
                          )}
                          {!domain.isActive && (
                            <Badge status="error">Inactive</Badge>
                          )}
                        </div>
                        <p class="text-theme-text-secondary text-sm font-medium break-all">
                          {domain.domain}
                        </p>
                        <p class="text-theme-text-muted text-xs">
                          {domain.userSettingsCount} users using this domain
                        </p>
                      </div>
                    </div>
                  </div>
                  <div class="flex flex-shrink-0 gap-1">
                    <IconButton
                      type="button"
                      title={`Edit ${domain.name}`}
                      onClick$={() => {
                        editingDomain.value = domain.id;
                        editIsActive.value = domain.isActive;
                        editIsDefault.value = domain.isDefault;
                        editSupportsSubdomains.value =
                          domain.supportsSubdomains;
                      }}
                    >
                      <Edit class="h-4 w-4" />
                    </IconButton>
                    <Form action={deleteAction}>
                      <input type="hidden" name="id" value={domain.id} />
                      <button
                        type="submit"
                        aria-label={`Delete ${domain.name}`}
                        title={`Delete ${domain.name}`}
                        class="text-theme-error hover:bg-theme-error/10 inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-200"
                        onClick$={(e) => {
                          if (
                            !confirm(
                              `Are you sure you want to delete ${domain.name}?`,
                            )
                          ) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <Trash2 class="h-4 w-4" />
                      </button>
                    </Form>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {updateAction.value?.success && (
          <Callout tone="success" icon={CheckCircle} class="mt-4 sm:mt-6">
            {updateAction.value.message}~
          </Callout>
        )}

        {(updateAction.value?.failed || deleteAction.value?.failed) && (
          <Callout tone="danger" icon={CircleX} class="mt-4 sm:mt-6">
            {updateAction.value?.message || deleteAction.value?.message}~
          </Callout>
        )}

        {deleteAction.value?.success && (
          <Callout tone="success" icon={CheckCircle} class="mt-4 sm:mt-6">
            {deleteAction.value.message}~
          </Callout>
        )}
      </Panel>
    </PageContainer>
  );
});
