"use client";

import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info";

export default function ToastUi({ message, description, variant = "success", onDismiss }: { message: string; description?: string; variant?: ToastVariant; onDismiss: () => void }) {
  const Icon = variant === "error" ? CircleAlert : variant === "info" ? Info : CheckCircle2;
  return (
    <div role="status" className="pointer-events-auto flex w-full items-start gap-3 rounded-2xl border border-border bg-surface p-4 text-fg shadow-2xl">
      <Icon className={cn("mt-0.5 size-5 shrink-0", variant === "success" ? "text-primary" : variant === "error" ? "text-danger-strong" : "text-fg-muted")} />
      <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{message}</p>{description ? <p className="mt-0.5 text-xs text-fg-muted">{description}</p> : null}</div>
      <button type="button" aria-label="Dismiss notification" onClick={onDismiss} className="rounded-lg p-1 text-fg-muted hover:bg-subtle"><X className="size-4" /></button>
    </div>
  );
}
