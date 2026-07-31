"use client";

import { cn } from "@/lib/utils";
import { Check, ChevronDown } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

type SelectProps = {
  title: string;
  children: React.ReactNode;
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
};

type SelectChildProps = {
  value?: string;
  children?: React.ReactNode;
};

function findLabel(children: React.ReactNode, value: string): string | null {
  let label: string | null = null;
  React.Children.forEach(children, (child) => {
    if (label || !React.isValidElement<SelectChildProps>(child)) return;
    if (child.props.value === value) {
      label = typeof child.props.children === "string" ? child.props.children : value;
      return;
    }
    label = findLabel(child.props.children, value);
  });
  return label;
}

export function Select({
  title,
  children,
  name,
  value,
  defaultValue = "",
  onValueChange,
  required,
  disabled,
  className,
  triggerClassName,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selectRef = useRef<HTMLDivElement>(null);
  const selectedValue = value ?? internalValue;
  const selectedLabel = findLabel(children, selectedValue) ?? title;

  function handleSelect(nextValue: string) {
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
    setOpen(false);
  }

  useEffect(() => {
    function close(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  useEffect(() => {
    const form = selectRef.current?.closest("form");
    if (!form || value !== undefined) return;
    const reset = () => {
      setInternalValue(defaultValue);
      setOpen(false);
    };
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [defaultValue, value]);

  return (
    <div ref={selectRef} className={cn("relative w-full", className)}>
      {name ? <input type="hidden" name={name} value={selectedValue} required={required} /> : null}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-xl border border-border bg-surface px-4 text-sm font-medium text-fg shadow-sm outline-none transition hover:bg-subtle focus-ring-visible disabled:cursor-not-allowed disabled:opacity-60",
          triggerClassName,
        )}
      >
        <span className={cn("truncate", !selectedValue && "text-fg-muted")}>{selectedLabel}</span>
        <ChevronDown className={cn("size-4 shrink-0 text-fg-muted transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div role="listbox" className="absolute left-0 top-full z-50 mt-1 max-h-72 w-full min-w-48 overflow-y-auto rounded-2xl border border-border bg-surface p-2 shadow-2xl">
          {React.Children.map(children, (child) =>
            React.isValidElement(child)
              ? React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
                  onSelect: handleSelect,
                  selectedValue,
                  selectedIcon: Check,
                })
              : child,
          )}
        </div>
      ) : null}
    </div>
  );
}
