"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme, effectiveTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Button variant="ghost" size="icon" disabled className="w-9 h-9 opacity-0" />; 
  }

  const toggleTheme = () => {
    setTheme(effectiveTheme === "dark" ? "light" : "dark");
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
      {effectiveTheme === "dark" ? (
        <Sun className="h-[1.2rem] w-[1.2rem] transition-all hover:text-primary" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] transition-all hover:text-primary" />
      )}
    </Button>
  );
}
