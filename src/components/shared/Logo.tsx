
"use client";
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import Image from 'next/image';

export default function Logo() {
  const { settings, isLoading: settingsLoading } = useSettings();
  const { effectiveTheme, theme } = useTheme(); // Get effectiveTheme

  const siteName = settings?.siteName || "FurnishVerse";
  const logoLightUrl = settings?.logoLightUrl;
  const logoDarkUrl = settings?.logoDarkUrl;

  // Determine which logo to use based on the effective theme
  const currentLogoUrl = effectiveTheme === 'dark' ? logoDarkUrl : logoLightUrl;
  const fallbackLogoUrl = effectiveTheme === 'dark' ? logoLightUrl : logoDarkUrl; // Use the other logo if one is missing
  const displayLogoUrl = currentLogoUrl || fallbackLogoUrl;


  if (settingsLoading) {
    // You might want a more sophisticated skeleton loader here
    return (
      <div className="flex items-center space-x-2 group">
        <Sparkles className="h-8 w-8 text-primary animate-pulse" />
        <span className="text-2xl font-headline font-bold text-foreground animate-pulse">
          Loading...
        </span>
      </div>
    );
  }
  
  return (
    <Link href="/" className="flex items-center space-x-2 group">
      {displayLogoUrl ? (
        <Image 
          src={displayLogoUrl} 
          alt={`${siteName} Logo`} 
          width={40} // Adjust as needed
          height={40} // Adjust as needed
          className="h-8 w-auto max-h-8 object-contain group-hover:opacity-80 transition-opacity"
          priority // Good for LCP
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
