import {
  createContextId,
  useContext,
  useContextProvider,
  useStore,
  $,
} from "@builder.io/qwik";

export type ToastTone = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  tone: ToastTone;
  title: string;
  /** Optional second line: what happened, and what the user can do next. */
  detail?: string;
  /** Auto-dismiss delay in ms. 0 keeps the toast until dismissed. */
  duration: number;
}

export interface ToastStore {
  toasts: Toast[];
  /** Mirrored into a live region so assistive technology hears every toast. */
  announcement: string;
  /** Kept in the store: the optimizer turns a module-level `let` into a const. */
  nextId: number;
}

export const ToastContext = createContextId<ToastStore>("toast-context");

/** Errors stay until dismissed; everything else clears on its own. */
const DEFAULT_DURATION: Record<ToastTone, number> = {
  success: 3000,
  info: 4000,
  warning: 6000,
  error: 0,
};

export const useToastProvider = () => {
  const store = useStore<ToastStore>({
    toasts: [],
    announcement: "",
    nextId: 0,
  });
  useContextProvider(ToastContext, store);
  return store;
};

export const useToast = () => {
  const store = useContext(ToastContext);

  const push = $(
    (tone: ToastTone, title: string, detail?: string, duration?: number) => {
      const id = `t${++store.nextId}`;
      const resolved = duration ?? DEFAULT_DURATION[tone];
      store.toasts.push({ id, tone, title, detail, duration: resolved });
      store.announcement = detail ? `${title}. ${detail}` : title;
      if (resolved > 0) {
        setTimeout(() => {
          const index = store.toasts.findIndex((t) => t.id === id);
          if (index > -1) store.toasts.splice(index, 1);
        }, resolved);
      }
      return id;
    },
  );

  return {
    success: $((title: string, detail?: string) => push("success", title, detail)),
    error: $((title: string, detail?: string) => push("error", title, detail)),
    warning: $((title: string, detail?: string) => push("warning", title, detail)),
    info: $((title: string, detail?: string) => push("info", title, detail)),
    dismiss: $((id: string) => {
      const index = store.toasts.findIndex((t) => t.id === id);
      if (index > -1) store.toasts.splice(index, 1);
    }),
    clear: $(() => {
      store.toasts.splice(0, store.toasts.length);
    }),
  };
};
