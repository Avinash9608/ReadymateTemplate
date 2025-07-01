"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, UserPlus, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { register: registerUser } = useAuth();

  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    reset,
    watch
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit: SubmitHandler<RegisterFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      const success = await registerUser(data.email, data.password, data.name);
      if (success) {
        setIsSuccess(true);
        toast({
          title: "Registration Successful!",
          description: "Your account has been created successfully.",
          action: <CheckCircle className="text-green-500" />,
        });
        reset();
        router.push('/profile');
      } else {
        toast({
          title: "Registration Failed",
          description: "An error occurred during registration.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Unexpected Error",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const password = watch("password");
  const confirmPassword = watch("confirmPassword");

  if (isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-12rem)] py-12">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <CardTitle className="text-3xl font-headline">Account Created!</CardTitle>
            <CardDescription>
              You can now log in to your account.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button 
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-12rem)] py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <UserPlus className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-3xl font-headline">Create Account</CardTitle>
          <CardDescription>Join our community today</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name (Optional)</Label>
              <Input 
                id="name" 
                {...register("name")} 
                placeholder="Your name" 
                disabled={isSubmitting}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                {...register("email")} 
                placeholder="you@example.com" 
                disabled={isSubmitting}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                {...register("password")} 
                placeholder="••••••••" 
                disabled={isSubmitting}
              />
              <div className="text-xs text-muted-foreground mt-1 space-y-1">
                <p className={password?.length >= 6 ? "text-green-500" : ""}>
                  • At least 6 characters
                </p>
                <p className={/[A-Z]/.test(password || "") ? "text-green-500" : ""}>
                  • At least one uppercase letter
                </p>
                <p className={/[0-9]/.test(password || "") ? "text-green-500" : ""}>
                  • At least one number
                </p>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                {...register("confirmPassword")} 
                placeholder="••••••••" 
                disabled={isSubmitting}
              />
              {confirmPassword && password === confirmPassword && (
                <p className="text-xs text-green-500">Passwords match!</p>
              )}
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
            </div>
            
            <Button 
              type="submit" 
              className="w-full mt-6" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Account
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2 pt-4">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}