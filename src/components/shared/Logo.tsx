"use client";
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import Image from 'next/image';
import type { SiteSettings } from '@/contexts/SettingsContext';

export default function Logo({ settings }: { settings: SiteSettings }) {
  const { effectiveTheme } = useTheme();
  const siteName = settings?.siteName || "FurnishVerse";
  const logoLightUrl = settings?.logoLightUrl;
  const logoDarkUrl = settings?.logoDarkUrl;

  // Determine which logo to use based on the effective theme
  const currentLogoUrl = effectiveTheme === 'dark' ? logoDarkUrl : logoLightUrl;
  const fallbackLogoUrl = effectiveTheme === 'dark' ? logoLightUrl : logoDarkUrl; // Use the other logo if one is missing
  const displayLogoUrl = currentLogoUrl || fallbackLogoUrl;

  return (
    <Link href="/" className="flex items-center space-x-2 group">
      {displayLogoUrl ? (
        <Image 
          src={displayLogoUrl} 
          alt={`${siteName} Logo`} 
          width={40}
          height={40}
          className="h-8 w-auto max-h-8 object-contain group-hover:opacity-80 transition-opacity"
          priority
        />
      ) : (
        <Sparkles className="h-8 w-8 text-primary group-hover:text-accent transition-colors duration-300 transform group-hover:rotate-12" />
      )}
      <span className="text-2xl font-headline font-bold text-foreground group-hover:text-primary transition-colors duration-300">
        {siteName}
      </span>
    </Link>
  );
}
