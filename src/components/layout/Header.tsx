
"use client";

import Link from 'next/link';
import Logo from '@/components/shared/Logo';
import ThemeToggle from '@/components/shared/ThemeToggle';
import { Button } from '@/components/ui/button';
import { ShoppingCart, User, LogIn, LogOut, PackageSearch, Settings } from 'lucide-react'; // Added Settings icon
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} passHref>
    <Button variant="ghost" className="font-medium text-foreground hover:text-primary transition-colors">
      {children}
    </Button>
  </Link>
);

export default function Header() {
  const { cartItemCount } = useCart();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 max-w-screen-2xl items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center space-x-2 lg:space-x-4">
          <NavLink href="/">Home</NavLink>
          <NavLink href="/products">Products</NavLink>
          {/* <NavLink href="/about">About</NavLink> */}
          {/* <NavLink href="/contact">Contact</NavLink> */}
        </nav>
        <div className="flex items-center space-x-2 sm:space-x-3">
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
          {user ? (
            <>
              <Link href="/profile" passHref>
                <Button variant="ghost" size="icon" aria-label="User Profile">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Logout">
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Link href="/login" passHref>
              <Button variant="ghost" aria-label="Login">
                <LogIn className="h-5 w-5 mr-2" /> Login
              </Button>
            </Link>
          )}
           {user?.isAdmin && (
            <>
              <Link href="/admin/theme" passHref>
                <Button variant="outline" size="sm" aria-label="Admin Theme Settings">
                  <PackageSearch className="h-4 w-4 mr-1" /> Theme
                </Button>
              </Link>
               <Link href="/admin/settings" passHref>
                <Button variant="outline" size="sm" aria-label="Admin Site Settings">
                  <Settings className="h-4 w-4 mr-1" /> Site
                </Button>
              </Link>
            </>
           )}
        </div>
      </div>
    </header>
  );
}
