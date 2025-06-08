"use client";
import Link from 'next/link';
import { Sparkles } from 'lucide-react'; // Using an abstract icon

export default function Logo({ siteName = "FurnishVerse" }: { siteName?: string }) {
  return (
    <Link href="/" className="flex items-center space-x-2 group">
      <Sparkles className="h-8 w-8 text-primary group-hover:text-accent transition-colors duration-300 transform group-hover:rotate-12" />
      <span className="text-2xl font-headline font-bold text-foreground group-hover:text-primary transition-colors duration-300">
        {siteName}
      </span>
    </Link>
  );
}
