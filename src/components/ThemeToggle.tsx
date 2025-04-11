"use client";

import { Button } from "@/components/ui/button";
import { useDarkMode } from "@/hooks/useDarkMode";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { isDark, toggleDark } = useDarkMode();

  return (
    <Button variant="outline" size="icon" onClick={toggleDark}>
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
