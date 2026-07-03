import { component$, useSignal, $, type QRL } from "@builder.io/qwik";
import { PREDEFINED_ICONS, COMMON_EMOJIS } from "~/lib/bio-icons";
import { BioLinkIcon } from "~/components/bio/bio-link-icon";

export interface IconSelectorProps {
  selectedIcon?: string;
  onIconSelect: QRL<(icon: string) => void>;
  class?: string;
}

export const IconSelector = component$<IconSelectorProps>(
  ({ selectedIcon = "", onIconSelect, class: className = "" }) => {
    const isOpen = useSignal(false);
    const customIconValue = useSignal("");

    const handleIconSelect = $((icon: string) => {
      onIconSelect(icon);
      isOpen.value = false;
    });

    const handleCustomIconSubmit = $(() => {
      if (customIconValue.value.trim()) {
        onIconSelect(customIconValue.value.trim());
        customIconValue.value = "";
        isOpen.value = false;
      }
    });
    return (
      <div class={`relative ${className}`}>
        {/* Trigger Button */}
        <button
          type="button"
          onClick$={() => (isOpen.value = !isOpen.value)}
          class="border-theme-card-border bg-theme-bg-secondary hover:bg-theme-bg-tertiary focus:ring-theme-accent-primary/50 flex h-10 w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all focus:ring-2 focus:outline-none"
        >
          <div class="flex h-6 w-6 items-center justify-center">
            {selectedIcon ? (
              <BioLinkIcon icon={selectedIcon} size={16} />
            ) : (
              <span class="text-theme-text-muted text-xs">No icon</span>
            )}
          </div>
          <span class="text-theme-text-primary flex-1 text-sm">
            {selectedIcon || "Select icon..."}
          </span>
          <span class="text-theme-text-muted text-xs">
            {isOpen.value ? "▲" : "▼"}
          </span>
        </button>

        {/* Dropdown */}
        {isOpen.value && (
          <>
            {/* Backdrop */}
            <div
              class="fixed inset-0 z-[9999]"
              onClick$={() => (isOpen.value = false)}
            />
            {/* Dropdown Content */}
            <div class="border-theme-card-border bg-theme-bg-primary absolute right-0 bottom-full left-0 z-[10000] mb-2 max-h-96 overflow-y-auto rounded-xl border p-4 shadow-2xl">
              <div class="space-y-4">
                {/* Platform Icons */}
                <div>
                  <h4 class="text-theme-text-primary mb-2 text-sm font-medium">
                    Platform Icons
                  </h4>
                  <div class="grid grid-cols-4 gap-2">
                    {Object.keys(PREDEFINED_ICONS).map((iconName) => (
                      <button
                        key={iconName}
                        type="button"
                        onClick$={() => handleIconSelect(iconName)}
                        class={`hover:bg-theme-accent-primary/10 flex h-10 w-10 items-center justify-center rounded-lg border transition-all ${
                          selectedIcon === iconName
                            ? "border-theme-accent-primary bg-theme-accent-primary/20"
                            : "border-theme-card-border"
                        }`}
                        title={iconName}
                      >
                        <BioLinkIcon icon={iconName} size={16} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Emojis */}
                <div>
                  <h4 class="text-theme-text-primary mb-2 text-sm font-medium">
                    Emojis
                  </h4>
                  <div class="grid grid-cols-8 gap-1">
                    {COMMON_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick$={() => handleIconSelect(emoji)}
                        class={`hover:bg-theme-accent-primary/10 flex h-8 w-8 items-center justify-center rounded border transition-all ${
                          selectedIcon === emoji
                            ? "border-theme-accent-primary bg-theme-accent-primary/20"
                            : "border-theme-card-border"
                        }`}
                        title={emoji}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Icon Input */}
                <div>
                  <h4 class="text-theme-text-primary mb-2 text-sm font-medium">
                    Custom Icon
                  </h4>
                  <div class="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter emoji or icon name..."
                      value={customIconValue.value}
                      onInput$={(e) =>
                        (customIconValue.value = (
                          e.target as HTMLInputElement
                        ).value)
                      }
                      onKeyDown$={(e) => {
                        if (e.key === "Enter") {
                          handleCustomIconSubmit();
                        }
                      }}
                      class="border-theme-card-border bg-theme-bg-secondary focus:ring-theme-accent-primary/50 flex-1 rounded border px-2 py-1 text-sm focus:ring-2 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick$={handleCustomIconSubmit}
                      class="bg-theme-accent-primary hover:bg-theme-accent-primary/80 rounded px-3 py-1 text-sm text-white transition-all"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Clear Selection */}
                <div class="border-theme-card-border border-t pt-3">
                  <button
                    type="button"
                    onClick$={() => handleIconSelect("")}
                    class="border-theme-card-border text-theme-text-secondary hover:bg-theme-bg-secondary w-full rounded border py-2 text-sm transition-all"
                  >
                    No Icon
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  },
);
