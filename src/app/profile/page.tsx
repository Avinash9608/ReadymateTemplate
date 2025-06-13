"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Loader2, UserCircle2, Shield, Package, LayoutDashboard, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth(); // Consider exposing an updateProfile function from AuthContext
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  // Handle both old and new user structures
  const isAdmin = user?.role === 'admin' || (user as any)?.isAdmin === true;
  const userName = user?.displayName || (user as any)?.name || user?.email?.split('@')[0] || '';
  const userEmail = user?.email || '';

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: userName,
      email: userEmail,
    }
  });

  // Reset form if user data changes (e.g., after initial load)
  useEffect(() => {
    if (user) {
      reset({ name: userName, email: userEmail });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, reset, userName, userEmail]);

  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    setIsUpdating(true);
    // Simulate update call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("Profile updated (mock):", data);
    // In a real app, you'd call an API and update AuthContext user state
    // For this mock, we'll just show a toast
    toast({
      title: "Profile Updated",
      description: "Your profile information has been (mock) updated.",
    });
    setIsUpdating(false);
  };
  
  if (authLoading) {
    return <div className="text-center py-10">Loading profile data...</div>;
  }

  if (!user) {
    // This case should ideally be handled by the layout, but as a fallback:
    return <div className="text-center py-10">Please log in to view your profile.</div>;
  }


  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Admin Dashboard Link */}
      {isAdmin && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-xl">Administrator Access</CardTitle>
                  <CardDescription>Manage your website and business operations</CardDescription>
                </div>
              </div>
              <Link href="/admin/dashboard">
                <Button>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Admin Dashboard
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/admin/products/manage">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="flex items-center space-x-3 p-4">
                    <Package className="h-6 w-6 text-blue-500" />
                    <div>
                      <p className="font-semibold">Products</p>
                      <p className="text-sm text-muted-foreground">Manage catalog</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/profile/orders">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="flex items-center space-x-3 p-4">
                    <ShoppingCart className="h-6 w-6 text-purple-500" />
                    <div>
                      <p className="font-semibold">Orders</p>
                      <p className="text-sm text-muted-foreground">Manage orders</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/pages/manage">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="flex items-center space-x-3 p-4">
                    <LayoutDashboard className="h-6 w-6 text-green-500" />
                    <div>
                      <p className="font-semibold">Pages</p>
                      <p className="text-sm text-muted-foreground">Manage content</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Profile Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-3 mb-2">
              <UserCircle2 className="h-10 w-10 text-primary" />
              <div>
                  <CardTitle className="text-2xl font-headline">Account Details</CardTitle>
                  <CardDescription>Manage your personal information.</CardDescription>
              </div>
          </div>
        </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" {...register("name")} defaultValue={userName} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" {...register("email")} defaultValue={userEmail} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          {/* Add fields for changing password if needed */}
          <Button type="submit" disabled={isUpdating}>
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUpdating ? "Updating..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
            Changes to your email address might require re-verification in a real application.
        </p>
      </CardFooter>
    </Card>

    {/* Quick Links for Regular Users */}
    {!isAdmin && (
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>Access your account features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/profile/orders">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center space-x-3 p-4">
                  <ShoppingCart className="h-6 w-6 text-purple-500" />
                  <div>
                    <p className="font-semibold">My Orders</p>
                    <p className="text-sm text-muted-foreground">View order history</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/products">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center space-x-3 p-4">
                  <Package className="h-6 w-6 text-blue-500" />
                  <div>
                    <p className="font-semibold">Shop Products</p>
                    <p className="text-sm text-muted-foreground">Browse catalog</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>
    )}
    </div>
  );
}
