"use client";

import { List, Palette, Settings as SettingsIcon, FilePlus, Files, ShoppingBag, Archive } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const adminNavItems = [
  { name: 'Navbar Settings', href: '/admin/navbar', icon: List },
  { name: 'Theme Control', href: '/admin/theme', icon: Palette },
  { name: 'Site Settings', href: '/admin/settings', icon: SettingsIcon },
  { name: 'Create New Page', href: '/admin/pages/create', icon: FilePlus },
  { name: 'Manage Pages', href: '/admin/pages/manage', icon: Files },
  { name: 'Create Product', href: '/admin/products/create', icon: ShoppingBag },
  { name: 'Manage Products', href: '/admin/products/manage', icon: Archive },
];

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  console.log('AdminDashboard user:', user);
  if (isLoading) {
    return <div className="text-center py-10">Loading...</div>;
  }
  return (
    <div className="container mx-auto py-10">
      <Card className="mb-8 shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Welcome, {user?.name || user?.email || 'Admin'}!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground text-lg mb-4">
            This is your admin dashboard. Use the links below to manage all aspects of your website.
          </p>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminNavItems.map(({ name, href, icon: Icon }) => (
          <Link key={href} href={href} className="group">
            <Card className="hover:shadow-2xl transition-shadow duration-300 h-full">
              <CardHeader className="flex flex-col items-center justify-center py-8">
                <Icon className="h-10 w-10 text-primary group-hover:scale-110 transition-transform duration-200 mb-2" />
                <CardTitle className="text-xl text-center font-semibold">{name}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
} 