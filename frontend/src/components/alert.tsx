import { component$, $ } from "@builder.io/qwik";
import {
  CheckCircle,
  AlertTriangle,
  Info,
  X,
  AlertCircle,
  Heart,
} from "lucide-icons-qwik";
import type { Alert } from "~/lib/alert-store";
import {
  useAlertStore,
  removeAlert,
  getAlertCallbacks,
} from "~/lib/alert-store";

interface AlertItemProps {
  alert: Alert;
}

export const AlertItem = component$<AlertItemProps>(({ alert }) => {
  const store = useAlertStore();
  const alertId = alert.id;

  const handleClose = $((id: string) => {
    const index = store.alerts.findIndex((a) => a.id === id);
    if (index > -1) {
      store.alerts.splice(index, 1);
    }
    removeAlert(id); // Clean up callbacks
  });

  const handleConfirm = $((id: string) => {
    const callbacks = getAlertCallbacks(id);
    if (callbacks?.onConfirm) {
      callbacks.onConfirm();
    }
    const index = store.alerts.findIndex((a) => a.id === id);
    if (index > -1) {
      store.alerts.splice(index, 1);
    }
    removeAlert(id); // Clean up callbacks
  });

  const handleCancel = $((id: string) => {
    const callbacks = getAlertCallbacks(id);
    if (callbacks?.onCancel) {
      callbacks.onCancel();
    }
    const index = store.alerts.findIndex((a) => a.id === id);
    if (index > -1) {
      store.alerts.splice(index, 1);
    }
    removeAlert(id); // Clean up callbacks
  });
  const getAlertStyles = () => {
    switch (alert.type) {
      case "success":
        return {
          container: "bg-gradient-to-br from-theme-confirm to-theme-confirm-hover border-theme-success",
          icon: "text-theme-success",
          title: "text-theme-success",
          message: "text-theme-success",
          button: "text-theme-success hover:bg-theme-success/10",
        };
      case "error":
        return {
          container: "bg-gradient-to-br from-theme-deny to-theme-deny-hover border-theme-error",
          icon: "text-theme-error",
          title: "text-theme-error",
          message: "text-theme-error",
          button: "text-theme-error hover:bg-theme-error/10",
        };
      case "warning":
        return {
          container: "bg-gradient-to-br from-theme-[#f59e0b] to-theme-[#d97706] border-theme-warning",
          icon: "text-theme-warning",
          title: "text-theme-warning",
          message: "text-theme-warning",
          button: "text-theme-warning hover:bg-theme-warning/10",
        };
      case "info":
        return {
          container:
            "bg-gradient-to-br from-theme-accent-primary/20 to-theme-accent-secondary/20 border-theme-accent-secondary/30",
          icon: "text-theme-accent-secondary",
          title: "text-theme-accent-secondary",
          message: "text-theme-text-secondary",
          button:
            "text-theme-accent-secondary hover:bg-theme-accent-secondary/10",
        };
      case "confirm":
        return {
          container:
            "bg-gradient-to-br from-theme-accent-tertiary/20 to-theme-accent-quaternary/20 border-theme-accent-tertiary/30",
          icon: "text-theme-accent-tertiary",
          title: "text-theme-accent-tertiary",
          message: "text-theme-text-secondary",
          button:
            "text-theme-accent-tertiary hover:bg-theme-accent-tertiary/10",
        };
      default:
        return {
          container: "glass border-theme-card-border",
          icon: "text-theme-text-secondary",
          title: "text-theme-primary",
          message: "text-theme-text-secondary",
          button:
            "text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-accent/10",
        };
    }
  };

  const getIcon = () => {
    switch (alert.type) {
      case "success":
        return <CheckCircle class="h-5 w-5" />;
      case "error":
        return <AlertCircle class="h-5 w-5" />;
      case "warning":
        return <AlertTriangle class="h-5 w-5" />;
      case "info":
        return <Info class="h-5 w-5" />;
      case "confirm":
        return <Heart class="h-5 w-5" />;
      default:
        return <Info class="h-5 w-5" />;
    }
  };

  const styles = getAlertStyles();
  return (
    <div
      class={`animate-in slide-in-from-right-full glass relative rounded-2xl border p-4 shadow-lg backdrop-blur-sm transition-all duration-300 ease-out hover:scale-[1.02] ${styles.container} `}
    >
      <div class="flex items-start gap-3">
        <div class={`flex-shrink-0 ${styles.icon}`}>{getIcon()}</div>
        <div class="min-w-0 flex-1">
          <h4 class={`text-sm font-semibold ${styles.title}`}>{alert.title}</h4>
          <p class={`mt-1 text-sm ${styles.message}`}>{alert.message}</p>
          {alert.type === "confirm" && (
            <div class="mt-3 flex gap-2">
              <button
                onClick$={() => handleConfirm(alertId)}
                class="btn-cute rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-all duration-300 hover:scale-105"
              >
                {alert.confirmText || "Confirm"}
              </button>
              <button
                onClick$={() => handleCancel(alertId)}
                class="glass border-theme-card-border text-theme-text-secondary hover:border-theme-accent-primary/40 hover:text-theme-text-primary rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-300 hover:scale-105"
              >
                {alert.cancelText || "Cancel"}
              </button>
            </div>
          )}
        </div>

        {alert.type !== "confirm" && (
          <button
            onClick$={() => handleClose(alertId)}
            class={`flex-shrink-0 rounded-full p-1 transition-all duration-300 hover:scale-110 ${styles.button} `}
            title="Close"
          >
            <X class="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
});

export const AlertContainer = component$(() => {
  const store = useAlertStore();

  return (
    <div class="pointer-events-none fixed top-4 right-4 z-50 w-full max-w-sm space-y-3 p-4 sm:p-0">
      {store.alerts.map((alert, index) => (
        <div
          key={alert.id}
          class={`pointer-events-auto animation-delay-${index * 200}`}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <AlertItem alert={alert} />
        </div>
      ))}
    </div>
  );
});
