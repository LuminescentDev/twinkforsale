import { component$, $ } from "@builder.io/qwik";
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  CircleX,
  X,
} from "lucide-icons-qwik";
import { useContext } from "@builder.io/qwik";
import { ToastContext, type ToastTone } from "~/lib/toast-store";
import { IconButton } from "./icon-button";

const toneIcon: Record<ToastTone, any> = {
  success: CheckCircle2,
  error: CircleX,
  warning: AlertTriangle,
  info: Info,
};

const toneClass: Record<ToastTone, string> = {
  success: "text-success",
  error: "text-danger",
  warning: "text-warning",
  info: "text-info",
};

/**
 * Transient status messages, bottom-right on desktop and above the mobile
 * bottom bar on phones. Every toast is also mirrored into a polite live region
 * so its content is announced rather than only shown.
 */
export const Toaster = component$(() => {
  const store = useContext(ToastContext);

  const dismiss = $((id: string) => {
    const index = store.toasts.findIndex((t) => t.id === id);
    if (index > -1) store.toasts.splice(index, 1);
  });

  return (
    <>
      <div aria-live="polite" aria-atomic="true" class="sr-only">
        {store.announcement}
      </div>
      {store.toasts.length > 0 && (
        <div class="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col items-end gap-2 p-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-0 sm:bottom-0 sm:max-w-sm lg:pb-4">
          {store.toasts.map((toast) => {
            const Icon = toneIcon[toast.tone];
            return (
              <div
                key={toast.id}
                class="retro-frame bg-surface rounded-surface shadow-pop pointer-events-auto flex w-full items-start gap-2.5 px-3 py-2.5"
              >
                <Icon
                  class={`mt-0.5 h-4 w-4 shrink-0 ${toneClass[toast.tone]}`}
                />
                <div class="min-w-0 flex-1">
                  <p class="text-ink text-[13px] leading-5 font-medium">
                    {toast.title}
                  </p>
                  {toast.detail && (
                    <p class="text-ink-muted mt-0.5 text-xs leading-4">
                      {toast.detail}
                    </p>
                  )}
                </div>
                <IconButton
                  size="sm"
                  label="Dismiss"
                  onClick$={() => dismiss(toast.id)}
                  class="-mt-1 -mr-1.5"
                >
                  <X class="h-3.5 w-3.5" />
                </IconButton>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
});
