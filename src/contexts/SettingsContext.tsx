
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

export interface PageComponent {
  id: string; // Unique ID for this component instance on the page
  type: string; // e.g., "Hero", "TextContent", "Map"
  props?: Record<string, any>; // Component-specific properties
}

export interface PageConfig {
  id: string;
  title: string;
  slug: string;
  pageType: 'Standard' | 'Form' | 'Landing' | string; // Allow string for flexibility
  layoutPrompt?: string;
  suggestedLayout?: PageComponent[]; // Array of component types and their props
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
}

export interface SiteSettings {
  siteName?: string;
  tagline?: string;
  logoLightUrl?: string;
  logoDarkUrl?: string;
  navItems?: NavItem[];
  pages?: PageConfig[]; // Added for custom pages
}

interface SettingsContextState {
  settings: SiteSettings;
  setSettings: Dispatch<SetStateAction<SiteSettings>>;
  isLoading: boolean;
  addNavItem: (item: Omit<NavItem, 'id' | 'order'>) => void;
  updateNavItem: (id: string, updates: Partial<NavItem>) => void;
  removeNavItem: (id: string) => void;
  reorderNavItems: (id: string, direction: 'up' | 'down') => void;
  addPage: (pageData: Omit<PageConfig, 'id' | 'createdAt' | 'updatedAt'>) => string; // Returns new page ID
  updatePage: (slug: string, updates: Partial<PageConfig>) => void;
  getPageBySlug: (slug: string) => PageConfig | undefined;
  getAllPages: () => PageConfig[];
  deletePage: (slug: string) => void;
}

const defaultSettings: SiteSettings = {
  siteName: "FurnishVerse",
  tagline: "Your futuristic furniture destination.",
  logoLightUrl: "", 
  logoDarkUrl: "",
  navItems: [
    { id: 'home', label: 'Home', type: 'internal', slug: '/', order: 1, isVisible: true },
    { id: 'products', label: 'Products', type: 'internal', slug: '/products', order: 2, isVisible: true },
  ],
  pages: [], // Initialize with empty pages array
};

const initialState: SettingsContextState = {
  settings: defaultSettings,
  setSettings: () => null,
  isLoading: true,
  addNavItem: () => null,
  updateNavItem: () => null,
  removeNavItem: () => null,
  reorderNavItems: () => null,
  addPage: () => '',
  updatePage: () => null,
  getPageBySlug: () => undefined,
  getAllPages: () => [],
  deletePage: () => null,
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
          if (!parsedSettings.navItems || parsedSettings.navItems.length === 0) {
            parsedSettings.navItems = defaultSettings.navItems;
          }
          if (!parsedSettings.pages) { // Ensure pages array exists
            parsedSettings.pages = [];
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

  const setSettingsDispatch: Dispatch<SetStateAction<SiteSettings>> = (value) => {
    setSettingsState(currentSettings => {
        const newSettings = typeof value === 'function' ? value(currentSettings) : value;
        if (!newSettings.navItems) {
            newSettings.navItems = defaultSettings.navItems || [];
        }
        if (!newSettings.pages) { // Ensure pages array exists on update
            newSettings.pages = [];
        }
        return newSettings;
    });
  };

  const addNavItem = (item: Omit<NavItem, 'id' | 'order'>) => {
    setSettingsState(prev => {
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
    setSettingsState(prev => ({
      ...prev,
      navItems: prev.navItems?.map(item => (item.id === id ? { ...item, ...updates } : item)),
    }));
  };

  const removeNavItem = (id: string) => {
    setSettingsState(prev => ({
      ...prev,
      navItems: prev.navItems?.filter(item => item.id !== id).map((item, index) => ({ ...item, order: index + 1 })),
    }));
  };

  const reorderNavItems = (id: string, direction: 'up' | 'down') => {
    setSettingsState(prev => {
      const items = prev.navItems ? [...prev.navItems] : [];
      const itemIndex = items.findIndex(item => item.id === id);
      if (itemIndex === -1) return prev;

      const item = items[itemIndex];
      
      if (direction === 'up' && itemIndex > 0) {
        const prevItem = items[itemIndex - 1];
        [items[itemIndex], items[itemIndex - 1]] = [items[itemIndex - 1], items[itemIndex]];
      } else if (direction === 'down' && itemIndex < items.length - 1) {
        const nextItem = items[itemIndex + 1];
         [items[itemIndex], items[itemIndex + 1]] = [items[itemIndex + 1], items[itemIndex]];
      }
      
      const normalizedItems = items.map((it, idx) => ({ ...it, order: idx + 1 }));
      return { ...prev, navItems: normalizedItems };
    });
  };

  // Page management functions
  const addPage = (pageData: Omit<PageConfig, 'id' | 'createdAt' | 'updatedAt'>): string => {
    const newPageId = Date.now().toString();
    const now = new Date().toISOString();
    const newPage: PageConfig = {
      ...pageData,
      id: newPageId,
      createdAt: now,
      updatedAt: now,
    };
    setSettingsState(prev => ({
      ...prev,
      pages: [...(prev.pages || []), newPage],
    }));
    return newPageId;
  };

  const updatePage = (slug: string, updates: Partial<PageConfig>) => {
    setSettingsState(prev => ({
      ...prev,
      pages: prev.pages?.map(page =>
        page.slug === slug ? { ...page, ...updates, updatedAt: new Date().toISOString() } : page
      ),
    }));
  };

  const getPageBySlug = (slug: string): PageConfig | undefined => {
    return settings.pages?.find(page => page.slug === slug);
  };
  
  const getAllPages = (): PageConfig[] => {
    return settings.pages || [];
  };

  const deletePage = (slug: string) => {
    setSettingsState(prev => ({
      ...prev,
      pages: prev.pages?.filter(page => page.slug !== slug),
    }));
  };

  const value = {
    settings,
    setSettings: setSettingsDispatch,
    isLoading,
    addNavItem,
    updateNavItem,
    removeNavItem,
    reorderNavItems,
    addPage,
    updatePage,
    getPageBySlug,
    getAllPages,
    deletePage,
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
