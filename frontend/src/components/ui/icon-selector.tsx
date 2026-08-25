import {
  component$,
  useSignal,
  useComputed$,
  $,
  type QRL,
} from "@builder.io/qwik";
import { Check, ChevronDown, ChevronUp, Smile, X } from "lucide-icons-qwik";
import {
  BIO_ICON_CATEGORIES,
  COMMON_EMOJIS,
  getIconDef,
  getIconTint,
  isEmojiIcon,
  searchIcons,
  type BioIconCategory,
} from "~/lib/bio-icons";
import { BioLinkIcon } from "~/components/bio/bio-link-icon";
import { cn } from "~/lib/utils";

export interface IconSelectorProps {
  selectedIcon?: string;
  onIconSelect: QRL<(icon: string) => void>;
  /** Icon guessed from the link URL, offered as a one-click suggestion. */
  suggestedIcon?: string | null;
  class?: string;
}

type Tab = BioIconCategory | "all" | "emoji";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  ...BIO_ICON_CATEGORIES,
  { id: "emoji", label: "Emoji" },
];

/**
 * Icon picker for bio links: searchable brand/glyph catalogue, emoji tab and a
 * free-text escape hatch. Expands in flow rather than as an overlay so it is
 * never clipped by the surrounding card and works the same on mobile.
 */
export const IconSelector = component$<IconSelectorProps>(
  ({ selectedIcon = "", onIconSelect, suggestedIcon, class: className }) => {
    const isOpen = useSignal(false);
    const query = useSignal("");
    const tab = useSignal<Tab>("all");
    const customValue = useSignal("");

    const selectedDef = useComputed$(() =>
      selectedIcon ? getIconDef(selectedIcon) : null,
    );
    const suggestedDef = useComputed$(() =>
      suggestedIcon && suggestedIcon !== selectedIcon
        ? getIconDef(suggestedIcon)
        : null,
    );
    const results = useComputed$(() =>
      tab.value === "emoji" ? [] : searchIcons(query.value, tab.value),
    );
    const customIsUsable = useComputed$(() => {
      const value = customValue.value.trim();
      return !!value && (!!getIconDef(value) || isEmojiIcon(value));
    });

    const select = $((icon: string) => {
      onIconSelect(icon);
      isOpen.value = false;
      query.value = "";
    });

    const applyCustom = $(() => {
      const value = customValue.value.trim();
      if (!value || !(getIconDef(value) || isEmojiIcon(value))) return;
      onIconSelect(getIconDef(value)?.id ?? value);
      customValue.value = "";
      isOpen.value = false;
    });

    return (
      <div class={cn("space-y-2", className)}>
        <div class="border-edge bg-surface rounded-surface flex items-center gap-2 border p-2">
          <div class="bg-surface-subtle rounded-control flex h-9 w-9 shrink-0 items-center justify-center">
            {selectedIcon ? (
              <BioLinkIcon icon={selectedIcon} size={20} />
            ) : (
              <Smile class="text-ink-muted h-5 w-5" />
            )}
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-ink truncate text-sm font-medium">
              {selectedIcon ? (
                (selectedDef.value?.label ?? selectedIcon)
              ) : (
                <span class="text-ink-muted font-normal">No icon</span>
              )}
            </div>
            <div class="text-ink-muted truncate text-xs">
              {selectedIcon
                ? "Shown on your bio page"
                : "Pick a brand, glyph or emoji"}
            </div>
          </div>
          {selectedIcon && (
            <button
              type="button"
              onClick$={() => select("")}
              aria-label="Remove icon"
              class="text-ink-muted hover:text-ink hover:bg-surface-hover rounded-control p-2 transition-colors"
            >
              <X class="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick$={() => (isOpen.value = !isOpen.value)}
            aria-expanded={isOpen.value}
            class="btn-secondary shrink-0 px-3 py-1.5 text-sm"
          >
            {selectedIcon ? "Change" : "Choose"}
            {isOpen.value ? (
              <ChevronUp class="h-4 w-4" />
            ) : (
              <ChevronDown class="h-4 w-4" />
            )}
          </button>
        </div>

        {suggestedDef.value && (
          <button
            type="button"
            onClick$={() => select(suggestedDef.value!.id)}
            class="border-accent/40 bg-accent-soft text-ink hover:bg-accent-soft rounded-surface flex w-full items-center gap-2 border px-3 py-2 text-left text-sm transition-colors"
          >
            <BioLinkIcon
              icon={suggestedDef.value.id}
              size={16}
              color={getIconTint(suggestedDef.value)}
            />
            <span>
              Use <strong>{suggestedDef.value.label}</strong> — matched from the
              link URL
            </span>
          </button>
        )}

        {isOpen.value && (
          <div
            class="border-edge bg-surface rounded-surface space-y-3 border p-3"
            onKeyDown$={(e) => {
              if (e.key === "Escape") isOpen.value = false;
            }}
          >
            <div class="flex items-center gap-2">
              <input
                type="text"
                value={query.value}
                placeholder="Search icons…"
                onInput$={(e) =>
                  (query.value = (e.target as HTMLInputElement).value)
                }
                class="border-edge bg-surface text-ink placeholder:text-ink-muted focus:border-accent focus:ring-accent/40 rounded-control w-full border px-3 py-2 text-sm transition-colors focus:ring-2 focus:outline-none"
              />
              {query.value && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick$={() => (query.value = "")}
                  class="text-ink-muted hover:text-ink p-1"
                >
                  <X class="h-4 w-4" />
                </button>
              )}
            </div>

            <div class="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick$={() => (tab.value = t.id)}
                  class={cn(
                    "shrink-0 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors",
                    tab.value === t.id
                      ? "bg-accent-soft text-accent-text"
                      : "text-ink-muted hover:text-ink hover:bg-surface-hover",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab.value === "emoji" ? (
              <div class="grid max-h-56 grid-cols-8 gap-1 overflow-y-auto sm:grid-cols-10">
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick$={() => select(emoji)}
                    aria-label={`Emoji ${emoji}`}
                    class={cn(
                      "rounded-control flex aspect-square items-center justify-center text-lg transition-colors",
                      selectedIcon === emoji
                        ? "bg-accent-soft ring-accent ring-2"
                        : "hover:bg-surface-hover",
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ) : results.value.length > 0 ? (
              <div class="grid max-h-56 grid-cols-3 gap-1.5 overflow-y-auto sm:grid-cols-4 lg:grid-cols-5">
                {results.value.map((def) => {
                  const active = selectedDef.value?.id === def.id;
                  return (
                    <button
                      key={def.id}
                      type="button"
                      onClick$={() => select(def.id)}
                      title={def.label}
                      aria-pressed={active}
                      class={cn(
                        "rounded-control relative flex flex-col items-center gap-1.5 px-1 py-2.5 transition-colors",
                        active
                          ? "bg-accent-soft ring-accent ring-2"
                          : "hover:bg-surface-hover",
                      )}
                    >
                      <BioLinkIcon
                        icon={def.id}
                        size={22}
                        color={getIconTint(def)}
                      />
                      <span class="text-ink w-full truncate text-center text-[11px] leading-tight">
                        {def.label}
                      </span>
                      {active && (
                        <Check class="text-accent-text absolute top-1 right-1 h-3 w-3" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p class="text-ink-muted py-6 text-center text-sm">
                No icons match “{query.value}”. Try the Emoji tab or paste one
                below.
              </p>
            )}

            <div class="border-edge border-t pt-3">
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  value={customValue.value}
                  placeholder="Or paste your own emoji…"
                  maxLength={20}
                  onInput$={(e) =>
                    (customValue.value = (e.target as HTMLInputElement).value)
                  }
                  onKeyDown$={(e) => {
                    if (e.key === "Enter") applyCustom();
                  }}
                  class="border-edge bg-surface text-ink placeholder:text-ink-muted focus:border-accent focus:ring-accent/40 rounded-control min-w-0 flex-1 border px-3 py-1.5 text-sm transition-colors focus:ring-2 focus:outline-none"
                />
                <button
                  type="button"
                  onClick$={applyCustom}
                  disabled={!customIsUsable.value}
                  class="btn-secondary shrink-0 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Use
                </button>
              </div>
              {customValue.value.trim() && !customIsUsable.value && (
                <p class="text-ink-muted mt-1.5 text-xs">
                  That isn't an emoji — plain text would show up as-is on your
                  page.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  },
);
