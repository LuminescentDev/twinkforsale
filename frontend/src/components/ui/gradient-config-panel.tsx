import { component$, $, type Signal } from "@builder.io/qwik";
import { Palette, RotateCcw } from "lucide-icons-qwik";

export type GradientType = "linear" | "radial" | "conic";
export type GradientDirection =
  | "to top"
  | "to bottom"
  | "to left"
  | "to right"
  | "to top right"
  | "to top left"
  | "to bottom right"
  | "to bottom left";

export interface GradientConfig {
  type: GradientType;
  direction: GradientDirection;
  colors: string[];
  positions?: number[];
  enabled: boolean;
}

export interface GradientConfigPanelProps {
  config: Signal<GradientConfig>;
  fallbackColor: string;
}

export const GradientConfigPanel = component$<GradientConfigPanelProps>(
  ({ config, fallbackColor }) => {
    const gradientPresets = [
      {
        name: "Sunset",
        colors: ["#ff7e5f", "#feb47b"],
        direction: "to right" as GradientDirection,
      },
      {
        name: "Ocean",
        colors: ["#667eea", "#764ba2"],
        direction: "to bottom" as GradientDirection,
      },
      {
        name: "Purple Haze",
        colors: ["#8B5CF6", "#EC4899", "#F59E0B"],
        direction: "to top right" as GradientDirection,
      },
      {
        name: "Mint",
        colors: ["#00d2ff", "#3a7bd5"],
        direction: "to left" as GradientDirection,
      },
      {
        name: "Fire",
        colors: ["#ff9a9e", "#fecfef", "#fecfef"],
        direction: "to bottom right" as GradientDirection,
      },
      {
        name: "Northern Lights",
        colors: ["#00c6ff", "#0072ff", "#9b59b6"],
        direction: "to top" as GradientDirection,
      },
    ];
    const directions: { value: GradientDirection; label: string }[] = [
      { value: "to top", label: "↑ To Top" },
      { value: "to bottom", label: "↓ To Bottom" },
      { value: "to left", label: "← To Left" },
      { value: "to right", label: "→ To Right" },
      { value: "to top right", label: "↗ To Top Right" },
      { value: "to top left", label: "↖ To Top Left" },
      { value: "to bottom right", label: "↘ To Bottom Right" },
      { value: "to bottom left", label: "↙ To Bottom Left" },
    ];
    const generateGradientCSS = (gradientConfig: GradientConfig): string => {
      if (!gradientConfig.enabled || gradientConfig.colors.length === 0) {
        return fallbackColor;
      }

      const colors = gradientConfig.colors;

      switch (gradientConfig.type) {
        case "linear":
          return `linear-gradient(${gradientConfig.direction}, ${colors.join(", ")})`;
        case "radial":
          return `radial-gradient(circle, ${colors.join(", ")})`;
        case "conic":
          return `conic-gradient(${colors.join(", ")})`;
        default:
          return fallbackColor;
      }
    };
    const addColor = $(() => {
      if (config.value.colors.length < 5) {
        config.value = {
          ...config.value,
          colors: [...config.value.colors, "#ffffff"],
        };
      }
    });

    const removeColor = $((index: number) => {
      if (config.value.colors.length > 2) {
        const newColors = [...config.value.colors];
        newColors.splice(index, 1);
        config.value = {
          ...config.value,
          colors: newColors,
        };
      }
    });

    const updateColor = $((index: number, color: string) => {
      const newColors = [...config.value.colors];
      newColors[index] = color;
      config.value = {
        ...config.value,
        colors: newColors,
      };
    });

    return (
      <div class="space-y-4">
        {/* Enable/Disable Toggle */}
        <div class="flex items-center justify-between">
          <label class="text-theme-text-secondary flex items-center gap-2 text-sm font-medium">
            <Palette class="h-4 w-4" />
            Gradient Background
          </label>
          <button
            type="button"
            onClick$={() => {
              config.value = {
                ...config.value,
                enabled: !config.value.enabled,
              };
            }}
            class={`focus:ring-theme-accent-primary relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none ${
              config.value.enabled
                ? "bg-theme-accent-primary"
                : "bg-theme-card-border"
            }`}
          >
            <span
              class={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                config.value.enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {config.value.enabled && (
          <>
            {/* Gradient Type */}
            <div>
              <label class="text-theme-text-secondary mb-2 block text-sm font-medium">
                Gradient Type
              </label>
              <div class="grid grid-cols-3 gap-2">
                {(["linear", "radial", "conic"] as GradientType[]).map(
                  (type) => (
                    <button
                      key={type}
                      type="button"
                      onClick$={() => {
                        config.value = {
                          ...config.value,
                          type,
                        };
                      }}
                      class={`glass rounded-lg p-3 text-center text-sm capitalize transition-all hover:scale-105 ${
                        config.value.type === type
                          ? "ring-theme-accent-primary bg-theme-accent-primary/10 ring-2"
                          : ""
                      }`}
                    >
                      {type}
                    </button>
                  ),
                )}
              </div>
            </div>
            {/* Direction (only for linear gradients) */}
            {config.value.type === "linear" && (
              <div>
                <label class="text-theme-text-secondary mb-2 block text-sm font-medium">
                  Direction
                </label>{" "}
                <select
                  value={config.value.direction}
                  onChange$={(e) => {
                    config.value = {
                      ...config.value,
                      direction: (e.target as HTMLSelectElement)
                        .value as GradientDirection,
                    };
                  }}
                  class="glass focus:ring-theme-accent-primary/50 w-full rounded-xl bg-transparent px-3 py-2 text-sm transition-all focus:ring-2 focus:outline-none"
                >
                  {directions.map((dir) => (
                    <option key={dir.value} value={dir.value}>
                      {dir.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {/* Gradient Presets */}
            <div>
              <label class="text-theme-text-secondary mb-2 block text-sm font-medium">
                Quick Presets
              </label>
              <div class="grid grid-cols-2 gap-2">
                {gradientPresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick$={() => {
                      config.value = {
                        ...config.value,
                        colors: preset.colors,
                        direction: preset.direction,
                        type: "linear",
                      };
                    }}
                    class="glass rounded-lg p-3 text-left text-sm transition-all hover:scale-105"
                    style={{
                      background: `linear-gradient(${preset.direction}, ${preset.colors.join(", ")})`,
                    }}
                  >
                    <div class="font-medium text-white drop-shadow-lg">
                      {preset.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            {/* Color Stops */}
            <div>
              <div class="mb-2 flex items-center justify-between">
                <label class="text-theme-text-secondary text-sm font-medium">
                  Colors ({config.value.colors.length}/5)
                </label>
                <div class="flex gap-2">
                  <button
                    type="button"
                    onClick$={addColor}
                    disabled={config.value.colors.length >= 5}
                    class="glass hover:bg-theme-accent-primary/20 rounded-lg px-2 py-1 text-xs transition-all disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Add Color
                  </button>
                  <button
                    type="button"
                    onClick$={() => {
                      config.value = {
                        ...config.value,
                        colors: ["#8B5CF6", "#EC4899"],
                        direction: "to right",
                        type: "linear",
                      };
                    }}
                    class="glass hover:bg-theme-accent-primary/20 flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-all"
                  >
                    <RotateCcw class="h-3 w-3" />
                    Reset
                  </button>
                </div>
              </div>

              <div class="space-y-2">
                {config.value.colors.map((color, index) => (
                  <div key={index} class="flex items-center gap-3">
                    <input
                      type="color"
                      value={color}
                      onInput$={(e) => {
                        updateColor(
                          index,
                          (e.target as HTMLInputElement).value,
                        );
                      }}
                      class="border-theme-card-border h-10 w-12 cursor-pointer rounded-lg border-2 bg-transparent"
                    />
                    <input
                      type="text"
                      value={color}
                      onInput$={(e) => {
                        updateColor(
                          index,
                          (e.target as HTMLInputElement).value,
                        );
                      }}
                      class="glass focus:ring-theme-accent-primary/50 flex-1 rounded-lg px-3 py-2 text-sm transition-all focus:ring-2 focus:outline-none"
                      placeholder="#ffffff"
                    />
                    {config.value.colors.length > 2 && (
                      <button
                        type="button"
                        onClick$={() => removeColor(index)}
                        class="glass flex h-10 w-10 items-center justify-center rounded-lg text-red-400 transition-all hover:bg-red-500/20"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>{" "}
            {/* Preview */}
            <div>
              <label class="text-theme-text-secondary mb-2 block text-sm font-medium">
                Preview
              </label>
              <div
                class="border-theme-card-border h-20 rounded-xl border-2"
                style={{
                  background: generateGradientCSS(config.value),
                }}
              />
            </div>
          </>
        )}
      </div>
    );
  },
);

export const getGradientCSS = (
  config: GradientConfig,
  fallbackColor: string,
): string => {
  if (!config.enabled || config.colors.length === 0) {
    return fallbackColor;
  }

  const colors = config.colors;

  switch (config.type) {
    case "linear":
      return `linear-gradient(${config.direction}, ${colors.join(", ")})`;
    case "radial":
      return `radial-gradient(circle, ${colors.join(", ")})`;
    case "conic":
      return `conic-gradient(${colors.join(", ")})`;
    default:
      return fallbackColor;
  }
};
