import { component$, Slot, useSignal, type Signal } from "@builder.io/qwik";
import { Eye, EyeOff, Pencil } from "lucide-icons-qwik";
import { Button, SegmentedControl } from "~/components/ui";
import { cn } from "~/lib/utils";

export interface EditorLayoutProps {
  /** Names the preview, e.g. "bio page" or "Discord embed". */
  previewLabel: string;
  /** Set when the editor supplies section navigation in the `nav` slot. */
  hasNav?: boolean;
  /** Bound Edit/Preview mode, used below `md` where a split view will not fit. */
  mode: Signal<string>;
}

/**
 * Settings-and-preview layout shared by the Bio and Embed editors.
 *
 * - At `xl`: section navigation, a settings column and a sticky preview.
 * - Between `md` and `xl`: a scrolling section row, settings at full width, and
 *   an explicit Preview action that reveals the preview above them.
 * - Below `md`: an Edit/Preview switch, because a split view would leave
 *   neither side usable.
 *
 * Each slot is rendered exactly once and repositioned with flex ordering, so
 * preview state survives every breakpoint change.
 */
export const EditorLayout = component$<EditorLayoutProps>(
  ({ previewLabel, hasNav, mode }) => {
    // Only reachable between `md` and `xl`; at `xl` the preview is always up,
    // and below `md` the mode switch governs instead.
    const revealed = useSignal(false);
    const previewVisible = revealed.value || mode.value === "preview";
    const hideSettings = mode.value === "preview";

    return (
      <>
        <div class="mb-4 md:hidden">
          <SegmentedControl
            label="Editor view"
            value={mode}
            class="w-full"
            options={[
              { value: "edit", label: "Edit", icon: Pencil },
              { value: "preview", label: "Preview", icon: Eye },
            ]}
          />
        </div>

        <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:gap-8">
          {hasNav && (
            <div
              class={cn(
                "order-1 min-w-0 shrink-0 xl:order-1 xl:w-44",
                hideSettings && "hidden md:block",
              )}
            >
              <Slot name="nav" />
            </div>
          )}

          {/* Tablet-only preview toggle, above the preview it controls. */}
          <div class="order-2 hidden justify-end md:flex xl:hidden">
            <Button
              variant="secondary"
              aria-expanded={revealed.value}
              onClick$={() => (revealed.value = !revealed.value)}
            >
              {revealed.value ? (
                <EyeOff class="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye class="h-4 w-4" aria-hidden="true" />
              )}
              {revealed.value ? "Hide preview" : `Preview ${previewLabel}`}
            </Button>
          </div>

          <aside
            aria-label={`${previewLabel} preview`}
            class={cn(
              // Bounded so the settings stay reachable when the preview is tall.
              "order-3 min-w-0 overflow-auto",
              "max-h-[60vh] xl:sticky xl:top-6 xl:order-3 xl:block xl:max-h-[calc(100vh-3rem)] xl:w-[24rem] xl:shrink-0 2xl:w-[28rem]",
              previewVisible ? "block" : "hidden",
            )}
          >
            <Slot name="preview" />
          </aside>

          <div
            class={cn(
              "order-4 min-w-0 flex-1 xl:order-2",
              hideSettings && "hidden md:block",
            )}
          >
            <Slot name="settings" />
          </div>
        </div>
      </>
    );
  },
);
