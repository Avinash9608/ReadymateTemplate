
"use client";

import type { Dispatch, SetStateAction, ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = "dark" | "light" | "system";

export interface CustomColors {
  primary?: string; // HSL string e.g., "183 100% 74%"
  accent?: string;  // HSL string
  background?: string; // HSL string
  foreground?: string; // HSL string
  // Add other theme color variables here if needed (e.g., card, secondary, muted, destructive)
  card?: string;
  secondary?: string;
  muted?: string;
  destructive?: string;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  customColors: CustomColors;
  setCustomColors: Dispatch<SetStateAction<CustomColors>>;
  effectiveTheme: "light" | "dark";
  isLoading: boolean; // Added isLoading state
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  customColors: {},
  setCustomColors: () => null,
  effectiveTheme: "light", 
  isLoading: true, // Start with loading true
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: string; 
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean; 
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "furnishverse-theme",
  customColorsStorageKey = "furnishverse-custom-colors",
  attribute = "class", // attribute to set on HTML element for theme
  enableSystem = true,
  ...props
}: ThemeProviderProps & { customColorsStorageKey?: string }) {
  const [theme, setThemeInternal] = useState<Theme>(initialState.theme);
  const [customColors, setCustomColorsInternal] = useState<CustomColors>(initialState.customColors);
  const [effectiveTheme, setEffectiveThemeInternal] = useState<"light" | "dark">(initialState.effectiveTheme);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme and custom colors from localStorage on mount
  useEffect(() => {
    let loadedTheme = defaultTheme;
    let loadedCustomColors = {};
    if (typeof window !== 'undefined') {
      try {
        loadedTheme = (localStorage.getItem(storageKey) as Theme) || defaultTheme;
        const storedCustomColors = localStorage.getItem(customColorsStorageKey);
        loadedCustomColors = storedCustomColors ? JSON.parse(storedCustomColors) : {};
      } catch (e) {
        console.error("Error reading from localStorage", e);
        // Clear potentially corrupted storage items
        localStorage.removeItem(storageKey);
        localStorage.removeItem(customColorsStorageKey);
      }
    }
    setThemeInternal(loadedTheme);
    setCustomColorsInternal(loadedCustomColors);
    setIsLoading(false); // Set loading to false after initial load
  }, [defaultTheme, storageKey, customColorsStorageKey]);


  // Apply theme (light/dark class) and save to localStorage
  useEffect(() => {
    if (isLoading) return; // Don't run if still loading initial state

    const root = window.document.documentElement;
    const currentSystemTheme = enableSystem ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : "light";
    const newEffectiveTheme = theme === "system" ? currentSystemTheme : theme;

    setEffectiveThemeInternal(newEffectiveTheme);
    
    root.classList.remove("light", "dark");
    root.classList.add(newEffectiveTheme);

    if (attribute === 'class') {
      root.classList.remove("light", "dark");
      root.classList.add(newEffectiveTheme);
    } else {
      root.setAttribute(attribute, newEffectiveTheme);
    }


    try {
      localStorage.setItem(storageKey, theme);
    } catch (e) {
      console.error("Error saving theme to localStorage", e);
    }
  }, [theme, storageKey, enableSystem, isLoading, attribute]);

  // Apply custom colors to CSS variables and save to localStorage
  useEffect(() => {
    if (isLoading) return; // Don't run if still loading initial state

    const root = window.document.documentElement;
    
    // Clear previously set custom styles before applying new ones or defaults
    // This is important when resetting to default theme values from globals.css
    const colorProperties: (keyof CustomColors)[] = ['primary', 'accent', 'background', 'foreground', 'card', 'secondary', 'muted', 'destructive'];
    colorProperties.forEach(prop => {
      root.style.removeProperty(`--${prop}`);
    });

    Object.entries(customColors).forEach(([key, value]) => {
      if (value) { // Only set if value is defined
        root.style.setProperty(`--${key}`, value);
      }
    });

    try {
      localStorage.setItem(customColorsStorageKey, JSON.stringify(customColors));
    } catch (e) {
      console.error("Error saving custom colors to localStorage", e);
    }
  }, [customColors, customColorsStorageKey, isLoading]);


  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      if(!isLoading) setThemeInternal(newTheme);
    },
    customColors,
    setCustomColors: (colorsOrCallback: SetStateAction<CustomColors>) => {
       if(!isLoading) setCustomColorsInternal(colorsOrCallback);
    },
    effectiveTheme,
    isLoading,
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
