'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User, authApi, userApi, ApiError } from '@/lib/api';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('shipforge_token');
    if (storedToken) {
      setToken(storedToken);
      userApi.getProfile()
        .then((u) => setUser(u))
        .catch(() => {
          // Token expired or invalid — clear it
          localStorage.removeItem('shipforge_token');
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const persistAuth = useCallback((u: User, t: string) => {
    localStorage.setItem('shipforge_token', t);
    setToken(t);
    setUser(u);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login({ email, password });
    persistAuth(data.user, data.token);
    router.push(data.user.role === 'ADMIN' ? '/admin' : '/dashboard');
  }, [persistAuth, router]);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const data = await authApi.signup({ name, email, password });
    persistAuth(data.user, data.token);
    router.push('/dashboard');
  }, [persistAuth, router]);

  const logout = useCallback(() => {
    localStorage.removeItem('shipforge_token');
    setToken(null);
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, signup, logout,
      isAdmin: user?.role === 'ADMIN',
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
};
