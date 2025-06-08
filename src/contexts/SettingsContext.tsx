
"use client";

import type { Dispatch, SetStateAction, ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

export interface SiteSettings {
  siteName?: string;
  tagline?: string;
  logoLightUrl?: string;
  logoDarkUrl?: string;
}

interface SettingsContextState {
  settings: SiteSettings;
  setSettings: Dispatch<SetStateAction<SiteSettings>>;
  isLoading: boolean;
}

const defaultSettings: SiteSettings = {
  siteName: "FurnishVerse",
  tagline: "Your futuristic furniture destination.",
  logoLightUrl: "", // Default to empty, user can set this
  logoDarkUrl: "",  // Default to empty, user can set this
};

const initialState: SettingsContextState = {
  settings: defaultSettings,
  setSettings: () => null,
  isLoading: true,
};

const SettingsContext = createContext<SettingsContextState>(initialState);

interface SettingsProviderProps {
  children: ReactNode;
  storageKey?: string;
}

export function SettingsProvider({
  children,
  storageKey = "furnishverse-settings",
}: SettingsProviderProps) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    if (typeof window !== 'undefined') {
      try {
        const storedSettings = localStorage.getItem(storageKey);
        if (storedSettings) {
          setSettings(JSON.parse(storedSettings));
        } else {
          // If nothing in storage, use defaults and save them
          localStorage.setItem(storageKey, JSON.stringify(defaultSettings));
          setSettings(defaultSettings);
        }
      } catch (e) {
        console.error("Error reading settings from localStorage", e);
        // Fallback to default if error
        setSettings(defaultSettings);
        if (localStorage.getItem(storageKey)) {
            localStorage.removeItem(storageKey);
        }
      }
    }
    setIsLoading(false);
  }, [storageKey]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading) { // Prevent writing initial empty state before loading
      try {
        localStorage.setItem(storageKey, JSON.stringify(settings));
      } catch (e) {
        console.error("Error saving settings to localStorage", e);
      }
    }
  }, [settings, storageKey, isLoading]);

  const value = {
    settings,
    setSettings,
    isLoading,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
