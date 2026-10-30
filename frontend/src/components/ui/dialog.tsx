import {
  component$,
  Slot,
  useId,
  useSignal,
  useVisibleTask$,
  type QRL,
  type Signal,
} from "@builder.io/qwik";
import { X } from "lucide-icons-qwik";
import { cn } from "~/lib/utils";
import { Button } from "./button";
import { IconButton } from "./icon-button";

export interface DialogProps {
  /** Bound open state. Set false to close; Escape and the backdrop also close. */
  open: Signal<boolean>;
  title: string;
  /** Sits under the title, before the body. Keep to one line where possible. */
  description?: string;
  size?: "sm" | "md" | "lg";
  /** Called after the dialog closes, whatever dismissed it. */
  onClose$?: QRL<() => void>;
  class?: string;
}

const sizeMap: Record<NonNullable<DialogProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

/**
 * Focused decision or short contained task, on a native `<dialog>`: the
 * browser supplies the modal backdrop, focus trap, focus return and Escape
 * handling. Put footer controls in the `footer` slot.
 */
export const Dialog = component$<DialogProps>(
  ({ open, title, description, size = "md", onClose$, class: className }) => {
    const ref = useSignal<HTMLDialogElement>();
    const titleId = useId();

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(
      ({ track }) => {
        const el = ref.value;
        if (!el) return;
        const shouldOpen = track(() => open.value);
        if (shouldOpen && !el.open) el.showModal();
        else if (!shouldOpen && el.open) el.close();
      },
      // A closed <dialog> is `display: none`, so it never intersects the
      // viewport; the task has to register on load instead.
      { strategy: "document-ready" },
    );

    return (
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        onClose$={async () => {
          open.value = false;
          if (onClose$) await onClose$();
        }}
        onClick$={(event, el) => {
          // Clicks land on the <dialog> itself only when they hit the backdrop.
          if (event.target === el) el.close();
        }}
        class={cn(
          "rounded-dialog retro-frame bg-surface text-ink shadow-pop m-auto w-[calc(100vw-2rem)] p-0 backdrop:backdrop-blur-[2px]",
          sizeMap[size],
          className,
        )}
      >
        <div class="flex max-h-[85vh] flex-col">
          <div class="retro-title flex items-start justify-between gap-4 px-4 py-2">
            <div class="min-w-0">
              {/* Inter, not the pixel face: titles often carry names and counts. */}
              <h2
                id={titleId}
                class="font-sans text-base leading-6 font-semibold"
              >
                {title}
              </h2>
              {description && (
                <p class="mt-0.5 font-sans text-[13px] leading-5 opacity-90">
                  {description}
                </p>
              )}
            </div>
            <IconButton
              size="sm"
              label="Close"
              onClick$={() => (open.value = false)}
              class="text-on-accent hover:bg-on-accent/15 hover:text-on-accent -mr-1.5"
            >
              <X class="h-4 w-4" />
            </IconButton>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <Slot />
          </div>

          <div class="border-edge flex flex-wrap items-center justify-end gap-2 border-t px-5 py-3 empty:hidden">
            <Slot name="footer" />
          </div>
        </div>
      </dialog>
    );
  },
);

export interface ConfirmDialogProps {
  open: Signal<boolean>;
  title: string;
  /** State the consequence plainly — filenames, counts, whether it is reversible. */
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm$: QRL<() => void>;
  busy?: boolean;
  /** `danger` for irreversible actions. */
  tone?: "danger" | "primary";
}

/** Destructive/irreversible confirmation. Body content goes in the default slot. */
export const ConfirmDialog = component$<ConfirmDialogProps>(
  ({
    open,
    title,
    description,
    confirmLabel,
    cancelLabel = "Cancel",
    onConfirm$,
    busy,
    tone = "danger",
  }) => (
    <Dialog open={open} title={title} description={description} size="sm">
      <Slot />
      <Button
        q:slot="footer"
        variant="secondary"
        onClick$={() => (open.value = false)}
      >
        {cancelLabel}
      </Button>
      <Button
        q:slot="footer"
        variant={tone}
        loading={busy}
        onClick$={onConfirm$}
      >
        {confirmLabel}
      </Button>
    </Dialog>
  ),
);

export interface SheetProps {
  open: Signal<boolean>;
  title: string;
  /** Which edge it slides from. `bottom` suits the mobile More menu. */
  side?: "bottom" | "right";
  onClose$?: QRL<() => void>;
  class?: string;
}

/**
 * Edge-anchored panel for secondary navigation and mobile overflow. Same
 * native `<dialog>` semantics as {@link Dialog}, positioned against an edge and
 * padded for the device safe area.
 */
export const Sheet = component$<SheetProps>(
  ({ open, title, side = "bottom", onClose$, class: className }) => {
    const ref = useSignal<HTMLDialogElement>();
    const titleId = useId();

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(
      ({ track }) => {
        const el = ref.value;
        if (!el) return;
        const shouldOpen = track(() => open.value);
        if (shouldOpen && !el.open) el.showModal();
        else if (!shouldOpen && el.open) el.close();
      },
      // A closed <dialog> is `display: none`, so it never intersects the
      // viewport; the task has to register on load instead.
      { strategy: "document-ready" },
    );

    return (
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        onClose$={async () => {
          open.value = false;
          if (onClose$) await onClose$();
        }}
        onClick$={(event, el) => {
          if (event.target === el) el.close();
        }}
        class={cn(
          "border-accent-text bg-surface text-ink shadow-pop max-h-[85vh] border-[3px] border-double p-0 backdrop:backdrop-blur-[2px]",
          side === "bottom"
            ? "rounded-t-dialog mt-auto mb-0 ml-0 w-full max-w-none border-x-0 border-b-0"
            : "rounded-l-dialog my-0 mr-0 ml-auto h-full max-h-none w-80 max-w-[85vw] border-y-0 border-r-0",
          className,
        )}
      >
        <div class="flex max-h-[85vh] flex-col">
          <div class="retro-title flex items-center justify-between gap-4 px-4 py-2">
            <h2 id={titleId} class="text-base font-semibold">
              {title}
            </h2>
            <IconButton
              size="sm"
              label="Close"
              onClick$={() => (open.value = false)}
              class="text-on-accent hover:bg-on-accent/15 hover:text-on-accent -mr-1"
            >
              <X class="h-4 w-4" />
            </IconButton>
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <Slot />
          </div>
        </div>
      </dialog>
    );
  },
);
