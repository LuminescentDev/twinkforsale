import { $ } from "@builder.io/qwik";
import { useAlertStore, createAlert } from "./alert-store";

export const useAlert = () => {
  const store = useAlertStore();

  const addAlert = $((alert: any, callbacks?: any) => {
    const id = createAlert(alert, callbacks);
    const newAlert = { ...alert, id };
    
    // Add to store
    store.alerts.push(newAlert);
    
    // Auto-dismiss if duration is set
    if (newAlert.duration && newAlert.duration > 0) {
      setTimeout(() => {
        const index = store.alerts.findIndex(a => a.id === id);
        if (index > -1) {
          store.alerts.splice(index, 1);
        }
      }, newAlert.duration);
    }
    
    return id;
  });

  const success = $((title: string, message: string, duration?: number) => {
    return addAlert({ type: 'success', title, message, duration });
  });

  const error = $((title: string, message: string, duration?: number) => {
    return addAlert({ type: 'error', title, message, duration });
  });

  const warning = $((title: string, message: string, duration?: number) => {
    return addAlert({ type: 'warning', title, message, duration });
  });

  const info = $((title: string, message: string, duration?: number) => {
    return addAlert({ type: 'info', title, message, duration });
  });

  const confirm = $((
    title: string, 
    message: string, 
    onConfirm?: () => void, 
    onCancel?: () => void,
    confirmText?: string,
    cancelText?: string
  ) => {
    return addAlert({ 
      type: 'confirm', 
      title, 
      message,
      confirmText,
      cancelText,
      duration: 0
    }, { onConfirm, onCancel });
  });

  // Helper for promise-based confirmation
  const confirmAsync = $((title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      confirm(
        title, 
        message,
        () => resolve(true),
        () => resolve(false)
      );
    });
  });

  const remove = $((id: string) => {
    const index = store.alerts.findIndex(alert => alert.id === id);
    if (index > -1) {
      store.alerts.splice(index, 1);
    }
  });

  const clear = $(() => {
    store.alerts.splice(0, store.alerts.length);
  });

  return {
    success,
    error,
    warning,
    info,
    confirm,
    confirmAsync,
    remove,
    clear
  };
};
