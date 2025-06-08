"use client";

import type { Dispatch, SetStateAction, ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = "dark" | "light" | "system";

export interface CustomColors {
  primary?: string; // HSL string e.g., "183 100% 74%"
  accent?: string;  // HSL string
  background?: string; // HSL string
  foreground?: string; // HSL string
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  customColors: CustomColors;
  setCustomColors: Dispatch<SetStateAction<CustomColors>>;
  effectiveTheme: "light" | "dark";
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  customColors: {},
  setCustomColors: () => null,
  effectiveTheme: "light", // Default, will be updated by useEffect
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: string; // To set class on html element
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean; // Added for compatibility with next-themes like props
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "furnishverse-theme",
  customColorsStorageKey = "furnishverse-custom-colors",
  attribute = "class",
  enableSystem = true,
  ...props
}: ThemeProviderProps & { customColorsStorageKey?: string }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    try {
      return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
    } catch (e) {
      console.error("Error reading theme from localStorage", e);
      return defaultTheme;
    }
  });

  const [customColors, setCustomColors] = useState<CustomColors>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const storedCustomColors = localStorage.getItem(customColorsStorageKey);
      return storedCustomColors ? JSON.parse(storedCustomColors) : {};
    } catch (e) {
      console.error("Error reading custom colors from localStorage", e);
      return {};
    }
  });

  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = window.document.documentElement;
    const currentTheme = theme === "system" && enableSystem
      ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      : theme === "dark" ? "dark" : "light";

    setEffectiveTheme(currentTheme);
    
    root.classList.remove("light", "dark");
    root.classList.add(currentTheme);

    try {
      localStorage.setItem(storageKey, theme);
    } catch (e) {
      console.error("Error saving theme to localStorage", e);
    }
  }, [theme, storageKey, enableSystem]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (customColors.primary) root.style.setProperty('--primary', customColors.primary);
    if (customColors.accent) root.style.setProperty('--accent', customColors.accent);
    if (customColors.background) root.style.setProperty('--background', customColors.background);
    if (customColors.foreground) root.style.setProperty('--foreground', customColors.foreground);
    // Add more custom color properties as needed

    try {
      localStorage.setItem(customColorsStorageKey, JSON.stringify(customColors));
    } catch (e) {
      console.error("Error saving custom colors to localStorage", e);
    }
  }, [customColors, customColorsStorageKey]);


  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      setTheme(newTheme);
    },
    customColors,
    setCustomColors,
    effectiveTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
