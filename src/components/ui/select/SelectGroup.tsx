"use client";

import React from "react";

type SelectGroupProps = {
  title?: string;
  children: React.ReactNode;
  onSelect?: (value: string) => void;
  selectedValue?: string;
  showDivider?: boolean;
};

export function SelectGroup({ title, children, onSelect, selectedValue, showDivider }: SelectGroupProps) {
  return (
    <div className="flex flex-col py-1">
      {title ? <p className="px-2 pb-1 pt-1 text-xs font-bold uppercase tracking-wider text-fg-muted">{title}</p> : null}
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<Record<string, unknown>>, { onSelect, selectedValue })
          : child,
      )}
      {showDivider ? <hr className="my-1 border-border" /> : null}
    </div>
  );
}
