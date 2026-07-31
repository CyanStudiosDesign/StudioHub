"use client";

import React, { useContext } from "react";
import { cn } from "@/lib/utils";
import { TabsContext } from "./TabsContext";

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: React.ReactNode;
}

export function TabsContent({
  value,
  children,
  className,
  ...props
}: TabsContentProps) {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error(
      "TabsContent must be used inside Tabs"
    );
  }

  const { activeTab } = context;

  if (activeTab !== value) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      className={cn("mt-6 w-full text-fg", className)}
      {...props}
    >
      {children}
    </div>
  );
}
