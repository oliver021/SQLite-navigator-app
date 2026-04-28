import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

let _toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++_toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  return { toasts, push };
}
