"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ContextMenuContentProps {
  children: React.ReactNode;
  x?: number;
  y?: number;
  onClose?: () => void;
  className?: string;
}

export function ContextMenuContent({
  children,
  x = 0,
  y = 0,
  onClose,
  className,
}: ContextMenuContentProps) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        left: Math.max(12, Math.min(x, window.innerWidth - 280)),
        top: Math.max(12, Math.min(y, window.innerHeight - 520)),
      }}
      data-context-menu
      onContextMenu={(event) => event.preventDefault()}
      className={cn(
        "fixed z-50 flex max-h-[min(32rem,calc(100vh-1.5rem))] min-w-64 flex-col overflow-y-auto overscroll-contain rounded-2xl border border-border bg-surface p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-100",
        className,
      )}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<Record<string, unknown>>, { onClose })
          : child,
      )}
    </div>
  );
}
