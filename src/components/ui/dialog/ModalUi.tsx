"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  handleClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}
const ModalUi = ({ handleClose, title, description, children, className }: DialogProps) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="cyan-dialog-title"
        aria-describedby={description ? "cyan-dialog-description" : undefined}
        className={cn(
          "max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-border bg-surface text-fg shadow-[0_30px_100px_rgb(0_0_0/0.45)]",
          className,
        )}
      >
        <header className="flex items-start justify-between gap-6 border-b border-border px-6 py-5 sm:px-8">
          <div>
            <h2 id="cyan-dialog-title" className="text-xl font-semibold tracking-tight">
              {title}
            </h2>
            {description ? (
              <p id="cyan-dialog-description" className="mt-1.5 text-sm leading-6 text-fg-muted">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Close settings"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl text-fg-muted transition hover:bg-subtle hover:text-fg focus-ring-visible"
            onClick={handleClose}
          >
            <X size={18} />
          </button>
        </header>
        <div className="max-h-[calc(88vh-94px)] overflow-y-auto px-6 py-6 sm:px-8">
          {children}
        </div>
      </section>
    </div>
  );
};

export default ModalUi;
