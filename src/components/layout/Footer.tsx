"use client";
import Link from 'next/link';
import type { SiteSettings } from '@/contexts/SettingsContext';

export default function Footer({ settings }: { settings: SiteSettings }) {
  const metaSiteName = "FurnishVerse";
  const metaTagline = "Your futuristic furniture destination.";
  const siteName = settings.siteName && settings.siteName.trim() !== '' ? settings.siteName : metaSiteName;
  const tagline = settings.tagline && settings.tagline.trim() !== '' ? settings.tagline : metaTagline;

  return (
    <footer className="border-t border-border/40 bg-background/95">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-headline font-semibold mb-3 text-primary">{siteName}</h3>
            <p className="text-sm text-muted-foreground">{tagline}</p>
          </div>
          <div>
            <h4 className="text-md font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-muted-foreground hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/products" className="text-muted-foreground hover:text-primary transition-colors">Products</Link></li>
              <li><Link href="/cart" className="text-muted-foreground hover:text-primary transition-colors">Cart</Link></li>
              <li><Link href="/profile" className="text-muted-foreground hover:text-primary transition-colors">My Account</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-md font-semibold mb-3">Connect</h4>
            <p className="text-sm text-muted-foreground">
              Follow us on social media for updates and inspirations. (Links to be added)
            </p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {siteName}. All rights reserved. Designed with a futuristic touch.
        </div>
      </div>
    </footer>
  );
}
