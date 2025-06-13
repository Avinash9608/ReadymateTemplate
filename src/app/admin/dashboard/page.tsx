'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  FilePlus, 
  LayoutDashboard, 
  List, 
  Settings, 
  Users, 
  ShoppingCart,
  BarChart3,
  Palette,
  Mail,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  // Handle both old and new user structures for admin check
  const isAdmin = user?.role === 'admin' || (user as any)?.isAdmin === true;

  React.useEffect(() => {
    if (!user) {
      router.push('/auth/login?redirect=/admin/dashboard');
      return;
    }
    
    if (!isAdmin) {
      router.push('/');
      return;
    }
  }, [user, isAdmin, router]);

  if (!user || !isAdmin) {
    return null;
  }

  const adminFeatures = [
    {
      title: 'Product Management',
      description: 'Create, edit, and manage your product catalog',
      icon: Package,
      links: [
        { href: '/admin/products/manage', label: 'Manage Products' },
        { href: '/admin/products/create', label: 'Create Product' }
      ],
      color: 'bg-blue-500'
    },
    {
      title: 'Page Management',
      description: 'Create and manage website pages',
      icon: LayoutDashboard,
      links: [
        { href: '/admin/pages/manage', label: 'Manage Pages' },
        { href: '/admin/pages/create', label: 'Create Page' }
      ],
      color: 'bg-green-500'
    },
    {
      title: 'Order Management',
      description: 'View and manage customer orders',
      icon: ShoppingCart,
      links: [
        { href: '/profile/orders', label: 'All Orders' }
      ],
      color: 'bg-purple-500'
    },
    {
      title: 'Navigation Settings',
      description: 'Configure website navigation and menus',
      icon: List,
      links: [
        { href: '/admin/navbar', label: 'Navbar Settings' }
      ],
      color: 'bg-orange-500'
    },
    {
      title: 'Theme & Design',
      description: 'Customize website appearance and themes',
      icon: Palette,
      links: [
        { href: '/admin/theme', label: 'Theme Settings' }
      ],
      color: 'bg-pink-500'
    },
    {
      title: 'Site Settings',
      description: 'General website configuration and settings',
      icon: Settings,
      links: [
        { href: '/admin/settings', label: 'Site Settings' }
      ],
      color: 'bg-gray-500'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Welcome back, {user.displayName || (user as any).name || user.email}
            </p>
          </div>
          <Badge variant="secondary" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Administrator</span>
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminFeatures.map((feature, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${feature.color} text-white`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {feature.links.map((link, linkIndex) => (
                  <Link key={linkIndex} href={link.href}>
                    <Button variant="outline" className="w-full justify-start">
                      {link.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href="/admin/products/create">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center space-x-3 p-4">
                <FilePlus className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-semibold">Create Product</p>
                  <p className="text-sm text-muted-foreground">Add new product</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/pages/create">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center space-x-3 p-4">
                <LayoutDashboard className="h-8 w-8 text-green-500" />
                <div>
                  <p className="font-semibold">Create Page</p>
                  <p className="text-sm text-muted-foreground">Add new page</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/profile/orders">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center space-x-3 p-4">
                <ShoppingCart className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="font-semibold">View Orders</p>
                  <p className="text-sm text-muted-foreground">Manage orders</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/settings">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center space-x-3 p-4">
                <Settings className="h-8 w-8 text-gray-500" />
                <div>
                  <p className="font-semibold">Site Settings</p>
                  <p className="text-sm text-muted-foreground">Configure site</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* System Info */}
      <div className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-semibold">Admin User:</p>
                <p>{user.email}</p>
              </div>
              <div>
                <p className="font-semibold">Role:</p>
                <p>{user.role || 'admin'}</p>
              </div>
              <div>
                <p className="font-semibold">Last Login:</p>
                <p>{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
