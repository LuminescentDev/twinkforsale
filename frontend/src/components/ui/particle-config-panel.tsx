import { component$, type Signal } from "@builder.io/qwik";
import {
  defaultParticleConfigs,
  type ParticleConfig,
  type ParticleType,
  type ParticleDirection,
} from "~/components/effects/particle-background";
import { Heart, Snowflake, Star, Circle, PartyPopper } from "lucide-icons-qwik";
import { cn } from "~/lib/utils";
import { Field, Select } from "./field";
import { Switch } from "./switch";

export interface ParticleConfigPanelProps {
  config: Signal<ParticleConfig>;
  /** Names the group, e.g. "Background particles" or "Bio page particles". */
  label?: string;
  class?: string;
}

const particleTypes: { value: ParticleType; label: string; icon: any }[] = [
  { value: "hearts", label: "Hearts", icon: Heart },
  { value: "snow", label: "Snow", icon: Snowflake },
  { value: "stars", label: "Stars", icon: Star },
  { value: "bubbles", label: "Bubbles", icon: Circle },
  { value: "confetti", label: "Confetti", icon: PartyPopper },
];

const directions: { value: ParticleDirection; label: string }[] = [
  { value: "down", label: "Downward" },
  { value: "up", label: "Upward" },
  { value: "left", label: "Leftward" },
  { value: "right", label: "Rightward" },
  { value: "random", label: "Random" },
];

const defaultColors: Record<ParticleType, string[]> = {
  hearts: ["#ec4899", "#db2777", "#be185d", "#9333ea", "#7e22ce", "#a855f7"],
  snow: ["#ffffff", "#e0f2fe", "#bae6fd"],
  stars: ["#facc15", "#fbbf24", "#f59e0b", "#ffffff"],
  bubbles: ["#3b82f6", "#10b981", "#8b5cf6", "#ec4899"],
  confetti: ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#9333ea", "#ec4899"],
};

const slider =
  "focus-ring accent-accent bg-surface-subtle border-edge h-1.5 w-full cursor-pointer appearance-none rounded-full border";

/**
 * Particle atmosphere controls. Changes apply to the bound signal immediately
 * so the effect is visible while adjusting; persistence is the caller's job.
 */
export const ParticleConfigPanel = component$<ParticleConfigPanelProps>(
  ({ config, label = "Background particles", class: className }) => {
    const c = config.value;

    return (
      <div class={cn("min-w-0", className)}>
        <Switch
          checked={c.enabled}
          label={label}
          help="A subtle drifting effect behind the interface. Continuous movement is disabled automatically if your system asks for reduced motion."
          onChange$={(enabled) => (config.value = { ...config.value, enabled })}
        />

        {c.enabled && (
          <div class="mt-4 grid gap-4">
            <fieldset>
              <legend class="text-ink mb-2 text-[13px] font-medium">
                Shape
              </legend>
              <div class="flex flex-wrap gap-1.5">
                {particleTypes.map((type) => {
                  const active = c.type === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      aria-pressed={active}
                      onClick$={() => {
                        config.value = {
                          ...defaultParticleConfigs[type.value],
                          enabled: true,
                        };
                      }}
                      class={cn(
                        "focus-ring rounded-control inline-flex items-center gap-1.5 border px-2.5 py-1.5 text-[13px] transition-colors duration-150",
                        active
                          ? "border-accent bg-accent-soft text-accent-text font-medium"
                          : "border-edge bg-surface text-ink-muted hover:bg-surface-hover hover:text-ink",
                      )}
                    >
                      <type.icon class="h-4 w-4" aria-hidden="true" />
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  for="particle-amount"
                  class="text-ink mb-1.5 flex items-baseline justify-between text-[13px] font-medium"
                >
                  Density
                  <span class="text-ink-muted text-xs tabular-nums">
                    {c.amount}%
                  </span>
                </label>
                <input
                  id="particle-amount"
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={c.amount}
                  onInput$={(_, el) =>
                    (config.value = {
                      ...config.value,
                      amount: parseInt(el.value, 10),
                    })
                  }
                  class={slider}
                />
              </div>

              <div>
                <label
                  for="particle-speed"
                  class="text-ink mb-1.5 flex items-baseline justify-between text-[13px] font-medium"
                >
                  Speed
                  <span class="text-ink-muted text-xs tabular-nums">
                    {c.speed.toFixed(1)}×
                  </span>
                </label>
                <input
                  id="particle-speed"
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={c.speed}
                  onInput$={(_, el) =>
                    (config.value = {
                      ...config.value,
                      speed: parseFloat(el.value),
                    })
                  }
                  class={slider}
                />
              </div>

              <Field label="Direction" for="particle-direction">
                <Select
                  id="particle-direction"
                  value={c.direction}
                  onChange$={(_, el) =>
                    (config.value = {
                      ...config.value,
                      direction: el.value as ParticleDirection,
                    })
                  }
                >
                  {directions.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <div>
                <label
                  for="particle-opacity"
                  class="text-ink mb-1.5 flex items-baseline justify-between text-[13px] font-medium"
                >
                  Maximum opacity
                  <span class="text-ink-muted text-xs tabular-nums">
                    {Math.round(c.opacity.max * 100)}%
                  </span>
                </label>
                <input
                  id="particle-opacity"
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={c.opacity.max}
                  onInput$={(_, el) =>
                    (config.value = {
                      ...config.value,
                      opacity: {
                        ...config.value.opacity,
                        max: parseFloat(el.value),
                      },
                    })
                  }
                  class={slider}
                />
              </div>
            </div>

            <fieldset>
              <legend class="text-ink mb-1 text-[13px] font-medium">
                Colours
              </legend>
              <p class="text-ink-muted mb-2 text-xs">
                Particles cycle through the selected colours.
              </p>
              <div class="flex flex-wrap gap-1.5">
                {defaultColors[c.type].map((color) => {
                  const active = c.colors.some((existing) =>
                    existing
                      .toLowerCase()
                      .includes(color.slice(1).toLowerCase()),
                  );
                  return (
                    <button
                      key={color}
                      type="button"
                      aria-pressed={active}
                      aria-label={`Colour ${color}${active ? " (in use)" : ""}`}
                      title={color}
                      onClick$={() => {
                        const list = active
                          ? c.colors.filter(
                              (existing) =>
                                !existing
                                  .toLowerCase()
                                  .includes(color.slice(1).toLowerCase()),
                            )
                          : [...c.colors, color];
                        config.value = {
                          ...config.value,
                          colors: list.length ? list : [color],
                        };
                      }}
                      class={cn(
                        "focus-ring h-7 w-7 rounded-[5px] border-2 transition-colors duration-150",
                        active ? "border-accent" : "border-edge",
                      )}
                      style={`background:${color}`}
                    />
                  );
                })}
              </div>
            </fieldset>
          </div>
        )}
      </div>
    );
  },
);
