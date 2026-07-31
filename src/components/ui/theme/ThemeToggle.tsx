// src/components/ui/ThemeToggle/ThemeToggle.tsx
"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { Button } from "@/components/ui/buttons/Buttons";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-xl text-fg-muted hover:text-fg"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Use light theme" : "Use dark theme"}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
