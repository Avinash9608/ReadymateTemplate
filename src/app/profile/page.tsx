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
import { Loader2, UserCircle2 } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    }
  });

  // Reset form if user data changes (e.g., after initial load)
  useEffect(() => {
    if (user) {
      reset({ name: user.name || '', email: user.email || '' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, reset]);

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
            <Input id="name" {...register("name")} defaultValue={user.name || ''} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" {...register("email")} defaultValue={user.email} />
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
  );
}
