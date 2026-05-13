"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";

type ThemeToggleProps = {
  variant?: "icon" | "full";
  className?: string;
};

export function ThemeToggle({ variant = "icon", className }: ThemeToggleProps) {
  const theme = useUIStore((state) => state.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);

  const handleToggle = useCallback(() => {
    toggleTheme();
  }, [toggleTheme]);

  if (variant === "full") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        className={className}
      >
        {theme === "dark" ? (
          <>
            <Sun className="mr-2 h-4 w-4" />
            Light Mode
          </>
        ) : (
          <>
            <Moon className="mr-2 h-4 w-4" />
            Dark Mode
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className={className}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:rotate-0" />
      ) : (
        <Moon className="h-4 w-4 rotate-0 scale-100 transition-all dark:rotate-0" />
      )}
    </Button>
  );
}