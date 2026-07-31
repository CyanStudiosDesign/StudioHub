"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type SwitchProps = {
  switchText?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
};

export default function Switch({ switchText, checked, defaultChecked = false, onCheckedChange, disabled, compact, className }: SwitchProps) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isOn = checked ?? internalChecked;
  function toggle() {
    const next = !isOn;
    if (checked === undefined) setInternalChecked(next);
    onCheckedChange?.(next);
  }
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2", disabled && "cursor-not-allowed opacity-60", className)}>
      <button type="button" role="switch" aria-checked={isOn} aria-label={switchText || "Toggle"} disabled={disabled} onClick={toggle} className={cn("relative h-7 w-12 rounded-full border transition-colors focus-ring-visible", isOn ? "border-primary bg-primary" : "border-border bg-subtle")}>
        <span className={cn("absolute top-1/2 size-5 -translate-y-1/2 rounded-full bg-canvas shadow-sm transition-all", isOn ? "left-6" : "left-1")} />
      </button>
      {!compact && switchText ? <span className="text-sm text-fg">{switchText}</span> : null}
    </label>
  );
}
