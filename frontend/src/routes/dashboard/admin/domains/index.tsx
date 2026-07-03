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
import { Button, Card, PageContainer, PageHeader } from "~/components/ui";

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

  const inputClasses =
    "glass w-full rounded-full px-3 py-2 text-sm text-theme-text-primary placeholder:text-theme-text-muted transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-theme-accent-primary/50 sm:px-4 sm:py-3 sm:text-base";

  return (
    <PageContainer>
      <PageHeader
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
        <Card class="mb-6">
          <h2 class="text-gradient-cute mb-4 flex items-center gap-2 text-lg font-bold sm:mb-6 sm:text-xl">
            <Globe class="h-5 w-5" />
            Create New Upload Domain~
          </h2>

          <Form action={createAction}>
            <div class="space-y-4 sm:space-y-6">
              <div>
                <label class="text-theme-text-secondary mb-2 block text-xs font-medium sm:text-sm">
                  Domain~
                </label>
                <input
                  type="text"
                  name="domain"
                  placeholder="example.com"
                  class={inputClasses}
                  required
                />
                <p class="text-theme-text-muted mt-2 pl-3 text-xs sm:pl-4">
                  The top-level domain (e.g., "twink.forsale", "example.com")~
                </p>
              </div>

              <div>
                <label class="text-theme-text-secondary mb-2 block text-xs font-medium sm:text-sm">
                  Display Name~
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Example Domain"
                  class={inputClasses}
                  required
                />
                <p class="text-theme-text-muted mt-2 pl-3 text-xs sm:pl-4">
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
                <button
                  type="submit"
                  class="btn-cute text-theme-text-primary inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 sm:px-6 sm:py-3 sm:text-base"
                >
                  <Save class="h-4 w-4" />
                  Create Domain~
                </button>
                <button
                  type="button"
                  onClick$={() => {
                    showCreateForm.value = false;
                    // Reset edit form signals
                    editIsActive.value = false;
                    editIsDefault.value = false;
                    editSupportsSubdomains.value = false;
                  }}
                  class="text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary/20 flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 sm:px-6 sm:py-3 sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Form>

          {createAction.value?.success && (
            <div class="from-theme-accent-secondary/20 to-theme-accent-tertiary/20 border-theme-accent-secondary/30 glass mt-4 rounded-2xl border bg-gradient-to-br p-3 sm:mt-6 sm:p-4">
              <p class="text-theme-accent-secondary flex items-center gap-2 text-xs sm:text-sm">
                <CheckCircle class="h-4 w-4 flex-shrink-0" />
                {createAction.value.message}~
              </p>
            </div>
          )}

          {createAction.value?.failed && (
            <div class="from-theme-accent-primary/20 to-theme-accent-secondary/20 border-theme-accent-primary/30 glass mt-4 rounded-2xl border bg-gradient-to-br p-3 sm:mt-6 sm:p-4">
              <p class="text-theme-accent-primary flex items-center gap-2 text-xs sm:text-sm">
                <CircleX class="h-4 w-4 flex-shrink-0" />
                {createAction.value.message}~
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Domains List */}
      <Card>
        <h2 class="text-gradient-cute mb-4 flex items-center gap-2 text-lg font-bold sm:mb-6 sm:text-xl">
          <List class="h-5 w-5" />
          Existing Domains~
        </h2>

        <div class="space-y-4">
          {domains.value.map((domain) => (
            <div key={domain.id} class="glass rounded-2xl p-4 sm:p-5">
              {editingDomain.value === domain.id ? (
                <Form action={updateAction}>
                  <input type="hidden" name="id" value={domain.id} />
                  <div class="space-y-4">
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label class="text-theme-text-secondary mb-2 block text-xs font-medium">
                          Domain
                        </label>
                        <input
                          type="text"
                          name="domain"
                          value={domain.domain}
                          class={inputClasses}
                          required
                        />
                      </div>
                      <div>
                        <label class="text-theme-text-secondary mb-2 block text-xs font-medium">
                          Display Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={domain.name}
                          class={inputClasses}
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
                      <button
                        type="submit"
                        class="btn-cute text-theme-text-primary rounded-full px-4 py-2 text-xs font-medium"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick$={() => {
                          editingDomain.value = null;
                          // Reset edit form signals
                          editIsActive.value = false;
                          editIsDefault.value = false;
                          editSupportsSubdomains.value = false;
                        }}
                        class="text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary/20 rounded-full px-4 py-2 text-xs font-medium transition-all duration-300"
                      >
                        Cancel
                      </button>
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
                            <span class="from-theme-accent-secondary to-theme-accent-tertiary rounded-full bg-gradient-to-br px-2 py-1 text-xs font-medium text-white">
                              Default
                            </span>
                          )}
                          {domain.supportsSubdomains && (
                            <span class="from-theme-accent-primary to-theme-accent-secondary rounded-full bg-gradient-to-br px-2 py-1 text-xs font-medium text-white">
                              Subdomains
                            </span>
                          )}
                          {!domain.isActive && (
                            <span class="from-theme-deny to-theme-deny-hover rounded-full bg-gradient-to-br px-2 py-1 text-xs font-medium text-white">
                              Inactive
                            </span>
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
                    <button
                      type="button"
                      aria-label={`Edit ${domain.name}`}
                      title={`Edit ${domain.name}`}
                      onClick$={() => {
                        editingDomain.value = domain.id;
                        // Initialize edit form signals with current domain values
                        editIsActive.value = domain.isActive;
                        editIsDefault.value = domain.isDefault;
                        editSupportsSubdomains.value =
                          domain.supportsSubdomains;
                      }}
                      class="text-theme-accent-secondary hover:bg-theme-bg-tertiary/20 hover:text-theme-accent-primary rounded-full p-2 transition-all duration-300"
                    >
                      <Edit class="h-4 w-4" />
                    </button>
                    <Form action={deleteAction}>
                      <input type="hidden" name="id" value={domain.id} />
                      <button
                        type="submit"
                        aria-label={`Delete ${domain.name}`}
                        title={`Delete ${domain.name}`}
                        class="text-theme-error hover:bg-theme-error/20 hover:text-theme-error rounded-full p-2 transition-all duration-300"
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
          <div class="from-theme-accent-secondary/20 to-theme-accent-tertiary/20 border-theme-accent-secondary/30 glass mt-4 rounded-2xl border bg-gradient-to-br p-3 sm:mt-6 sm:p-4">
            <p class="text-theme-accent-secondary flex items-center gap-2 text-xs sm:text-sm">
              <CheckCircle class="h-4 w-4 flex-shrink-0" />
              {updateAction.value.message}~
            </p>
          </div>
        )}

        {(updateAction.value?.failed || deleteAction.value?.failed) && (
          <div class="from-theme-accent-primary/20 to-theme-accent-secondary/20 border-theme-accent-primary/30 glass mt-4 rounded-2xl border bg-gradient-to-br p-3 sm:mt-6 sm:p-4">
            <p class="text-theme-accent-primary flex items-center gap-2 text-xs sm:text-sm">
              <CircleX class="h-4 w-4 flex-shrink-0" />
              {updateAction.value?.message || deleteAction.value?.message}~
            </p>
          </div>
        )}

        {deleteAction.value?.success && (
          <div class="from-theme-accent-secondary/20 to-theme-accent-tertiary/20 border-theme-accent-secondary/30 glass mt-4 rounded-2xl border bg-gradient-to-br p-3 sm:mt-6 sm:p-4">
            <p class="text-theme-accent-secondary flex items-center gap-2 text-xs sm:text-sm">
              <CheckCircle class="h-4 w-4 flex-shrink-0" />
              {deleteAction.value.message}~
            </p>
          </div>
        )}
      </Card>
    </PageContainer>
  );
});
