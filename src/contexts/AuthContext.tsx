"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

interface User {
  email: string;
  name?: string;
  isAdmin?: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          console.log('AuthContext /api/auth/me response:', data);
          if (data.success) setUser(data.user);
          console.log('AuthContext loaded user:', data.user);
          setIsLoading(false);
        })
        .catch((err) => {
          console.log('AuthContext /api/auth/me error:', err);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('jwt', data.token);
        console.log('AuthContext login: JWT set in localStorage:', data.token);
        setUser(data.user);
        setIsLoading(false);
        return true;
      } else {
        setError(data.error || 'Login failed');
        setIsLoading(false);
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setIsLoading(false);
      console.log('AuthContext login error:', err);
      return false;
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('jwt', data.token);
        console.log('AuthContext register: JWT set in localStorage:', data.token);
        setUser(data.user);
        setIsLoading(false);
        return true;
      } else {
        setError(data.error || 'Registration failed');
        setIsLoading(false);
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      setIsLoading(false);
      console.log('AuthContext register error:', err);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('jwt');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
// This file previously handled authentication using Firebase. All Firebase-related code has been removed.
// You can implement your own authentication logic here using MongoDB, JWT, or a third-party provider.