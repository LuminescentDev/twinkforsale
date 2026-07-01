import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import { type ThemeName, themes } from "~/lib/theme-store";
import { Moon, Sun, Palette, Sparkles, Heart, Zap } from "lucide-icons-qwik";
import { setThemePreference } from "~/lib/cookie-utils";

export interface ThemeToggleProps {
  variant?: "compact" | "full" | "dropdown";
  showLabel?: boolean;
  class?: string;
}

export const ThemeToggle = component$<ThemeToggleProps>(
  ({ variant = "compact", showLabel = false, class: className = "" }) => {
    const isOpen = useSignal(false);
    const currentTheme = useSignal<ThemeName>("dark");

    // Update current theme from DOM
    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(() => {
      if (typeof document !== "undefined") {
        const updateCurrentTheme = () => {
          const themeVariant = document.documentElement.getAttribute(
            "data-theme-variant",
          ) as ThemeName;
          if (themeVariant) {
            currentTheme.value = themeVariant;
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

    const themeOptions: Array<{
      value: ThemeName;
      label: string;
      icon: any;
      description: string;
      gradient: string;
    }> = [
      {
        value: "auto",
        label: "Auto",
        icon: Sparkles,
        description: "Follows system preference",
        gradient: "from-slate-500 to-slate-600",
      },
      {
        value: "dark",
        label: "Dark",
        icon: Moon,
        description: "Classic dark theme",
        gradient: "from-slate-800 to-slate-900",
      },
      {
        value: "light",
        label: "Light",
        icon: Sun,
        description: "Clean light theme",
        gradient: "from-yellow-400 to-orange-500",
      },
      {
        value: "pastel",
        label: "Pastel",
        icon: Heart,
        description: "Soft pastel vibes",
        gradient: "from-pink-300 to-purple-400",
      },
      {
        value: "neon",
        label: "Neon",
        icon: Zap,
        description: "Cyberpunk aesthetic",
        gradient: "from-pink-500 to-violet-600",
      },
      {
        value: "valentine",
        label: "Valentine",
        icon: Heart,
        description: "Romantic pink theme",
        gradient: "from-rose-400 to-pink-600",
      },
    ];

    const currentThemeOption =
      themeOptions.find((option) => option.value === currentTheme.value) ||
      themeOptions[0];    const handleThemeChange = $((newTheme: ThemeName) => {
      // Apply theme changes directly without reload
      if (typeof document !== "undefined") {
        (async () => {
          // Save to cookie
          setThemePreference(newTheme);

          // Apply theme immediately
          const root = document.documentElement;
          let effectiveTheme = newTheme;
          if (newTheme === "auto") {
            effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)")
              .matches
              ? "dark"
              : "light";
          }

          const themeColors = themes[effectiveTheme as keyof typeof themes];
          Object.entries(themeColors).forEach(([key, value]) => {
            const cssVarName = `--theme-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
            root.style.setProperty(cssVarName, value);
          });

          root.setAttribute("data-theme", effectiveTheme);
          root.setAttribute("data-theme-variant", newTheme);
        })();
      }
      isOpen.value = false;
    });
    const handleCycleTheme = $(() => {
      // Get current theme from DOM attribute instead of context to avoid serialization
      const currentTheme =
        (document.documentElement.getAttribute(
          "data-theme-variant",
        ) as ThemeName) || "dark";
      const mainThemes: ThemeName[] = ["auto", "dark", "light"];
      const currentIndex = mainThemes.indexOf(currentTheme);
      const nextTheme = mainThemes[(currentIndex + 1) % mainThemes.length];
      handleThemeChange(nextTheme);
    });
    // Compact variant - just the current theme icon
    if (variant === "compact") {
      const IconComponent = currentThemeOption.icon;
      return (
        <button
          onClick$={handleCycleTheme}
          class={`glass group rounded-full p-2 transition-all duration-300 hover:bg-white/20 ${className}`}
          title={`Current theme: ${currentThemeOption.label}. Click to cycle themes.`}
        >
          <IconComponent class="text-theme-accent-primary group-hover:text-theme-text-primary h-5 w-5 transition-colors" />
          {showLabel && (
            <span class="text-theme-accent-primary group-hover:text-theme-text-primary ml-2 text-sm">
              {currentThemeOption.label}
            </span>
          )}
        </button>
      );
    }
    // Dropdown variant - full theme selector
    return (
      <div class={`relative z-50 ${className}`}>
        <button
          onClick$={() => (isOpen.value = !isOpen.value)}
          class="glass group relative z-50 flex items-center gap-2 rounded-full p-2 transition-all duration-300 hover:bg-white/20"
          title="Select theme"
        >
          <currentThemeOption.icon class="text-theme-accent-primary group-hover:text-theme-text-primary h-5 w-5 transition-colors" />
          {(variant === "full" || showLabel) && (
            <span class="text-theme-accent-primary group-hover:text-theme-text-primary text-sm">
              {currentThemeOption.label}
            </span>
          )}
          <Palette class="text-theme-accent-primary group-hover:text-theme-text-primary ml-1 h-4 w-4 transition-colors" />
        </button>
        {isOpen.value && (
          <div class="glass border-theme-card-border absolute top-full right-0 z-[99999] mt-2 w-64 rounded-2xl border p-2 shadow-2xl backdrop-blur-xl">
            <div class="space-y-1">
              {themeOptions.map((option) => {
                const IconComponent = option.icon;
                const isActive = currentTheme.value === option.value;

                return (
                  <button
                    key={option.value}
                    onClick$={() => handleThemeChange(option.value)}
                    class={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-br from-theme-accent-primary to-theme-accent-secondary border-theme-accent-primary/40 border"
                        : "hover:bg-white/10"
                    }`}
                  >
                    <div
                      class={`h-8 w-8 rounded-full bg-gradient-to-r ${option.gradient} flex items-center justify-center`}
                    >
                      <IconComponent class="h-4 w-4 text-white" />
                    </div>
                    <div class="flex-1">
                      <div class="text-theme-text-primary text-sm font-medium">
                        {option.label}
                        {isActive && (
                          <span class="text-theme-accent-primary ml-2 text-xs">✓</span>
                        )}
                      </div>
                      <div class="text-theme-text-muted text-xs">
                        {option.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div class="border-theme-card-border mt-3 border-t pt-3">
              <p class="text-theme-text-muted text-center text-xs">
                Theme preference saved automatically~ ✨
              </p>
            </div>
          </div>
        )}{" "}
        {/* Click outside to close */}
        {isOpen.value && (
          <div
            class="fixed inset-0 z-[99998]"
            onClick$={() => (isOpen.value = false)}
          />
        )}
      </div>
    );
  },
);
