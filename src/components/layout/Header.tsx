"use client";

import Link from 'next/link';
import Logo from '@/components/shared/Logo';
import ThemeToggle from '@/components/shared/ThemeToggle';
import { Button } from '@/components/ui/button';
import { ShoppingCart, User, LogIn, LogOut, PackageSearch, Settings, List, FilePlus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import type { SiteSettings } from '@/contexts/SettingsContext';

const NavLinkInternal = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} passHref>
    <Button variant="ghost" className="font-medium text-foreground hover:text-primary transition-colors">
      {children}
    </Button>
  </Link>
);

const NavLinkExternal = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer">
    <Button variant="ghost" className="font-medium text-foreground hover:text-primary transition-colors">
      {children}
    </Button>
  </a>
);

export default function Header({ settings }: { settings: SiteSettings }) {
  const { cartItemCount } = useCart();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const metaSiteName = "FurnishVerse";
  const metaTagline = "Your futuristic furniture destination.";
  const siteName = settings.siteName && settings.siteName.trim() !== '' ? settings.siteName : metaSiteName;
  const tagline = settings.tagline && settings.tagline.trim() !== '' ? settings.tagline : metaTagline;

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    router.push('/auth');
  };

  const visibleNavItems = settings.navItems
    ?.filter(item => item.isVisible)
    .sort((a, b) => a.order - b.order) || [];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 max-w-screen-2xl items-center justify-between">
        <div className="flex flex-col justify-center">
          <Logo settings={settings} />
          <span className="text-xs text-muted-foreground leading-tight hidden sm:block">{tagline}</span>
        </div>
        <nav className="hidden md:flex items-center space-x-2 lg:space-x-4">
          {visibleNavItems.map(item => 
            item.type === 'internal' && item.slug ? (
              <NavLinkInternal key={item.id} href={item.slug}>
                {item.label}
              </NavLinkInternal>
            ) : item.type === 'external' && item.externalUrl ? (
              <NavLinkExternal key={item.id} href={item.externalUrl}>
                {item.label}
              </NavLinkExternal>
            ) : null
          )}
        </nav>
        <div className="flex items-center space-x-1 sm:space-x-2">
          <ThemeToggle />
          <Link href="/cart" passHref>
            <Button variant="ghost" size="icon" aria-label="Shopping Cart">
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs">
                  {cartItemCount}
                </span>
              )}
            </Button>
          </Link>
          {!user ? (
            <Link href="/auth">
              <Button variant="outline">Login</Button>
            </Link>
          ) : (
            <div className="relative">
              <Button variant="ghost" onClick={() => setDropdownOpen((v) => !v)}>
                {user.name}
              </Button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow-lg z-50">
                  <Button variant="outline" className="w-full" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
