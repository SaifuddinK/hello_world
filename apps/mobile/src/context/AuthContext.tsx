import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://reply-ali-exhibit-passes.trycloudflare.com'; // Pi 1 Cloudflare tunnel

export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

interface AuthCtx {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  authFetch: (path: string, init?: RequestInit) => Promise<Response>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.multiGet(['access_token', 'user']).then(([[, token], [, u]]) => {
      if (token && u) setUser(JSON.parse(u));
      setIsLoading(false);
    });
  }, []);

  const persist = async (access: string, refresh: string, u: User) => {
    await AsyncStorage.multiSet([
      ['access_token', access],
      ['refresh_token', refresh],
      ['user', JSON.stringify(u)],
    ]);
    setUser(u);
  };

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.detail ?? 'Login failed');
    }
    const data = await res.json();
    const meRes = await fetch(`${API_BASE}/api/auth/me/`, {
      headers: { Authorization: `Bearer ${data.access}` },
    });
    const u: User = await meRes.json();
    await persist(data.access, data.refresh, u);
  }, []);

  const register = useCallback(async (email: string, name: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      const msg = Object.values(e).flat().join(' ') || 'Registration failed';
      throw new Error(msg);
    }
    const data = await res.json();
    await persist(data.access, data.refresh, data.user);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
    setUser(null);
  }, []);

  const authFetch = useCallback(async (path: string, init: RequestInit = {}) => {
    const token = await AsyncStorage.getItem('access_token');
    return fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers as object ?? {}),
      },
    });
  }, []);

  return (
    <Ctx.Provider value={{ user, isLoading, login, register, logout, authFetch }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
