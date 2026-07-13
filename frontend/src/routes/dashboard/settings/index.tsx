import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import {
  routeLoader$,
  Form,
  routeAction$,
  z,
  zod$,
} from "@builder.io/qwik-city";
import { themes, type ThemeName } from "~/lib/theme-store";
import {
  Palette,
  Sparkles,
  Sun,
  Moon,
  Heart,
  Zap,
  Eye,
  Settings as SettingsIcon,
  Trash2,
  AlertTriangle,
  Globe,
  CheckCircle,
  CircleX,
  Save,
  Snowflake,
  Star,
  Circle,
  CircleOff,
  PartyPopper,
} from "lucide-icons-qwik";
import { api, serverAuth, ApiError } from "~/lib/api-client";
import { getCurrentUser } from "~/lib/auth-client";
import { setThemePreference } from "~/lib/cookie-utils";
import { ParticleConfigPanel } from "~/components/ui/particle-config-panel";
import {
  Badge,
  Button,
  Callout,
  FieldLabel,
  Input,
  PageContainer,
  PageHeader,
  Panel,
  Select,
} from "~/components/ui";
import {
  useGlobalParticle,
  updateGlobalParticleConfig,
  themeParticleConfigs,
} from "~/lib/global-particle-store";
export const useUserLoader = routeLoader$(async (requestEvent) => {
  const auth = serverAuth(requestEvent);
  const user = await getCurrentUser(auth);
  if (!user) {
    throw requestEvent.redirect(302, "/");
  }

  const settings = await api.settings.get(auth).catch(() => null);
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
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
      return { success: true, message: "Settings updated successfully" };
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500;
      return requestEvent.fail(status, {
        message:
          error instanceof Error ? error.message : "Failed to update settings",
      });
    }
  },
  zod$({
    uploadDomainId: z.string().optional(),
    customSubdomain: z.string().optional(),
    defaultExpirationDays: z.string().optional().transform((val) => val === "" ? undefined : Number(val)).pipe(z.number().min(1).max(365).optional()),
    defaultMaxViews: z.string().optional().transform((val) => val === "" ? undefined : Number(val)).pipe(z.number().min(1).optional()),
  }),
);

export const useUpdateParticleConfigAction = routeAction$(
  async (values, requestEvent) => {
    try {
      await api.settings.updateParticles(
        JSON.stringify(values.config),
        serverAuth(requestEvent),
      );
      return { success: true, message: "Particle settings saved successfully" };
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500;
      return requestEvent.fail(status, {
        message:
          error instanceof Error
            ? error.message
            : "Failed to save particle settings",
      });
    }
  },
  zod$({
    config: z.object({
      type: z.string(),
      amount: z.number(),
      speed: z.number(),
      direction: z.string(),
      colors: z.array(z.string()),
      size: z.object({
        min: z.number(),
        max: z.number(),
      }),
      opacity: z.object({
        min: z.number(),
        max: z.number(),
      }),
      enabled: z.boolean(),
    }),
  }),
);

export const useDeleteAccountAction = routeAction$(
  async (values, requestEvent) => {
    if (values.confirmationText !== "DELETE MY ACCOUNT") {
      return requestEvent.fail(400, {
        message: "Please type 'DELETE MY ACCOUNT' to confirm deletion",
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
            : "Failed to delete account. Please contact support.",
      });
    }

    // Backend owns session teardown; send the user home.
    throw requestEvent.redirect(302, "/");
  },
  zod$({
    confirmationText: z.string().min(1, "Confirmation text is required"),
  }),
);

export default component$(() => {
  const userData = useUserLoader();
  const uploadDomains = useUploadDomainsLoader();
  const updateAction = useUpdateSettingsAction();
  const updateParticleAction = useUpdateParticleConfigAction();
  const deleteAccountAction = useDeleteAccountAction();
  const globalParticle = useGlobalParticle();

  // Set default to first available domain if no domain is selected
  const getDefaultDomainId = () => {
    if (userData.value.user.uploadDomainId) {
      console.log("userData.value.user.uploadDomainId", userData.value.user.uploadDomainId);
      return userData.value.user.uploadDomainId;
    }
    // Find the default domain first, otherwise use the first available domain
    const defaultDomain = uploadDomains.value.find((d) => d.isDefault);
    if (defaultDomain) {
      return defaultDomain.id;
    }
    return uploadDomains.value.length > 0 ? uploadDomains.value[0].id : "";
  };
  const selectedDomainId = useSignal(getDefaultDomainId());
  const customSubdomain = useSignal(userData.value.user.customSubdomain || "");
  const defaultExpirationDays = useSignal(
    userData.value.user.defaultExpirationDays || "",
  );
  const defaultMaxViews = useSignal(userData.value.user.defaultMaxViews || "");
  const currentThemeDisplay = useSignal<ThemeName>("dark");

  // Initialize particle config from database or default
  const getInitialParticleConfig = () => {
    if (userData.value.user.globalParticleConfig) {
      try {
        const parsed = JSON.parse(userData.value.user.globalParticleConfig);
        return { ...themeParticleConfigs.hearts, ...parsed };
      } catch (e) {
        console.warn("Failed to parse user particle config:", e);
      }
    }
    return { ...themeParticleConfigs.hearts, enabled: true };
  };

  const particleConfigSignal = useSignal(getInitialParticleConfig());

  // Sync particle settings with database on page load
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    // Update global particle store with database settings
    await updateGlobalParticleConfig(
      globalParticle,
      particleConfigSignal.value,
    );

    // Check if localStorage has different settings than database
    try {
      const localSettings = localStorage.getItem("global-particle-config");
      if (localSettings && !userData.value.user.globalParticleConfig) {
        // User has local settings but no database settings - save local to database
        const parsed = JSON.parse(localSettings);
        const mergedConfig = { ...themeParticleConfigs.hearts, ...parsed };
        particleConfigSignal.value = mergedConfig;
        await updateGlobalParticleConfig(globalParticle, mergedConfig);
        updateParticleAction.submit({ config: mergedConfig });
      }
    } catch (e) {
      console.warn("Failed to sync particle settings:", e);
    }
  });

  // Update current theme display from DOM
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    if (typeof document !== "undefined") {
      const updateCurrentTheme = () => {
        const themeVariant = document.documentElement.getAttribute(
          "data-theme-variant",
        ) as ThemeName;
        if (themeVariant) {
          currentThemeDisplay.value = themeVariant;
        }
      };

      // Update immediately
      updateCurrentTheme();

      // Set up observer for changes
      const observer = new MutationObserver(updateCurrentTheme);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme-variant"],
      });

      return () => observer.disconnect();
    }
  });

  const themeOptions = [
    {
      name: "auto" as ThemeName,
      label: "Auto",
      description:
        "Automatically switches between light and dark based on your system preference",
      icon: Sparkles,
      gradient: "from-slate-500 to-slate-600",
      preview: "Follows your system settings like a good kitty~ (=^･ω･^=)",
    },
    {
      name: "dark" as ThemeName,
      label: "Dark",
      description:
        "The classic dark theme - perfect for late night file sharing sessions",
      icon: Moon,
      gradient: "from-slate-800 to-slate-900",
      preview: "Sleek, dark, and mysterious~ Perfect for femboy ninjas!",
    },
    {
      name: "light" as ThemeName,
      label: "Light",
      description: "Clean and bright theme for daytime productivity",
      icon: Sun,
      gradient: "from-yellow-400 to-orange-500",
      preview: "Bright and cheerful like a sunny day!",
    },
    {
      name: "pastel" as ThemeName,
      label: "Pastel",
      description: "Soft, dreamy colors that are easy on the eyes",
      icon: Heart,
      gradient: "from-pink-300 to-purple-400",
      preview: "Soft and dreamy like cotton candy clouds~ (´｡• ᵕ •｡`) ♡",
    },
    {
      name: "neon" as ThemeName,
      label: "Neon",
      description: "High-contrast cyberpunk aesthetic with glowing effects",
      icon: Zap,
      gradient: "from-pink-500 to-violet-600",
      preview:
        "Cyberpunk vibes with extra sparkle! Perfect for hacker femboys!",
    },
    {
      name: "valentine" as ThemeName,
      label: "Valentine",
      description:
        "Romantic pink theme perfect for love letters and cute files",
      icon: Heart,
      gradient: "from-rose-400 to-pink-600",
      preview:
        "Romantic and lovely~ Perfect for sharing files with your crush!",
    },
  ];

  const getCurrentDomainPreview = () => {
    const selectedDomain = uploadDomains.value.find(
      (d) => d.id === selectedDomainId.value,
    );
    if (!selectedDomain) return "No domain selected";

    const subdomain = customSubdomain.value.trim();
    if (subdomain && selectedDomain.supportsSubdomains) {
      return `${subdomain}.${selectedDomain.domain}`;
    }
    return selectedDomain.domain;
  };

  const selectedDomain = uploadDomains.value.find(
    (d) => d.id === selectedDomainId.value,
  );
  return (
    <PageContainer width="narrow">
      <PageHeader
        align="left"
        title="Settings~"
        icon={SettingsIcon}
        subtitle="Configure your upload preferences, domain settings, and themes! (◕‿◕)♡"
      />

      {/* Upload Domain Settings */}
      <Panel title="Upload Domain Settings~" icon={Globe} class="mb-6 sm:mb-8">
        <Form action={updateAction}>
          <div class="space-y-4 sm:space-y-6">
            <div>
              <FieldLabel>Upload Domain</FieldLabel>
              <Select
                name="uploadDomainId"
                value={selectedDomainId.value}
                onChange$={(event) => {
                  selectedDomainId.value = (
                    event.target as HTMLSelectElement
                  ).value;
                }}
              >
                {uploadDomains.value.length === 0 && (
                  <option value="">No domains available</option>
                )}
                {uploadDomains.value.map((domain) => (
                  <option key={domain.id} value={domain.id} selected={domain.id === selectedDomainId.value}>
                    {`${domain.name} (${domain.domain})${domain.isDefault ? " - Default" : ""}`}
                  </option>
                ))}
              </Select>
              <p class="text-theme-text-muted mt-1.5 text-xs">
                Choose the base domain for your file uploads~
              </p>
            </div>

            {selectedDomain?.supportsSubdomains && (
              <div>
                <FieldLabel>Custom Subdomain (Optional)</FieldLabel>
                <Input
                  type="text"
                  name="customSubdomain"
                  value={customSubdomain.value}
                  placeholder="files, cdn, cute, etc..."
                  onInput$={(event) => {
                    customSubdomain.value = (
                      event.target as HTMLInputElement
                    ).value;
                  }}
                />
                <p class="text-theme-text-muted mt-1.5 text-xs">
                  Add a custom subdomain to your uploads (e.g., "files" →
                  files.{selectedDomain.domain})~
                </p>
              </div>
            )}

            {/* File Expiration Settings */}
            <div>
              <FieldLabel>Default File Expiration (Days)</FieldLabel>
              <Input
                type="number"
                name="defaultExpirationDays"
                value={defaultExpirationDays.value}
                placeholder="Never expires (leave empty)"
                min="1"
                max="365"
                onInput$={(event) => {
                  defaultExpirationDays.value = (
                    event.target as HTMLInputElement
                  ).value;
                }}
              />
              <p class="text-theme-text-muted mt-1.5 text-xs">
                Files will automatically delete after this many days. Leave
                empty for no expiration~
              </p>
            </div>

            {/* View Limits Settings */}
            <div>
              <FieldLabel>Default Max Views</FieldLabel>
              <Input
                type="number"
                name="defaultMaxViews"
                value={defaultMaxViews.value}
                placeholder="Unlimited views (leave empty)"
                min="1"
                onInput$={(event) => {
                  defaultMaxViews.value = (
                    event.target as HTMLInputElement
                  ).value;
                }}
              />
              <p class="text-theme-text-muted mt-1.5 text-xs">
                Files will automatically delete after this many views. Leave
                empty for unlimited views~
              </p>
            </div>

            {/* Preview */}
            <Callout tone="accent" icon={Eye} title="Upload URL Preview~">
              <div class="text-theme-text-primary bg-theme-bg-secondary/40 border-theme-card-border rounded-lg border p-3 font-mono text-sm break-all">
                {getCurrentDomainPreview()}/f/cute-filename-123
              </div>
              <p class="mt-2 text-xs">
                This is how your upload URLs will look~ (◕‿◕)♡
              </p>
            </Callout>

            <Button type="submit" block>
              <Save class="h-4 w-4" />
              Save Settings~
            </Button>
          </div>
        </Form>

        {updateAction.value?.success && (
          <Callout tone="success" icon={CheckCircle} class="mt-4 sm:mt-6">
            {updateAction.value.message}~
          </Callout>
        )}

        {updateAction.value?.failed && (
          <Callout tone="danger" icon={CircleX} class="mt-4 sm:mt-6">
            {updateAction.value.message}~
          </Callout>
        )}
      </Panel>

      {/* Theme Settings */}
      <Panel title="Theme Settings~" icon={Palette} class="mb-6 sm:mb-8">
        {/* Theme Gallery */}
        <div>
          <h3 class="text-theme-text-primary mb-4 flex items-center gap-2 text-base font-medium sm:text-lg">
            <Eye class="h-4 w-4" />
            Theme Gallery
          </h3>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {themeOptions.map((option) => {
              const IconComponent = option.icon;
              const isActive = currentThemeDisplay.value === option.name;
              const themeName = option.name;

              return (
                <div
                  key={option.name}
                  class={`glass group cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 ${
                    isActive
                      ? "border-theme-accent-primary/60 from-theme-accent-primary/20 to-theme-accent-secondary/20 bg-gradient-to-br"
                      : "border-theme-card-border hover:border-theme-accent-primary/40"
                  }`}
                  onClick$={() => {
                    // Apply theme changes directly like the toggle
                    if (typeof document !== "undefined") {
                      (async () => {
                        // Save to cookie
                        setThemePreference(themeName);

                        // Apply theme immediately
                        const root = document.documentElement;
                        let effectiveTheme = themeName;
                        if (themeName === "auto") {
                          effectiveTheme = window.matchMedia(
                            "(prefers-color-scheme: dark)",
                          ).matches
                            ? "dark"
                            : "light";
                        }

                        const themeColors =
                          themes[effectiveTheme as keyof typeof themes];
                        Object.entries(themeColors).forEach(([key, value]) => {
                          const cssVarName = `--theme-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
                          root.style.setProperty(cssVarName, value);
                        });
                        root.setAttribute("data-theme", effectiveTheme);
                        root.setAttribute("data-theme-variant", themeName);
                      })();
                    }
                  }}
                >
                  <div class="flex items-start gap-3">
                    <div
                      class={`h-10 w-10 rounded-full bg-gradient-to-r ${option.gradient} flex flex-shrink-0 items-center justify-center`}
                    >
                      <IconComponent class="h-5 w-5 text-white" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="mb-2 flex items-center gap-2">
                        <h4 class="text-theme-text-primary text-sm font-medium">
                          {option.label}
                        </h4>
                        {isActive && <Badge status="accent">Active</Badge>}
                      </div>
                      <p class="text-theme-text-secondary mb-2 text-xs">
                        {option.description}
                      </p>
                      <div class="text-theme-text-muted text-xs italic">
                        {option.preview}
                      </div>
                    </div>
                  </div>
                  {/* Color Swatches */}
                  <div class="mt-3 flex gap-1">
                    <div
                      class="h-4 w-4 rounded-full border border-white/20"
                      style={`background: ${themes[option.name].accentPrimary}`}
                    />
                    <div
                      class="h-4 w-4 rounded-full border border-white/20"
                      style={`background: ${themes[option.name].accentSecondary}`}
                    />
                    <div
                      class="h-4 w-4 rounded-full border border-white/20"
                      style={`background: ${themes[option.name].accentTertiary}`}
                    />
                    <div
                      class="h-4 w-4 rounded-full border border-white/20"
                      style={`background: ${themes[option.name].accentQuaternary}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Theme Tips */}
        <Callout tone="info" icon={SettingsIcon} title="Theme Tips" class="mt-6">
          <ul class="space-y-1">
            <li>
              • Your theme preference is saved automatically and syncs across
              devices
            </li>
            <li>
              • The "Auto" theme respects your system's dark/light mode setting
            </li>
            <li>• Click on any theme to switch to it instantly</li>
            <li>
              • All themes are designed to be accessible and easy on the eyes
            </li>
          </ul>
        </Callout>
      </Panel>

      {/* Particle Settings */}
      <Panel
        title="Background Particles~"
        icon={Sparkles}
        description="Control the animated particles that appear in the background of the site~"
        class="mb-6 sm:mb-8"
      >
        {/* Quick Presets */}
        <div class="mb-6">
          <label class="text-theme-text-secondary mb-3 block text-sm font-medium">
            Quick Presets~
          </label>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {" "}
            {Object.keys(themeParticleConfigs).map((name) => (
              <button
                key={name}
                type="button"
                onClick$={async () => {
                  const config = themeParticleConfigs[name];
                  // Update global particle store immediately for visual feedback
                  await updateGlobalParticleConfig(globalParticle, config);
                  particleConfigSignal.value = config;

                  // Save to database in the background
                  updateParticleAction.submit({ config });
                }}
                class={`glass rounded-lg p-3 text-center capitalize transition-all hover:scale-105 ${
                  particleConfigSignal.value.type ===
                    themeParticleConfigs[name].type &&
                  particleConfigSignal.value.enabled ===
                    themeParticleConfigs[name].enabled
                    ? "ring-theme-accent-primary bg-theme-accent-primary/10 ring-2"
                    : ""
                }`}
              >
                <div class="flex items-center justify-center gap-1.5 text-sm font-medium capitalize">
                  {(() => {
                    const preset: Record<
                      string,
                      { icon: any; label: string }
                    > = {
                      disabled: { icon: CircleOff, label: "Off" },
                      hearts: { icon: Heart, label: "Hearts" },
                      snow: { icon: Snowflake, label: "Snow" },
                      stars: { icon: Star, label: "Stars" },
                      bubbles: { icon: Circle, label: "Bubbles" },
                      confetti: { icon: PartyPopper, label: "Confetti" },
                    };
                    const entry = preset[name];
                    if (!entry) return name;
                    const Icon = entry.icon;
                    return (
                      <>
                        <Icon class="h-4 w-4" />
                        {entry.label}
                      </>
                    );
                  })()}
                </div>
              </button>
            ))}
          </div>
        </div>{" "}
        {/* Advanced Configuration */}
        <div>
          <ParticleConfigPanel
            config={particleConfigSignal}
            previewEnabled={false}
          />

          {/* Save advanced settings button */}
          <Button
            type="button"
            block
            class="mt-4"
            onClick$={async () => {
              await updateGlobalParticleConfig(
                globalParticle,
                particleConfigSignal.value,
              );
              updateParticleAction.submit({
                config: particleConfigSignal.value,
              });
            }}
          >
            <Save class="h-4 w-4" />
            Save Advanced Settings~
          </Button>
        </div>

        {/* Save note */}
        <Callout tone="info" icon={Sparkles} class="mt-4">
          Your particle preferences are saved to your account and will sync
          across all your devices~
        </Callout>

        {/* Particle save status */}
        {updateParticleAction.value?.success && (
          <Callout tone="success" icon={CheckCircle} class="mt-4">
            {updateParticleAction.value.message}~
          </Callout>
        )}
        {updateParticleAction.value?.failed && (
          <Callout tone="danger" icon={CircleX} class="mt-4">
            {updateParticleAction.value.message}~
          </Callout>
        )}
      </Panel>

      {/* Account Deletion - Danger Zone */}
      <div class="card-static border-theme-error/40 overflow-hidden rounded-2xl border p-4 sm:p-6">
        <h2 class="text-theme-error mb-4 flex items-center gap-2 text-lg font-bold sm:text-xl">
          <AlertTriangle class="h-5 w-5" />
          Danger Zone
        </h2>
        <Callout tone="danger" icon={AlertTriangle} class="mb-6">
          This action is permanent and cannot be undone. All your files, data,
          and account information will be permanently deleted.
        </Callout>

        <Form action={deleteAccountAction} class="space-y-4">
          <div>
            <FieldLabel class="!text-theme-error">
              Type "DELETE MY ACCOUNT" to confirm deletion:
            </FieldLabel>
            <Input
              type="text"
              name="confirmationText"
              placeholder="Type DELETE MY ACCOUNT here..."
              required
            />
          </div>

          <Button type="submit" variant="danger" block>
            <Trash2 class="h-4 w-4" />
            Delete My Account Forever
          </Button>
        </Form>

        {deleteAccountAction.value?.failed && (
          <Callout tone="danger" icon={CircleX} class="mt-4">
            {deleteAccountAction.value.message}
          </Callout>
        )}
      </div>
    </PageContainer>
  );
});
