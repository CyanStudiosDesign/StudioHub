"use client";

import React, { useContext } from "react";
import { cn } from "@/lib/utils";
import { TabsContext } from "./TabsContext";
interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  children: React.ReactNode;
}

export function TabsTrigger({ value, children, className, onClick, ...props }: TabsTriggerProps) {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error("TabsTrigger must be used inside Tabs");
  }

  const { activeTab, setActiveTab } = context;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={activeTab === value}
      onClick={(event) => {
        setActiveTab(value);
        onClick?.(event);
      }}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        activeTab === value
          ? "bg-canvas text-fg shadow-sm"
          : "text-fg-muted hover:text-fg",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
