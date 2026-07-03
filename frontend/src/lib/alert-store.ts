import { createContextId, useContext, useStore, useContextProvider } from "@builder.io/qwik";

export interface Alert {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  title: string;
  message: string;
  duration?: number; // Auto-dismiss duration in ms (0 = no auto-dismiss)
  confirmText?: string;
  cancelText?: string;
}

export interface AlertStore {
  alerts: Alert[];
}

export const AlertContext = createContextId<AlertStore>('alert-context');

// Global callback registry (not stored in Qwik store)
const callbackRegistry = new Map<string, { onConfirm?: () => void; onCancel?: () => void }>();

export const useAlertStore = () => useContext(AlertContext);

export const useAlertProvider = () => {
  const store = useStore<AlertStore>({
    alerts: []
  });

  useContextProvider(AlertContext, store);
  return store;
};

export const createAlert = (
  alert: Omit<Alert, 'id'>,
  callbacks?: { onConfirm?: () => void; onCancel?: () => void }
): string => {
  const id = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newAlert: Alert = {
    ...alert,
    id,
    duration: alert.duration ?? (alert.type === 'success' ? 3000 : alert.type === 'confirm' ? 0 : 5000)
  };

  // We can't access the store here directly since this is a utility function
  // The store access needs to happen in components

  // Store callbacks separately in global registry if provided
  if (callbacks) {
    callbackRegistry.set(id, callbacks);
  }

  return id;
};

export const removeAlert = (id: string) => {
  // Clean up callbacks
  callbackRegistry.delete(id);
  return id; // Return the ID for the component to use
};

export const clearAllAlerts = () => {
  // Clean up all callbacks
  callbackRegistry.clear();
};

// Get callbacks for an alert
export const getAlertCallbacks = (id: string) => {
  return callbackRegistry.get(id);
};

// Helper functions for common alert types
export const showSuccess = (title: string, message: string, duration?: number) => {
  return createAlert({ type: 'success', title, message, duration });
};

export const showError = (title: string, message: string, duration?: number) => {
  return createAlert({ type: 'error', title, message, duration });
};

export const showWarning = (title: string, message: string, duration?: number) => {
  return createAlert({ type: 'warning', title, message, duration });
};

export const showInfo = (title: string, message: string, duration?: number) => {
  return createAlert({ type: 'info', title, message, duration });
};

export const showConfirm = (
  title: string,
  message: string,
  onConfirm?: () => void,
  onCancel?: () => void,
  confirmText?: string,
  cancelText?: string
) => {
  return createAlert({
    type: 'confirm',
    title,
    message,
    confirmText,
    cancelText,
    duration: 0 // Never auto-dismiss confirmations
  }, { onConfirm, onCancel });
};
