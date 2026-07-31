// src/components/providers/ThemeProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
const themeStorageKey = "studio-hub-theme";

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
}>({ theme: "light", setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = localStorage.getItem(themeStorageKey) as Theme | null;
    const rendered = document.documentElement.dataset.theme as Theme | undefined;
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    apply(saved === "light" || saved === "dark" ? saved : rendered ?? preferred);

    const syncTheme = (event: StorageEvent) => {
      if (event.key === themeStorageKey && (event.newValue === "light" || event.newValue === "dark")) {
        apply(event.newValue);
      }
    };
    window.addEventListener("storage", syncTheme);
    return () => window.removeEventListener("storage", syncTheme);
  }, []);

  function apply(t: Theme) {
    document.documentElement.dataset.theme = t;
    document.documentElement.style.colorScheme = t;
    localStorage.setItem(themeStorageKey, t);
    setTheme(t);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: apply }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
