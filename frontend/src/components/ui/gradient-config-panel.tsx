import { component$, $, type Signal } from "@builder.io/qwik";
import { RotateCcw } from "lucide-icons-qwik";
import { Switch } from "./switch";

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
        <Switch
          checked={config.value.enabled}
          label="Gradient background"
          help="Blends between colours instead of using one flat colour."
          onChange$={(enabled) => (config.value = { ...config.value, enabled })}
        />

        {config.value.enabled && (
          <>
            {/* Gradient Type */}
            <div>
              <label class="text-ink mb-2 block text-sm font-medium">
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
                      class={`focus-ring border-edge bg-surface hover:bg-surface-hover rounded-control border p-2 text-center text-[13px] capitalize transition-colors duration-150 ${
                        config.value.type === type
                          ? "ring-accent bg-accent-soft ring-2"
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
                <label class="text-ink mb-2 block text-sm font-medium">
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
                  class="focus-ring border-edge bg-surface text-ink rounded-control h-9 w-full border px-2.5 text-sm transition-colors duration-150"
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
              <label class="text-ink mb-2 block text-sm font-medium">
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
                    class="focus-ring border-edge bg-surface hover:bg-surface-hover rounded-control border p-2 text-left text-[13px] transition-colors duration-150"
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
                <label class="text-ink text-sm font-medium">
                  Colors ({config.value.colors.length}/5)
                </label>
                <div class="flex gap-2">
                  <button
                    type="button"
                    onClick$={addColor}
                    disabled={config.value.colors.length >= 5}
                    class="focus-ring border-edge bg-surface text-ink hover:bg-surface-hover rounded-control border px-2 py-1 text-xs transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55"
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
                    class="focus-ring border-edge bg-surface text-ink hover:bg-surface-hover rounded-control flex items-center gap-1 border px-2 py-1 text-xs transition-colors duration-150"
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
                      class="border-edge rounded-control h-10 w-12 cursor-pointer border-2 bg-transparent"
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
                      class="focus-ring border-edge bg-surface text-ink rounded-control h-9 flex-1 border px-2.5 font-mono text-[13px] transition-colors duration-150"
                      placeholder="#ffffff"
                    />
                    {config.value.colors.length > 2 && (
                      <button
                        type="button"
                        onClick$={() => removeColor(index)}
                        class="focus-ring border-edge text-danger hover:bg-danger-soft rounded-control flex h-9 w-9 items-center justify-center border transition-colors duration-150"
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
              <label class="text-ink mb-2 block text-sm font-medium">
                Preview
              </label>
              <div
                class="border-edge rounded-surface h-20 border-2"
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
