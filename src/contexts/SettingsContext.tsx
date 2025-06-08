
"use client";

import type { Dispatch, SetStateAction, ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

export interface NavItem {
  id: string;
  label: string;
  type: 'internal' | 'external';
  slug?: string; // For internal links
  externalUrl?: string; // For external links
  order: number;
  isVisible: boolean;
}

export interface SiteSettings {
  siteName?: string;
  tagline?: string;
  logoLightUrl?: string;
  logoDarkUrl?: string;
  navItems?: NavItem[];
}

interface SettingsContextState {
  settings: SiteSettings;
  setSettings: Dispatch<SetStateAction<SiteSettings>>;
  isLoading: boolean;
  addNavItem: (item: Omit<NavItem, 'id' | 'order'>) => void;
  updateNavItem: (id: string, updates: Partial<NavItem>) => void;
  removeNavItem: (id: string) => void;
  reorderNavItems: (id: string, direction: 'up' | 'down') => void;
}

const defaultSettings: SiteSettings = {
  siteName: "FurnishVerse",
  tagline: "Your futuristic furniture destination.",
  logoLightUrl: "", 
  logoDarkUrl: "",
  navItems: [ // Default nav items
    { id: 'home', label: 'Home', type: 'internal', slug: '/', order: 1, isVisible: true },
    { id: 'products', label: 'Products', type: 'internal', slug: '/products', order: 2, isVisible: true },
  ],
};

const initialState: SettingsContextState = {
  settings: defaultSettings,
  setSettings: () => null,
  isLoading: true,
  addNavItem: () => null,
  updateNavItem: () => null,
  removeNavItem: () => null,
  reorderNavItems: () => null,
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
  const [settings, setSettingsState] = useState<SiteSettings>(initialState.settings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    if (typeof window !== 'undefined') {
      try {
        const storedSettings = localStorage.getItem(storageKey);
        if (storedSettings) {
          const parsedSettings = JSON.parse(storedSettings);
          // Ensure navItems exist and has default if not present in storage
          if (!parsedSettings.navItems || parsedSettings.navItems.length === 0) {
            parsedSettings.navItems = defaultSettings.navItems;
          }
          setSettingsState(parsedSettings);
        } else {
          localStorage.setItem(storageKey, JSON.stringify(defaultSettings));
          setSettingsState(defaultSettings);
        }
      } catch (e) {
        console.error("Error reading settings from localStorage", e);
        setSettingsState(defaultSettings);
        if (localStorage.getItem(storageKey)) {
            localStorage.removeItem(storageKey);
        }
      }
    }
    setIsLoading(false);
  }, [storageKey]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(settings));
      } catch (e) {
        console.error("Error saving settings to localStorage", e);
      }
    }
  }, [settings, storageKey, isLoading]);

  const setSettings: Dispatch<SetStateAction<SiteSettings>> = (value) => {
    setSettingsState(currentSettings => {
        const newSettings = typeof value === 'function' ? value(currentSettings) : value;
        // Ensure navItems always has a valid array, even if reset
        if (!newSettings.navItems) {
            newSettings.navItems = defaultSettings.navItems || [];
        }
        return newSettings;
    });
  };

  const addNavItem = (item: Omit<NavItem, 'id' | 'order'>) => {
    setSettings(prev => {
      const newNavItems = prev.navItems ? [...prev.navItems] : [];
      const newItem: NavItem = {
        ...item,
        id: Date.now().toString(),
        order: newNavItems.length > 0 ? Math.max(...newNavItems.map(i => i.order)) + 1 : 1,
      };
      return { ...prev, navItems: [...newNavItems, newItem] };
    });
  };

  const updateNavItem = (id: string, updates: Partial<NavItem>) => {
    setSettings(prev => ({
      ...prev,
      navItems: prev.navItems?.map(item => (item.id === id ? { ...item, ...updates } : item)),
    }));
  };

  const removeNavItem = (id: string) => {
    setSettings(prev => ({
      ...prev,
      navItems: prev.navItems?.filter(item => item.id !== id).map((item, index) => ({ ...item, order: index + 1 })),
    }));
  };

  const reorderNavItems = (id: string, direction: 'up' | 'down') => {
    setSettings(prev => {
      const items = prev.navItems ? [...prev.navItems] : [];
      const itemIndex = items.findIndex(item => item.id === id);
      if (itemIndex === -1) return prev;

      const item = items[itemIndex];
      let newOrder = item.order;

      if (direction === 'up' && itemIndex > 0) {
        const prevItem = items[itemIndex - 1];
        newOrder = prevItem.order;
        prevItem.order = item.order;
        item.order = newOrder;
      } else if (direction === 'down' && itemIndex < items.length - 1) {
        const nextItem = items[itemIndex + 1];
        newOrder = nextItem.order;
        nextItem.order = item.order;
        item.order = newOrder;
      }
      
      items.sort((a, b) => a.order - b.order);
      // Normalize order after potential swaps
      const normalizedItems = items.map((it, idx) => ({ ...it, order: idx + 1 }));

      return { ...prev, navItems: normalizedItems };
    });
  };


  const value = {
    settings,
    setSettings,
    isLoading,
    addNavItem,
    updateNavItem,
    removeNavItem,
    reorderNavItems,
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
