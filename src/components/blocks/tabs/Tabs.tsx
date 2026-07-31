"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { TabsContext } from "./TabsContext";

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  defaultValue: string;
}

export function Tabs({ children, defaultValue, className, ...props }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider
      value={{
        activeTab,
        setActiveTab,
      }}
    >
      <div className={cn("w-full", className)} {...props}>{children}</div>
    </TabsContext.Provider>
  );
}
