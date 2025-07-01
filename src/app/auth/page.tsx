"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

export default function AuthPage() {
  const { isLoading, error, user, login, register: registerUser } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (mode === 'login') {
      const success = await login(email, password);
      if (success) {
        const token = localStorage.getItem('jwt');
        let latestUser = user;
        if (token) {
          try {
            const res = await fetch('/api/auth/me', {
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) latestUser = data.user;
          } catch {}
        }
        toast({
          title: 'Login Successful',
          description: `Welcome back, ${(latestUser && (latestUser.name || latestUser.email)) || email}!`,
          variant: 'default',
        });
        setTimeout(() => {
          if (latestUser?.isAdmin) {
            router.push('/admin');
          } else {
            router.push('/');
          }
        }, 1200);
      } else {
        setFormError(error || 'Login failed');
      }
    } else {
      if (!name) {
        setFormError('Name is required for registration');
        return;
      }
      const success = await registerUser(email, password, name);
      if (success) {
        toast({
          title: user?.isAdmin ? 'Admin Registered!' : 'User Registered!',
          description: user?.isAdmin
            ? 'You have registered as the first admin. Please log in.'
            : 'Registration successful. Please log in.',
          variant: 'default',
        });
        setTimeout(() => {
          setMode('login');
          setEmail('');
          setPassword('');
          setName('');
        }, 1200);
      } else {
        setFormError(error || 'Registration failed');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] py-8">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {mode === 'login' ? 'Login to Admin' : 'Register Admin'}
          </CardTitle>
          <div className="flex justify-center gap-2 mt-4">
            <Button variant={mode === 'login' ? 'default' : 'outline'} onClick={() => setMode('login')} disabled={isLoading}>
              Login
            </Button>
            <Button variant={mode === 'register' ? 'default' : 'outline'} onClick={() => setMode('register')} disabled={isLoading}>
              Register
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            )}
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            {formError && <div className="text-destructive text-sm text-center">{formError}</div>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (mode === 'login' ? 'Logging in...' : 'Registering...') : (mode === 'login' ? 'Login' : 'Register')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 