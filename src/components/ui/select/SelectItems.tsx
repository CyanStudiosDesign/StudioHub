"use client";

import { Check } from "lucide-react";

type SelectItemProps = {
  value: string;
  children: React.ReactNode;
  onSelect?: (value: string) => void;
  selectedValue?: string;
  disabled?: boolean;
};

export function SelectItem({ value, children, onSelect, selectedValue, disabled }: SelectItemProps) {
  const selected = selectedValue === value;
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      disabled={disabled}
      onClick={() => onSelect?.(value)}
      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-fg outline-none transition hover:bg-subtle focus:bg-subtle disabled:opacity-50"
    >
      <span className="truncate">{children}</span>
      {selected ? <Check className="size-4 text-primary" /> : null}
    </button>
  );
}
