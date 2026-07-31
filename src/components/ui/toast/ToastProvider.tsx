"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import ToastUi, { type ToastVariant } from "./ToastUi";

type ToastInput = { message: string; description?: string; variant?: ToastVariant; duration?: number };
type ToastEntry = ToastInput & { id: number };
const ToastContext = createContext<((toast: ToastInput) => void) | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const toast = useCallback((input: ToastInput) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { ...input, id }]);
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), input.duration ?? 4000);
  }, []);
  const value = useMemo(() => toast, [toast]);
  return <ToastContext.Provider value={value}>{children}<div className="pointer-events-none fixed right-4 top-20 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">{toasts.map((item) => <ToastUi key={item.id} {...item} onDismiss={() => setToasts((current) => current.filter((toastItem) => toastItem.id !== item.id))} />)}</div></ToastContext.Provider>;
}

export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error("useToast must be used within ToastProvider");
  return toast;
}
