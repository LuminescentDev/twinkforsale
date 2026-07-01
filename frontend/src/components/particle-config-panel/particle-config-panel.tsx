import { component$, type Signal } from "@builder.io/qwik";
import { 
  ParticleBackground, 
  defaultParticleConfigs,
  type ParticleConfig, 
  type ParticleType,
  type ParticleDirection
} from "~/components/effects/particle-background";
import { Palette, Settings, Eye, EyeOff } from "lucide-icons-qwik";

export interface ParticleConfigPanelProps {
  config: Signal<ParticleConfig>;
  previewEnabled?: boolean;
}

export const ParticleConfigPanel = component$<ParticleConfigPanelProps>(
  ({ config, previewEnabled = true }) => {
    const particleTypes: { value: ParticleType; label: string; emoji: string }[] = [
      { value: "hearts", label: "Hearts", emoji: "💕" },
      { value: "snow", label: "Snow", emoji: "❄️" },
      { value: "stars", label: "Stars", emoji: "⭐" },
      { value: "bubbles", label: "Bubbles", emoji: "🫧" },
      { value: "confetti", label: "Confetti", emoji: "🎉" },
    ];

    const directions: { value: ParticleDirection; label: string }[] = [
      { value: "down", label: "Down ↓" },
      { value: "up", label: "Up ↑" },
      { value: "left", label: "Left ←" },
      { value: "right", label: "Right →" },
      { value: "random", label: "Random 🎲" },
    ];

    const defaultColors: { [key in ParticleType]: string[] } = {
      hearts: ["#ec4899", "#db2777", "#be185d", "#9333ea", "#7e22ce", "#a855f7"],
      snow: ["#ffffff", "#e0f2fe", "#bae6fd"],
      stars: ["#facc15", "#fbbf24", "#f59e0b", "#ffffff"],
      bubbles: ["#3b82f6", "#10b981", "#8b5cf6", "#ec4899"],
      confetti: ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#9333ea", "#ec4899"],
    };

    const selectClasses = "w-full px-3 py-2 glass rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-theme-accent-primary/50 transition-all bg-transparent";

    return (
      <div class="glass rounded-2xl p-6">
        <h3 class="text-theme-text-primary mb-4 flex items-center gap-2 text-lg font-semibold">
          <Palette class="h-5 w-5" />
          Particle Background
        </h3>

        <div class="space-y-4">
          {/* Enable/Disable Toggle */}
          <div class="flex items-center justify-between">
            <label class="text-theme-text-secondary flex items-center gap-2 text-sm font-medium">
              {config.value.enabled ? (
                <Eye class="h-4 w-4" />
              ) : (
                <EyeOff class="h-4 w-4" />
              )}
              Particles Enabled
            </label>            <button
              type="button"
              onClick$={() => {
                config.value = {
                  ...config.value,
                  enabled: !config.value.enabled,
                };
              }}
              class={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-theme-accent-primary focus:ring-offset-2 ${
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
              {/* Particle Type */}
              <div>
                <label class="text-theme-text-secondary mb-2 block text-sm font-medium">
                  Particle Type
                </label>
                <div class="grid grid-cols-3 gap-2">
                  {particleTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"                      onClick$={() => {
                        const newConfig = defaultParticleConfigs[type.value];
                        config.value = {
                          ...newConfig,
                          enabled: config.value.enabled,
                        };
                      }}
                      class={`glass rounded-lg p-3 text-center transition-all hover:scale-105 ${
                        config.value.type === type.value
                          ? "ring-2 ring-theme-accent-primary bg-theme-accent-primary/10"
                          : ""
                      }`}
                    >
                      <div class="text-lg">{type.emoji}</div>
                      <div class="text-xs text-theme-text-secondary mt-1">
                        {type.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Slider */}
              <div>
                <label class="text-theme-text-secondary mb-2 block text-sm font-medium">
                  Amount: {config.value.amount}%
                </label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={config.value.amount}                  onInput$={(e) => {
                    config.value = {
                      ...config.value,
                      amount: parseInt((e.target as HTMLInputElement).value),
                    };
                  }}
                  class="w-full h-2 bg-theme-card-border rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Speed Slider */}
              <div>
                <label class="text-theme-text-secondary mb-2 block text-sm font-medium">
                  Speed: {config.value.speed.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={config.value.speed}                  onInput$={(e) => {
                    config.value = {
                      ...config.value,
                      speed: parseFloat((e.target as HTMLInputElement).value),
                    };
                  }}
                  class="w-full h-2 bg-theme-card-border rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Direction */}
              <div>
                <label class="text-theme-text-secondary mb-2 block text-sm font-medium">
                  Direction
                </label>                <select
                  value={config.value.direction}
                  onChange$={(e) => {
                    config.value = {
                      ...config.value,
                      direction: (e.target as HTMLSelectElement).value as ParticleDirection,
                    };
                  }}
                  class={selectClasses}
                >
                  {directions.map((dir) => (
                    <option key={dir.value} value={dir.value}>
                      {dir.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color Presets */}
              <div>
                <label class="text-theme-text-secondary mb-2 block text-sm font-medium">
                  Colors
                </label>
                <div class="flex gap-2 mb-3">
                  {defaultColors[config.value.type].map((color, index) => (
                    <button
                      key={index}
                      type="button"                      onClick$={() => {
                        // Toggle color in the array
                        const currentColors = [...config.value.colors];
                        const colorIndex = currentColors.indexOf(color);
                        if (colorIndex >= 0) {
                          currentColors.splice(colorIndex, 1);
                        } else {
                          currentColors.push(color);
                        }
                        
                        if (currentColors.length > 0) {
                          config.value = {
                            ...config.value,
                            colors: currentColors,
                          };
                        }
                      }}class={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                        config.value.colors.includes(color)
                          ? "border-white ring-2 ring-theme-accent-primary"
                          : "border-theme-card-border"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                
                {/* Reset to defaults */}
                <button
                  type="button"
                  onClick$={() => {
                    config.value = {
                      ...config.value,
                      colors: [...defaultColors[config.value.type]],
                    };
                  }}
                  class="text-xs text-theme-accent-primary hover:underline"
                >
                  Reset to defaults
                </button>
              </div>

              {/* Advanced Settings */}
              <details class="group">
                <summary class="cursor-pointer text-sm font-medium text-theme-text-secondary hover:text-theme-text-primary flex items-center gap-2">
                  <Settings class="h-4 w-4" />
                  Advanced Settings
                </summary>
                
                <div class="mt-3 space-y-3 pl-6">
                  {/* Size Range */}
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="text-theme-text-secondary mb-1 block text-xs">
                        Min Size: {config.value.size.min}px
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={config.value.size.min}
                        onInput$={(e) => {
                          const newMin = parseInt((e.target as HTMLInputElement).value);
                          config.value = {
                            ...config.value,
                            size: {
                              ...config.value.size,
                              min: Math.min(newMin, config.value.size.max - 1),
                            },
                          };
                        }}
                        class="w-full h-1 bg-theme-card-border rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div>
                      <label class="text-theme-text-secondary mb-1 block text-xs">
                        Max Size: {config.value.size.max}px
                      </label>
                      <input
                        type="range"
                        min="2"
                        max="30"
                        value={config.value.size.max}
                        onInput$={(e) => {
                          const newMax = parseInt((e.target as HTMLInputElement).value);
                          config.value = {
                            ...config.value,
                            size: {
                              ...config.value.size,
                              max: Math.max(newMax, config.value.size.min + 1),
                            },
                          };
                        }}
                        class="w-full h-1 bg-theme-card-border rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Opacity Range */}
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="text-theme-text-secondary mb-1 block text-xs">
                        Min Opacity: {(config.value.opacity.min * 100).toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={config.value.opacity.min}
                        onInput$={(e) => {
                          const newMin = parseFloat((e.target as HTMLInputElement).value);
                          config.value = {
                            ...config.value,
                            opacity: {
                              ...config.value.opacity,
                              min: Math.min(newMin, config.value.opacity.max - 0.1),
                            },
                          };
                        }}
                        class="w-full h-1 bg-theme-card-border rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div>
                      <label class="text-theme-text-secondary mb-1 block text-xs">
                        Max Opacity: {(config.value.opacity.max * 100).toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min="0.2"
                        max="1"
                        step="0.1"
                        value={config.value.opacity.max}
                        onInput$={(e) => {
                          const newMax = parseFloat((e.target as HTMLInputElement).value);
                          config.value = {
                            ...config.value,
                            opacity: {
                              ...config.value.opacity,
                              max: Math.max(newMax, config.value.opacity.min + 0.1),
                            },
                          };
                        }}
                        class="w-full h-1 bg-theme-card-border rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </details>
            </>
          )}
        </div>

        {/* Preview */}
        {previewEnabled && config.value.enabled && (
          <div class="mt-4 relative">
            <div class="text-theme-text-secondary mb-2 text-xs">Live Preview</div>
            <div class="relative h-24 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20">              <ParticleBackground 
                config={config.value} 
                class="!absolute !inset-0"
              />
            </div>
          </div>
        )}
      </div>
    );
  },
);
