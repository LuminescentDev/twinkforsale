import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import {
  Check,
  Monitor,
  Moon,
  Sun,
  Palette,
  Zap,
  Heart,
} from "lucide-icons-qwik";
import {
  palettes,
  themes,
  themeOptions,
  resolvePalette,
  paletteIsDark,
  type ThemeName,
} from "~/lib/theme-store";
import { getThemePreference, setThemePreference } from "~/lib/cookie-utils";
import { cn } from "~/lib/utils";
import { DropdownMenu } from "./dropdown-menu";

const themeIcon: Record<ThemeName, any> = {
  dark: Moon,
  light: Sun,
  pastel: Palette,
  neon: Zap,
  valentine: Heart,
  auto: Monitor,
};

function applyTheme(theme: ThemeName) {
  const palette = resolvePalette(theme);
  const root = document.documentElement;
  Object.entries(palettes[palette]).forEach(([key, value]) => {
    root.style.setProperty(
      `--ui-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`,
      value,
    );
  });
  Object.entries(themes[palette]).forEach(([key, value]) => {
    root.style.setProperty(
      `--theme-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`,
      value,
    );
  });
  root.setAttribute("data-theme", paletteIsDark[palette] ? "dark" : "light");
  root.setAttribute("data-palette", palette);
  root.setAttribute("data-theme-variant", theme);
}

/** Three colour chips showing a palette's actual canvas, surface and accent. */
export const ThemeSwatch = component$<{ theme: ThemeName; class?: string }>(
  ({ theme, class: className }) => {
    const p = palettes[theme === "auto" ? "dark" : theme];
    return (
      <span
        aria-hidden="true"
        class={cn(
          "border-edge inline-flex h-5 w-9 shrink-0 overflow-hidden rounded-[4px] border",
          className,
        )}
      >
        <span class="flex-1" style={`background:${p.canvas}`} />
        <span class="flex-1" style={`background:${p.surface}`} />
        <span class="flex-1" style={`background:${p.accent}`} />
      </span>
    );
  },
);

export interface ThemeToggleProps {
  /** `menu` for the shell; `list` for the Appearance settings section. */
  variant?: "menu" | "list";
  /** Menu trigger size; `lg` gives a 44px touch target. */
  size?: "sm" | "lg";
  class?: string;
}

/**
 * Theme picker. Applies immediately and persists to the preference cookie;
 * previews show each palette's real surface and accent relationship.
 */
export const ThemeToggle = component$<ThemeToggleProps>(
  ({ variant = "menu", size = "sm", class: className }) => {
    const current = useSignal<ThemeName>("auto");

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(async () => {
      const attr = document.documentElement.getAttribute(
        "data-theme-variant",
      ) as ThemeName | null;
      current.value = attr || (await getThemePreference()) || "auto";
    });

    const select = $(async (theme: ThemeName) => {
      current.value = theme;
      applyTheme(theme);
      await setThemePreference(theme);
    });

    if (variant === "list") {
      return (
        <div
          role="radiogroup"
          aria-label="Theme"
          class={cn("grid gap-1.5 sm:grid-cols-2", className)}
        >
          {themeOptions.map((opt) => {
            const active = current.value === opt.value;
            const Icon = themeIcon[opt.value];
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick$={() => select(opt.value)}
                class={cn(
                  "focus-ring rounded-control flex items-center gap-2.5 border px-2.5 py-2 text-left text-[13px] transition-colors duration-150",
                  active
                    ? "border-accent bg-accent-soft text-ink"
                    : "border-edge bg-surface text-ink-muted hover:bg-surface-hover hover:text-ink",
                )}
              >
                <ThemeSwatch theme={opt.value} />
                <span class="flex min-w-0 flex-1 items-center gap-1.5 font-medium">
                  <Icon class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span class="truncate">{opt.label}</span>
                </span>
                {active && (
                  <Check
                    class="text-accent-text h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      );
    }

    const CurrentIcon = themeIcon[current.value];
    return (
      <DropdownMenu
        class={className}
        menuClass="w-56"
        triggerLabel="Change theme"
        triggerClass={cn(
          "text-ink-muted hover:bg-surface-hover hover:text-ink justify-center border border-transparent",
          size === "lg" ? "h-11 w-11" : "h-8 w-8",
        )}
      >
        <CurrentIcon q:slot="trigger" class="h-4 w-4" />
        <div role="radiogroup" aria-label="Theme">
          {themeOptions.map((opt) => {
            const active = current.value === opt.value;
            const Icon = themeIcon[opt.value];
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick$={() => select(opt.value)}
                class={cn(
                  "focus-ring rounded-control flex w-full items-center gap-2.5 px-2 py-1.5 text-left text-[13px] transition-colors duration-150",
                  active
                    ? "text-ink font-medium"
                    : "text-ink-muted hover:text-ink",
                  "hover:bg-surface-hover",
                )}
              >
                <ThemeSwatch theme={opt.value} />
                <Icon class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span class="flex-1 truncate">{opt.label}</span>
                {active && (
                  <Check
                    class="text-accent-text h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      </DropdownMenu>
    );
  },
);
