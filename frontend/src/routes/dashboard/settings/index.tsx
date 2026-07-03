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
import { PageContainer, PageHeader } from "~/components/ui";
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

  const inputClasses =
    "w-full px-3 sm:px-4 py-2 sm:py-3 glass rounded-full placeholder:theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-accent-primary/50 transition-all duration-300 text-sm sm:text-base text-theme-primary";

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
      <div class="card-cute mb-6 rounded-2xl p-4 sm:mb-8 sm:p-6">
        <h2 class="text-gradient-cute mb-4 flex items-center gap-2 text-lg font-bold sm:mb-6 sm:text-xl">
          <Globe class="h-5 w-5" />
          Upload Domain Settings~
        </h2>

        <Form action={updateAction}>
          <div class="space-y-4 sm:space-y-6">
            <div>
              <label class="text-theme-text-secondary mb-2 block text-xs font-medium sm:text-sm">
                Upload Domain~
              </label>{" "}
              <select
                name="uploadDomainId"
                value={selectedDomainId.value}
                class={inputClasses}
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
              </select>
              <p class="text-theme-text-muted mt-2 pl-3 text-xs sm:pl-4">
                Choose the base domain for your file uploads~
              </p>
            </div>

            {selectedDomain?.supportsSubdomains && (
              <div>
                <label class="text-theme-text-secondary mb-2 block text-xs font-medium sm:text-sm">
                  Custom Subdomain (Optional)~
                </label>
                <input
                  type="text"
                  name="customSubdomain"
                  value={customSubdomain.value}
                  placeholder="files, cdn, cute, etc..."
                  class={inputClasses}
                  onInput$={(event) => {
                    customSubdomain.value = (
                      event.target as HTMLInputElement
                    ).value;
                  }}
                />
                <p class="text-theme-text-muted mt-2 pl-3 text-xs sm:pl-4">
                  Add a custom subdomain to your uploads (e.g., "files" →
                  files.{selectedDomain.domain})~
                </p>
              </div>
            )}

            {/* File Expiration Settings */}
            <div>
              <label class="text-theme-text-secondary mb-2 block text-xs font-medium sm:text-sm">
                Default File Expiration (Days)~
              </label>
              <input
                type="number"
                name="defaultExpirationDays"
                value={defaultExpirationDays.value}
                placeholder="Never expires (leave empty)"
                min="1"
                max="365"
                class={inputClasses}
                onInput$={(event) => {
                  defaultExpirationDays.value = (
                    event.target as HTMLInputElement
                  ).value;
                }}
              />
              <p class="text-theme-text-muted mt-2 pl-3 text-xs sm:pl-4">
                Files will automatically delete after this many days. Leave
                empty for no expiration~
              </p>
            </div>

            {/* View Limits Settings */}
            <div>
              <label class="text-theme-text-secondary mb-2 block text-xs font-medium sm:text-sm">
                Default Max Views~
              </label>
              <input
                type="number"
                name="defaultMaxViews"
                value={defaultMaxViews.value}
                placeholder="Unlimited views (leave empty)"
                min="1"
                class={inputClasses}
                onInput$={(event) => {
                  defaultMaxViews.value = (
                    event.target as HTMLInputElement
                  ).value;
                }}
              />
              <p class="text-theme-text-muted mt-2 pl-3 text-xs sm:pl-4">
                Files will automatically delete after this many views. Leave
                empty for unlimited views~
              </p>
            </div>

            {/* Preview */}
            <div class="glass border-theme-accent-quaternary/20 rounded-2xl border p-4">
              <h3 class="text-theme-accent-quaternary mb-3 flex items-center gap-2 text-sm font-medium">
                <Eye class="h-4 w-4" />
                Upload URL Preview~
              </h3>
              <div class="text-theme-text-primary bg-theme-bg-tertiary/20 rounded-lg p-3 font-mono text-sm">
                {getCurrentDomainPreview()}/f/cute-filename-123
              </div>
              <p class="text-theme-text-muted mt-2 text-xs">
                This is how your upload URLs will look~ (◕‿◕)♡
              </p>
            </div>

            <button
              type="submit"
              class="btn-cute text-theme-text-primary inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 sm:px-6 sm:py-3 sm:text-base"
            >
              <Save class="h-4 w-4" />
              Save Settings~
            </button>
          </div>
        </Form>

        {updateAction.value?.success && (
          <div class="from-theme-accent-secondary/20 to-theme-accent-tertiary/20 border-theme-accent-secondary/30 glass mt-4 rounded-2xl border bg-gradient-to-br p-3 sm:mt-6 sm:p-4">
            <p class="text-theme-accent-secondary flex items-center gap-2 text-xs sm:text-sm">
              <CheckCircle class="h-4 w-4 flex-shrink-0" />
              {updateAction.value.message}~
            </p>
          </div>
        )}

        {updateAction.value?.failed && (
          <div class="from-theme-accent-primary/20 to-theme-accent-secondary/20 border-theme-accent-primary/30 glass mt-4 rounded-2xl border bg-gradient-to-br p-3 sm:mt-6 sm:p-4">
            <p class="text-theme-accent-primary flex items-center gap-2 text-xs sm:text-sm">
              <CircleX class="h-4 w-4 flex-shrink-0" />
              {updateAction.value.message}~
            </p>
          </div>
        )}
      </div>

      {/* Theme Settings */}
      <div class="card-cute mb-6 rounded-2xl p-4 sm:mb-8 sm:p-6">
        <h2 class="text-gradient-cute mb-4 flex items-center gap-2 text-lg font-bold sm:mb-6 sm:text-xl">
          <Palette class="h-5 w-5" />
          Theme Settings~
        </h2>

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
                        {isActive && (
                          <span class="from-theme-accent-primary to-theme-accent-secondary text-theme-text-primary rounded-full bg-gradient-to-br px-2 py-1 text-xs">
                            Active
                          </span>
                        )}
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
        <div class="glass border-theme-accent-tertiary/30 mt-6 rounded-xl border p-4">
          <div class="flex items-start gap-3">
            <SettingsIcon class="text-theme-accent-tertiary mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <h4 class="text-theme-accent-tertiary mb-1 text-sm font-medium">
                Theme Tips
              </h4>
              <ul class="text-theme-text-secondary space-y-1 text-xs">
                <li>
                  • Your theme preference is saved automatically and syncs
                  across devices
                </li>
                <li>
                  • The "Auto" theme respects your system's dark/light mode
                  setting
                </li>
                <li>• Click on any theme to switch to it instantly</li>
                <li>
                  • All themes are designed to be accessible and easy on the
                  eyes
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Particle Settings */}
      <div class="card-cute mb-6 rounded-2xl p-4 sm:mb-8 sm:p-6">
        <h2 class="text-gradient-cute mb-4 flex items-center gap-2 text-lg font-bold sm:mb-6 sm:text-xl">
          <Sparkles class="h-5 w-5" />
          Background Particles~
        </h2>
        <p class="text-theme-text-secondary mb-6 text-sm">
          Control the animated particles that appear in the background of the
          site~
        </p>
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
          <div class="mt-4">
            <button
              type="button"
              onClick$={async () => {
                // Update global particle store
                await updateGlobalParticleConfig(
                  globalParticle,
                  particleConfigSignal.value,
                );
                // Save to database
                updateParticleAction.submit({
                  config: particleConfigSignal.value,
                });
              }}
              class="btn-cute text-theme-text-primary inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300"
            >
              <Save class="h-4 w-4" />
              Save Advanced Settings~
            </button>
          </div>
        </div>{" "}
        {/* Save note */}
        <div class="mt-4 rounded-lg border border-theme-info/20 bg-theme-info/10 p-3">
          <p class="text-theme-info flex items-start gap-2 text-xs">
            <Sparkles class="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>
              Your particle preferences are saved to your account and will sync
              across all your devices~
            </span>
          </p>
        </div>
        {/* Particle save status */}
        {updateParticleAction.value?.success && (
          <div class="from-theme-accent-secondary/20 to-theme-accent-tertiary/20 border-theme-accent-secondary/30 glass mt-4 rounded-2xl border bg-gradient-to-br p-3 sm:p-4">
            <p class="text-theme-accent-secondary flex items-center gap-2 text-xs sm:text-sm">
              <CheckCircle class="h-4 w-4 flex-shrink-0" />
              {updateParticleAction.value.message}~
            </p>
          </div>
        )}{" "}
        {updateParticleAction.value?.failed && (
          <div class="from-theme-accent-primary/20 to-theme-accent-secondary/20 border-theme-accent-primary/30 glass mt-4 rounded-2xl border bg-gradient-to-br p-3 sm:p-4">
            <p class="text-theme-accent-primary flex items-center gap-2 text-xs sm:text-sm">
              <CircleX class="h-4 w-4 flex-shrink-0" />
              {updateParticleAction.value.message}~
            </p>
          </div>
        )}
      </div>

      {/* Account Deletion - Danger Zone */}
      <div class="glass rounded-2xl border border-theme-error/30 bg-gradient-to-br from-red-500/10 to-red-600/10 p-4 sm:p-6">
        <h2 class="mb-4 flex items-center text-lg font-bold text-theme-error sm:mb-6 sm:text-xl">
          <AlertTriangle class="mr-2 h-5 w-5" />
          Danger Zone
        </h2>
        <p class="text-theme-error/80 mb-6 flex items-start gap-2 text-sm">
          <AlertTriangle class="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>
            This action is permanent and cannot be undone. All your files,
            data, and account information will be permanently deleted.
          </span>
        </p>

        <Form action={deleteAccountAction} class="space-y-4">
          <div>
            <label class="mb-2 block text-sm font-medium text-theme-error">
              Type "DELETE MY ACCOUNT" to confirm deletion:
            </label>
            <input
              type="text"
              name="confirmationText"
              placeholder="Type DELETE MY ACCOUNT here..."
              class="w-full rounded-lg border border-theme-error/30 bg-theme-error/5 px-3 py-2 text-theme-error placeholder-red-400/60 focus:border-theme-error focus:ring-2 focus:ring-red-400/50 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            class="flex w-full items-center justify-center rounded-lg bg-theme-error px-4 py-3 font-medium text-white transition-all duration-300 hover:scale-[1.02] hover:bg-theme-error"
          >
            <Trash2 class="mr-2 h-4 w-4" />
            Delete My Account Forever
          </button>
        </Form>

        {/* Error/Success Messages */}
        {deleteAccountAction.value?.failed && (
          <div class="mt-4 rounded-lg border border-theme-error/50 bg-theme-error/20 p-3">
            <p class="text-theme-error flex items-center gap-2 text-sm">
              <CircleX class="h-4 w-4 flex-shrink-0" />
              {deleteAccountAction.value.message}
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
});
