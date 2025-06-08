
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
  props: Record<string, any>; // Component-specific properties
}

export interface PageConfig {
  id: string; // Unique ID for the page itself
  title: string;
  slug: string;
  pageType: 'Standard' | 'Form' | 'Landing' | string; // Allow string for flexibility
  layoutPrompt?: string;
  suggestedLayout: PageComponent[]; // Array of component types and their props
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
  pages?: PageConfig[];
}

interface SettingsContextState {
  settings: SiteSettings;
  setSettings: Dispatch<SetStateAction<SiteSettings>>;
  isLoading: boolean;
  addNavItem: (item: Omit<NavItem, 'id' | 'order'>) => void;
  updateNavItem: (id: string, updates: Partial<NavItem>) => void;
  removeNavItem: (id: string) => void;
  reorderNavItems: (id: string, direction: 'up' | 'down') => void;
  addPage: (pageData: Omit<PageConfig, 'id' | 'createdAt' | 'updatedAt'>) => PageConfig; // Returns new page
  updatePage: (pageId: string, updates: Partial<Omit<PageConfig, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  getPageBySlug: (slug: string) => PageConfig | undefined;
  getPageById: (id: string) => PageConfig | undefined;
  getAllPages: () => PageConfig[];
  deletePage: (pageId: string) => void;
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
  pages: [],
};

const initialState: SettingsContextState = {
  settings: defaultSettings,
  setSettings: () => null,
  isLoading: true,
  addNavItem: () => null,
  updateNavItem: () => null,
  removeNavItem: () => null,
  reorderNavItems: () => null,
  addPage: () => ({} as PageConfig),
  updatePage: () => null,
  getPageBySlug: () => undefined,
  getPageById: () => undefined,
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
          if (!parsedSettings.pages) {
            parsedSettings.pages = [];
          } else {
            // Ensure all pages have a suggestedLayout array and props object for each component
            parsedSettings.pages = parsedSettings.pages.map((page: PageConfig) => ({
              ...page,
              suggestedLayout: (page.suggestedLayout || []).map((component: PageComponent) => ({
                ...component,
                props: component.props || { placeholderContent: `Content for ${component.type}` },
              })),
            }));
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
        if (!newSettings.pages) {
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

      if (direction === 'up' && itemIndex > 0) {
        [items[itemIndex], items[itemIndex - 1]] = [items[itemIndex - 1], items[itemIndex]];
      } else if (direction === 'down' && itemIndex < items.length - 1) {
         [items[itemIndex], items[itemIndex + 1]] = [items[itemIndex + 1], items[itemIndex]];
      }
      
      const normalizedItems = items.map((it, idx) => ({ ...it, order: idx + 1 }));
      return { ...prev, navItems: normalizedItems };
    });
  };

  const addPage = (pageData: Omit<PageConfig, 'id' | 'createdAt' | 'updatedAt'>): PageConfig => {
    const newPageId = Date.now().toString();
    const now = new Date().toISOString();
    const newPage: PageConfig = {
      ...pageData,
      id: newPageId,
      createdAt: now,
      updatedAt: now,
      suggestedLayout: (pageData.suggestedLayout || []).map(comp => ({
        ...comp,
        props: comp.props || { placeholderContent: `Default content for ${comp.type}` }
      }))
    };
    setSettingsState(prev => ({
      ...prev,
      pages: [...(prev.pages || []), newPage],
    }));
    return newPage;
  };

  const updatePage = (pageId: string, updates: Partial<Omit<PageConfig, 'id' | 'createdAt' | 'updatedAt'>>) => {
    setSettingsState(prev => {
        const newPagesArray = prev.pages?.map(page => {
            if (page.id === pageId) {
                // Determine the new suggestedLayout
                // If updates.suggestedLayout is provided, use it; otherwise, use the current page's layout.
                const baseLayout = updates.suggestedLayout !== undefined 
                    ? updates.suggestedLayout 
                    : page.suggestedLayout;

                // Ensure all components in the final layout have their props initialized.
                const finalSuggestedLayout = baseLayout.map(comp => ({
                    ...comp,
                    props: comp.props || { placeholderContent: `Content for ${comp.type}` }
                }));

                // Construct the updated page object
                return {
                    ...page, // Start with the original page data
                    // Apply specific updates, excluding suggestedLayout which is handled separately
                    title: updates.title !== undefined ? updates.title : page.title,
                    slug: updates.slug !== undefined ? updates.slug : page.slug,
                    pageType: updates.pageType !== undefined ? updates.pageType : page.pageType,
                    layoutPrompt: updates.layoutPrompt !== undefined ? updates.layoutPrompt : page.layoutPrompt,
                    isPublished: updates.isPublished !== undefined ? updates.isPublished : page.isPublished,
                    // Now, assign the processed finalSuggestedLayout
                    suggestedLayout: finalSuggestedLayout,
                    updatedAt: new Date().toISOString(),
                };
            }
            return page; // Return other pages unmodified
        });
        return { ...prev, pages: newPagesArray };
    });
};


  const getPageBySlug = (slug: string): PageConfig | undefined => {
    return settings.pages?.find(page => page.slug === slug);
  };

  const getPageById = (id: string): PageConfig | undefined => {
    return settings.pages?.find(page => page.id === id);
  };
  
  const getAllPages = (): PageConfig[] => {
    return settings.pages || [];
  };

  const deletePage = (pageId: string) => {
    setSettingsState(prev => ({
      ...prev,
      pages: prev.pages?.filter(page => page.id !== pageId),
      navItems: prev.navItems?.filter(item => !item.slug || !prev.pages?.find(p => p.id === pageId && `/pages/${p.slug}` === item.slug))
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
    getPageById,
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

    