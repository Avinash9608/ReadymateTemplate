
// "use client";

// import { useState } from 'react';
// import { useForm, type SubmitHandler } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import * as z from 'zod';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
// import { useAuth } from '@/contexts/AuthContext';
// import { useToast } from '@/hooks/use-toast';
// import { useRouter } from 'next/navigation';
// import Link from 'next/link';
// import { Loader2, LogInIcon } from 'lucide-react';

// const loginSchema = z.object({
//   email: z.string().email("Invalid email address"),
//   password: z.string().min(5, "Password must be at least 5 characters"),
// });

// type LoginFormValues = z.infer<typeof loginSchema>;

// export default function LoginPage() {
//   const { login } = useAuth();
//   const { toast } = useToast();
//   const router = useRouter();
//   const [isLoading, setIsLoading] = useState(false);

//   const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
//     resolver: zodResolver(loginSchema),
//   });

//   const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
//     setIsLoading(true);
//     const loggedInUser = await login(data.email, data.password);
//     setIsLoading(false);

//     if (loggedInUser) {
//       toast({
//         title: "Login Successful",
//         description: "Welcome back to FurnishVerse!",
//       });
//       // Check for specific admin credentials and admin status for redirect
//       if (loggedInUser.isAdmin && data.email === 'admin@gmail.com' && data.password === 'admin') {
//         router.push('/admin/theme');
//       } else {
//         router.push('/profile');
//       }
//     } else {
//       toast({
//         title: "Login Failed",
//         description: "Invalid email or password. Please try again.",
//         variant: "destructive",
//       });
//     }
//   };

//   return (
//     <div className="flex items-center justify-center min-h-[calc(100vh-12rem)] py-12">
//       <Card className="w-full max-w-md shadow-xl">
//         <CardHeader className="text-center">
//           <LogInIcon className="mx-auto h-12 w-12 text-primary mb-4" />
//           <CardTitle className="text-3xl font-headline">Welcome Back</CardTitle>
//           <CardDescription>Log in to access your FurnishVerse account.</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//             <div className="space-y-2">
//               <Label htmlFor="email">Email</Label>
//               <Input id="email" type="email" {...register("email")} placeholder="you@example.com" />
//               {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="password">Password</Label>
//               <Input id="password" type="password" {...register("password")} placeholder="••••••••" />
//               {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
//             </div>
//             <Button type="submit" className="w-full" disabled={isLoading}>
//               {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogInIcon className="mr-2 h-4 w-4" />}
//               {isLoading ? "Logging In..." : "Log In"}
//             </Button>
//           </form>
//         </CardContent>
//         <CardFooter className="flex flex-col items-center space-y-2">
//           <p className="text-sm text-muted-foreground">
//             Don't have an account?{' '}
//             <Link href="/register" className="font-medium text-primary hover:underline">
//               Sign up
//             </Link>
//           </p>
//         </CardFooter>
//       </Card>
//     </div>
//   );
// }


"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, LogInIcon } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(5, "Password must be at least 5 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, error, isOnline } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    setIsLoading(true);
    try {
      if (!isOnline) {
        toast({
          title: "Offline Mode",
          description: "Attempting to login with cached credentials...",
        });
      }

      const loggedInUser = await login(data.email, data.password);
      
      if (loggedInUser) {
        toast({
          title: isOnline ? "Login Successful" : "Offline Login",
          description: isOnline 
            ? "Welcome back to FurnishVerse!" 
            : "Using cached credentials. Some features may be limited.",
        });
        
        if (loggedInUser.isAdmin) {
          router.push('/admin/theme');
        } else {
          router.push('/profile');
        }
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-12rem)] py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <LogInIcon className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-3xl font-headline">Welcome Back</CardTitle>
          <CardDescription>Log in to access your FurnishVerse account.</CardDescription>
        </CardHeader>
        <CardContent>
          {!isOnline && (
            <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-md text-sm">
              You are currently offline. Login may use cached credentials.
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                {...register("email")} 
                placeholder="you@example.com" 
                disabled={isLoading}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                {...register("password")} 
                placeholder="••••••••" 
                disabled={isLoading}
                className={errors.password ? "border-destructive" : ""}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging In...
                </>
              ) : (
                <>
                  <LogInIcon className="mr-2 h-4 w-4" />
                  Log In
                </>
              )}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col items-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link 
              href="/register" 
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </Link>
          </p>
          <Link 
            href="/forgot-password" 
            className="text-sm text-muted-foreground hover:underline"
          >
            Forgot password?
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}