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
  addNavItem: (itemData: Omit<NavItem, 'id' | 'order'>) => void;
  updateNavItem: (id: string, updates: Partial<NavItem>) => void;
  removeNavItem: (id: string) => void;
  reorderNavItems: (id: string, direction: 'up' | 'down') => void;
  addPage: (pageData: Omit<PageConfig, 'id' | 'createdAt' | 'updatedAt'>) => PageConfig | undefined;
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
  addPage: () => undefined,
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
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          setSettingsState((prev) => ({
            ...prev,
            siteName: data.settings.siteName || defaultSettings.siteName,
            tagline: data.settings.tagline || defaultSettings.tagline,
            logoLightUrl: data.settings.logoLight || defaultSettings.logoLightUrl,
            logoDarkUrl: data.settings.logoDark || defaultSettings.logoDarkUrl,
          }));
        } else {
          setSettingsState(defaultSettings);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setSettingsState(defaultSettings);
        setIsLoading(false);
      });
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

  const addNavItem = (itemData: Omit<NavItem, 'id' | 'order'>) => {
    setSettingsState(prev => {
      const currentNavItems = prev.navItems || [];
      const newNavItem: NavItem = {
        ...itemData,
        id: `nav-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // More unique ID
        order: currentNavItems.length > 0 ? Math.max(0, ...currentNavItems.map(i => i.order)) + 1 : 1,
      };
      return { ...prev, navItems: [...currentNavItems, newNavItem] };
    });
  };

  const updateNavItem = (id: string, updates: Partial<NavItem>) => {
    setSettingsState(prev => ({
      ...prev,
      navItems: (prev.navItems || []).map(item => (item.id === id ? { ...item, ...updates } : item)),
    }));
  };

  const removeNavItem = (id: string) => {
    setSettingsState(prev => {
      const updatedNavItems = (prev.navItems || []).filter(item => item.id !== id)
                                                 .map((item, index) => ({ ...item, order: index + 1 }));
      return { ...prev, navItems: updatedNavItems };
    });
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

  const addPage = (pageData: Omit<PageConfig, 'id' | 'createdAt' | 'updatedAt'>): PageConfig | undefined => {
    console.log('addPage called with slug:', pageData.slug);
    console.log('Current pages:', settings.pages);

    // Defensive: check for duplicate slug
    const existing = settings.pages?.find(p => p.slug === pageData.slug);
    if (existing) {
      console.log('Duplicate slug found:', pageData.slug);
      return undefined;
    }

    const newPageId = `page-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newPage: PageConfig = {
      ...pageData,
      id: newPageId,
      createdAt: now,
      updatedAt: now,
      suggestedLayout: (pageData.suggestedLayout || []).map((comp, index) => ({
        ...comp,
        id: comp.id || `comp-${newPageId}-${index}-${Math.random().toString(36).substring(2, 7)}`,
        props: comp.props || { placeholderContent: `Default content for ${comp.type}` }
      }))
    };
    setSettingsState(prev => ({
      ...prev,
      pages: [...(prev.pages || []), newPage],
    }));
    console.log('Page created:', newPage);
    return newPage;
  };

  const updatePage = (pageId: string, updates: Partial<Omit<PageConfig, 'id' | 'createdAt' | 'updatedAt'>>) => {
    setSettingsState(prev => {
      const newPagesArray = (prev.pages || []).map(page => {
        if (page.id === pageId) {
          const newPageData = {
            ...page,
            ...updates, 
            updatedAt: new Date().toISOString(),
          };
  
          newPageData.suggestedLayout = (newPageData.suggestedLayout || []).map((comp, index) => ({
            ...comp,
            id: comp.id || `comp-${pageId}-${index}-${Math.random().toString(36).substring(2, 7)}`,
            props: comp.props || { placeholderContent: `Content for ${comp.type}` }
          }));
          
          return newPageData;
        }
        return page;
      });
      return { ...prev, pages: newPagesArray };
    });
  };
  
  const deletePage = (pageId: string) => {
    setSettingsState(prev => {
      const pagesBeforeDelete = prev.pages || [];
      const pageToDeleteDetails = pagesBeforeDelete.find(p => p.id === pageId);

      if (!pageToDeleteDetails) {
        return prev; // Page not found, nothing to change
      }

      const updatedPages = pagesBeforeDelete.filter(page => page.id !== pageId);
      
      let updatedNavItems = prev.navItems || [];
      const deletedPageNavSlug = `/pages/${pageToDeleteDetails.slug}`;
      
      updatedNavItems = updatedNavItems.filter(item => {
        return !(item.type === 'internal' && item.slug === deletedPageNavSlug);
      });
      updatedNavItems = updatedNavItems.map((item, index) => ({ ...item, order: index + 1 }));

      return {
        ...prev,
        pages: updatedPages,
        navItems: updatedNavItems,
      };
    });
  };

  const getPageBySlug = (slug: string): PageConfig | undefined => {
    if (isLoading) return undefined; // Don't return pages if still loading, might be stale
    return settings.pages?.find(page => page.slug === slug);
  };

  const getPageById = (id: string): PageConfig | undefined => {
    if (isLoading) return undefined;
    return settings.pages?.find(page => page.id === id);
  };
  
  const getAllPages = (): PageConfig[] => {
    if (isLoading) return [];
    return settings.pages || [];
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
