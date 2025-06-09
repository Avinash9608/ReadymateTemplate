
"use client";

import { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { UserCog, History, LogOut, LayoutDashboard, SettingsIcon, Palette, List, FilePlus, Files, ShoppingBag, Archive } from 'lucide-react'; 
import { useAuth } from '@/contexts/AuthContext';

const profileNavItems = [
  { name: 'Account Details', href: '/profile', icon: UserCog },
  { name: 'Order History', href: '/profile/orders', icon: History },
];

const adminNavItems = [
  { name: 'Navbar Settings', href: '/admin/navbar', icon: List },
  { name: 'Theme Control', href: '/admin/theme', icon: Palette },
  { name: 'Site Settings', href: '/admin/settings', icon: SettingsIcon },
  { name: 'Create New Page', href: '/admin/pages/create', icon: FilePlus },
  { name: 'Manage Pages', href: '/admin/pages/manage', icon: Files },
  { name: 'Create Product', href: '/admin/products/create', icon: ShoppingBag },
  { name: 'Manage Products', href: '/admin/products/manage', icon: Archive },
];


export default function ProfileLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <p>Loading profile...</p>
      </div>
    );
  }
  
  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-1/4 lg:w-1/5">
          <div className="p-4 rounded-lg border bg-card shadow-sm">
            <h2 className="text-xl font-headline font-semibold mb-1">{user.name || user.email}</h2>
            <p className="text-sm text-muted-foreground mb-4">{user.email}</p>
            <Separator />
            <nav className="mt-4 space-y-1">
              {profileNavItems.map((item) => (
                <Link key={item.name} href={item.href} passHref>
                  <Button
                    variant={pathname === item.href ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              ))}
              {user.isAdmin && (
                <>
                  <Separator className="my-2" />
                  <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Admin Panel</p>
                  {adminNavItems.map((item) => (
                     <Link key={item.name} href={item.href} passHref>
                      <Button variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'} className="w-full justify-start">
                        <item.icon className="mr-2 h-4 w-4" /> {item.name}
                      </Button>
                    </Link>
                  ))}
                </>
              )}
              <Separator className="my-2" />
              <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive-foreground hover:bg-destructive" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </nav>
          </div>
        </aside>
        <main className="w-full md:w-3/4 lg:w-4/5">
          {children}
        </main>
      </div>
    </div>
  );
}
