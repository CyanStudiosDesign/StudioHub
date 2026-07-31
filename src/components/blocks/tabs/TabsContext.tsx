"use client";

import { createContext } from "react";

interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

export const TabsContext =
  createContext<TabsContextType | null>(null);