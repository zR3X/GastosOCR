import React, { createContext, useContext, useState } from 'react';
import type { User } from '../types';

const DEMO_USER: User = { email: 'demo@gastos.com', name: 'Usuario Demo' };
const DEMO_PASSWORD = 'demo123';
const AUTH_KEY = 'gastos_auth';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = sessionStorage.getItem(AUTH_KEY);
      return stored ? (JSON.parse(stored) as User) : null;
    } catch {
      return null;
    }
  });

  const login = (email: string, password: string): boolean => {
    if (email.trim() === DEMO_USER.email && password === DEMO_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, JSON.stringify(DEMO_USER));
      setUser(DEMO_USER);
      return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
