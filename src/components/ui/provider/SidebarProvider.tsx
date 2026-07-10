"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type SidebarContextType = {
  collapsed: boolean;
  toggleSidebar: () => void;

  playgroundOpen: boolean;
  togglePlayground: () => void;

  modelsOpen: boolean;
  toggleModels: () => void;

  docsOpen: boolean;
  toggleDocs: () => void;

  settingsOpen: boolean;
  toggleSettings: () => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  const [playgroundOpen, setPlaygroundOpen] = useState(false);
  const [modelsOpen, setModelsOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const toggleSidebar = () => setCollapsed((p) => !p);

  const togglePlayground = () => setPlaygroundOpen((p) => !p);
  const toggleModels = () => setModelsOpen((p) => !p);
  const toggleDocs = () => setDocsOpen((p) => !p);
  const toggleSettings = () => setSettingsOpen((p) => !p);

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        toggleSidebar,

        playgroundOpen,
        togglePlayground,

        modelsOpen,
        toggleModels,

        docsOpen,
        toggleDocs,

        settingsOpen,
        toggleSettings,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }

  return context;
}
