
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
  isAdmin?: boolean; 
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<User | null>; // Changed return type
  logout: () => void;
  register: (email: string, pass: string, name?:string) => Promise<boolean>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to load user from localStorage on initial mount
    const storedUser = localStorage.getItem('furnishverse-user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('furnishverse-user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<User | null> => {
    setIsLoading(true);
    // Mock login: For this demo, login always "succeeds" by returning a user object.
    // A real implementation would validate 'pass' and might return null on failure.
    // The isAdmin flag is set based on the email content.
    const mockUser: User = { 
      id: '1', 
      email, 
      name: email.includes('admin') ? 'Admin User' : 'Mock User', 
      isAdmin: email.includes('admin') 
    };
    setUser(mockUser); // Set user in context
    localStorage.setItem('furnishverse-user', JSON.stringify(mockUser));
    setIsLoading(false);
    return mockUser; // Return the user object
  };

  const register = async (email: string, _pass: string, name?: string): Promise<boolean> => {
    setIsLoading(true);
    // Mock register
    const mockUser: User = { id: Date.now().toString(), email, name: name || 'New User', isAdmin: email.includes('admin') };
    setUser(mockUser); // This auto-logs in the user upon registration in the mock
    localStorage.setItem('furnishverse-user', JSON.stringify(mockUser));
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('furnishverse-user');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

