import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import {
  routeLoader$,
  routeAction$,
  Form,
  z,
  zod$,
  type DocumentHead,
} from "@builder.io/qwik-city";
import { Upload, Palette, Key, UserCog } from "lucide-icons-qwik";
import { api, serverAuth, ApiError } from "~/lib/api-client";
import { getCurrentUser } from "~/lib/auth-client";
import { useToast } from "~/lib/toast-store";
import {
  useGlobalParticle,
  updateGlobalParticleConfig,
} from "~/lib/global-particle-store";
import { ParticleConfigPanel } from "~/components/ui/particle-config-panel";
import {
  Page,
  PageHeader,
  Section,
  Surface,
  Button,
  Field,
  Input,
  Select,
  Callout,
  ThemeToggle,
  Dialog,
  Divider,
} from "~/components/ui";

export const useUserLoader = routeLoader$(async (requestEvent) => {
  const auth = serverAuth(requestEvent);
  const user = await getCurrentUser(auth);
  if (!user) {
    throw requestEvent.redirect(302, "/");
  }

  const settings = await api.settings.get(auth).catch(() => null);
  return {
    user: {
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      uploadDomainId: settings?.uploadDomainId ?? null,
      customSubdomain: settings?.customSubdomain ?? null,
      defaultExpirationDays: settings?.defaultExpirationDays ?? null,
      defaultMaxViews: settings?.defaultMaxViews ?? null,
      globalParticleConfig: settings?.globalParticleConfig ?? null,
    },
  };
});

export const useUploadDomainsLoader = routeLoader$(async (requestEvent) => {
  const { domains } = await api.domains
    .list(serverAuth(requestEvent))
    .catch(() => ({ domains: [] }));
  return domains.filter((d) => d.isActive);
});

export const useUpdateSettingsAction = routeAction$(
  async (values, requestEvent) => {
    try {
      await api.settings.update(
        {
          uploadDomainId: values.uploadDomainId || null,
          customSubdomain: values.customSubdomain || null,
          defaultExpirationDays: values.defaultExpirationDays ?? null,
          defaultMaxViews: values.defaultMaxViews ?? null,
        },
        serverAuth(requestEvent),
      );
      return { success: true, message: "Upload defaults saved." };
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500;
      return requestEvent.fail(status, {
        message:
          error instanceof Error
            ? error.message
            : "Could not save your settings.",
      });
    }
  },
  zod$({
    uploadDomainId: z.string().optional(),
    customSubdomain: z.string().optional(),
    defaultExpirationDays: z
      .string()
      .optional()
      .transform((val) => (val === "" ? undefined : Number(val)))
      .pipe(z.number().min(1).max(365).optional()),
    defaultMaxViews: z
      .string()
      .optional()
      .transform((val) => (val === "" ? undefined : Number(val)))
      .pipe(z.number().min(1).optional()),
  }),
);

export const useUpdateParticleConfigAction = routeAction$(
  async (values, requestEvent) => {
    try {
      await api.settings.updateParticles(
        JSON.stringify(values.config),
        serverAuth(requestEvent),
      );
      return { success: true, message: "Particle settings saved." };
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500;
      return requestEvent.fail(status, {
        message:
          error instanceof Error
            ? error.message
            : "Could not save your particle settings.",
      });
    }
  },
);

export const useDeleteAccountAction = routeAction$(
  async (values, requestEvent) => {
    if (values.confirmationText !== "DELETE MY ACCOUNT") {
      return requestEvent.fail(400, {
        message: "Type DELETE MY ACCOUNT exactly to confirm.",
      });
    }

    try {
      await api.settings.deleteAccount(serverAuth(requestEvent));
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500;
      return requestEvent.fail(status, {
        message:
          error instanceof Error
            ? error.message
            : "Could not delete the account. Contact an administrator.",
      });
    }

    // The backend owns session teardown; send the user home.
    throw requestEvent.redirect(302, "/");
  },
  zod$({
    confirmationText: z.string().min(1, "Confirmation is required"),
  }),
);

const SECTIONS = [
  { id: "uploads", label: "Upload defaults", icon: Upload },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "keys", label: "API keys", icon: Key },
  { id: "account", label: "Account", icon: UserCog },
];

export default component$(() => {
  const data = useUserLoader();
  const domains = useUploadDomainsLoader();
  const updateAction = useUpdateSettingsAction();
  const particleAction = useUpdateParticleConfigAction();
  const deleteAction = useDeleteAccountAction();
  const globalParticle = useGlobalParticle();
  const toast = useToast();

  const active = useSignal("uploads");
  const deleteOpen = useSignal(false);
  const confirmationText = useSignal("");

  const particleConfig = useSignal({ ...globalParticle.config });

  // Particle changes take effect immediately, like the theme; the explicit
  // save only persists them to the account.
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    const next = track(() => particleConfig.value);
    updateGlobalParticleConfig(globalParticle, next);
  });

  const saveParticles = $(async () => {
    const result = await particleAction.submit({
      config: particleConfig.value,
    });
    if (result.value.failed) {
      toast.error("Could not save", result.value.message);
    } else {
      toast.success("Particle settings saved");
    }
  });

  const selectedDomain =
    data.value.user.uploadDomainId ||
    domains.value.find((d) => d.isDefault)?.id ||
    domains.value[0]?.id ||
    "";

  return (
    <Page>
      <PageHeader title="Settings" />

      <div class="flex flex-col gap-6 md:flex-row md:gap-8">
        <nav aria-label="Settings sections" class="shrink-0 md:w-48 md:pt-0.5">
          <ul class="border-edge -mx-4 flex gap-1 overflow-x-auto border-b px-4 pb-2 md:mx-0 md:flex-col md:border-b-0 md:px-0 md:pb-0">
            {SECTIONS.map((section, index) => {
              const isActive = active.value === section.id;
              return (
                <li key={section.id} class="shrink-0 md:shrink">
                  <button
                    type="button"
                    aria-current={isActive ? "true" : undefined}
                    onClick$={() => (active.value = SECTIONS[index].id)}
                    class={`focus-ring rounded-control flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[13px] transition-colors duration-150 ${
                      isActive
                        ? "bg-accent-soft text-accent-text font-medium"
                        : "text-ink-muted hover:bg-surface-hover hover:text-ink"
                    }`}
                  >
                    <section.icon class="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span class="truncate">{section.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div class="max-w-2xl min-w-0 flex-1">
          {active.value === "uploads" && (
            <Section
              title="Upload defaults"
              description="Applied to new uploads. You can still override them for an individual upload."
            >
              <Form action={updateAction}>
                <Surface>
                  <div class="grid gap-4">
                    <Field
                      label="Upload domain"
                      for="upload-domain"
                      help="The domain your file links use."
                    >
                      <Select
                        id="upload-domain"
                        name="uploadDomainId"
                        value={selectedDomain}
                      >
                        {domains.value.length === 0 && (
                          <option value="">No domains available</option>
                        )}
                        {domains.value.map((domain) => (
                          <option key={domain.id} value={domain.id}>
                            {`${domain.domain}${domain.isDefault ? " (default)" : ""}`}
                          </option>
                        ))}
                      </Select>
                    </Field>

                    <Field
                      label="Custom subdomain"
                      for="custom-subdomain"
                      help="Optional. Your links become yourname.domain — only works on domains that allow subdomains."
                    >
                      <Input
                        id="custom-subdomain"
                        name="customSubdomain"
                        value={data.value.user.customSubdomain ?? ""}
                        placeholder="yourname"
                        maxLength={40}
                      />
                    </Field>

                    <div class="grid gap-4 sm:grid-cols-2">
                      <Field
                        label="Delete files after"
                        for="default-expiration"
                        help="Days. Empty keeps files indefinitely."
                      >
                        <Input
                          id="default-expiration"
                          name="defaultExpirationDays"
                          type="number"
                          min="1"
                          max="365"
                          inputMode="numeric"
                          placeholder="Never"
                          value={data.value.user.defaultExpirationDays ?? ""}
                        />
                      </Field>
                      <Field
                        label="Default view limit"
                        for="default-max-views"
                        help="A file stops being served after this many views. Empty means unlimited."
                      >
                        <Input
                          id="default-max-views"
                          name="defaultMaxViews"
                          type="number"
                          min="1"
                          inputMode="numeric"
                          placeholder="Unlimited"
                          value={data.value.user.defaultMaxViews ?? ""}
                        />
                      </Field>
                    </div>
                  </div>
                </Surface>

                <div class="mt-3 flex items-center gap-3">
                  <Button
                    type="submit"
                    variant="primary"
                    loading={updateAction.isRunning}
                  >
                    Save upload defaults
                  </Button>
                  {updateAction.value?.success && (
                    <span class="text-success text-[13px]" aria-live="polite">
                      Saved
                    </span>
                  )}
                </div>

                {updateAction.value?.failed && (
                  <Callout tone="danger" class="mt-3">
                    {updateAction.value.message}
                  </Callout>
                )}
              </Form>
            </Section>
          )}

          {active.value === "appearance" && (
            <div class="grid gap-6">
              <Section
                title="Theme"
                description="Applies immediately and is remembered on this device."
              >
                <ThemeToggle variant="list" />
              </Section>

              <Divider />

              <Section
                title="Particles"
                description="Applies immediately. Save to keep it on your account."
              >
                <Surface>
                  <ParticleConfigPanel config={particleConfig} />
                </Surface>
                <div class="mt-3 flex items-center gap-3">
                  <Button
                    variant="primary"
                    loading={particleAction.isRunning}
                    onClick$={saveParticles}
                  >
                    Save particle settings
                  </Button>
                </div>
              </Section>
            </div>
          )}

          {active.value === "keys" && (
            <Section
              title="API keys"
              description="Keys let other tools upload on your behalf."
            >
              <Surface>
                <p class="text-ink-muted text-[13px] leading-5">
                  API keys are managed on their own page, where you can see when
                  each was last used and revoke individual keys.
                </p>
                <div class="mt-3 flex flex-wrap gap-2">
                  <Button variant="primary" href="/dashboard/api-keys">
                    Manage API keys
                  </Button>
                  <Button variant="secondary" href="/setup/sharex">
                    ShareX setup
                  </Button>
                </div>
              </Surface>
            </Section>
          )}

          {active.value === "account" && (
            <div class="grid gap-6">
              <Section title="Account">
                <Surface>
                  <dl class="divide-edge divide-y">
                    <div class="flex flex-wrap items-baseline justify-between gap-x-4 py-1.5">
                      <dt class="text-ink-muted text-[13px]">Name</dt>
                      <dd class="text-ink text-[13px]">
                        {data.value.user.name || "Not set"}
                      </dd>
                    </div>
                    <div class="flex flex-wrap items-baseline justify-between gap-x-4 py-1.5">
                      <dt class="text-ink-muted text-[13px]">Email</dt>
                      <dd class="text-ink text-[13px]">
                        {data.value.user.email}
                      </dd>
                    </div>
                    <div class="flex flex-wrap items-baseline justify-between gap-x-4 py-1.5">
                      <dt class="text-ink-muted text-[13px]">Role</dt>
                      <dd class="text-ink text-[13px]">
                        {data.value.user.isAdmin ? "Administrator" : "Member"}
                      </dd>
                    </div>
                  </dl>
                  <p class="text-ink-muted mt-3 text-xs">
                    Your name and email come from Discord and update when you
                    sign in again.
                  </p>
                </Surface>
              </Section>

              <Divider />

              <Section
                title="Delete account"
                description="Removes your account, every file you have uploaded, your short links and your bio page."
              >
                <Button
                  variant="secondary"
                  class="text-danger hover:text-danger"
                  onClick$={() => (deleteOpen.value = true)}
                >
                  Delete my account
                </Button>
              </Section>
            </div>
          )}
        </div>
      </div>

      <Dialog open={deleteOpen} title="Delete your account?" size="sm">
        <p class="text-ink-muted text-[13px] leading-5">
          Every file you have uploaded stops working immediately, along with
          your short links and bio page. Nothing can be recovered afterwards.
        </p>
        <Form action={deleteAction} class="mt-4">
          <Field
            label="Type DELETE MY ACCOUNT to confirm"
            for="delete-confirmation"
            error={
              deleteAction.value?.failed
                ? deleteAction.value.message
                : undefined
            }
          >
            <Input
              id="delete-confirmation"
              name="confirmationText"
              autoComplete="off"
              value={confirmationText.value}
              onInput$={(_, el) => (confirmationText.value = el.value)}
            />
          </Field>
          <div class="mt-4 flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick$={() => (deleteOpen.value = false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              loading={deleteAction.isRunning}
              disabled={confirmationText.value !== "DELETE MY ACCOUNT"}
            >
              Delete account
            </Button>
          </div>
        </Form>
      </Dialog>
    </Page>
  );
});

export const head: DocumentHead = {
  title: "Settings - twink.forsale",
  meta: [
    {
      name: "description",
      content: "Upload defaults, appearance, API keys and account settings.",
    },
  ],
};
