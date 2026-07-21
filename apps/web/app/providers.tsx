"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => void;
  authFetch: (path: string, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const stored = localStorage.getItem("user");
    if (token && stored) {
      setAccessToken(token);
      setUser(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  const persist = (token: string, refresh: string, u: User) => {
    localStorage.setItem("access_token", token);
    localStorage.setItem("refresh_token", refresh);
    localStorage.setItem("user", JSON.stringify(u));
    setAccessToken(token);
    setUser(u);
  };

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail ?? "Login failed");
    }
    const data = await res.json();
    // fetch user profile
    const meRes = await fetch(`${API_BASE}/api/auth/me/`, {
      headers: { Authorization: `Bearer ${data.access}` },
    });
    const u: User = await meRes.json();
    persist(data.access, data.refresh, u);
    router.push("/dashboard");
  }, [router]);

  const register = useCallback(async (email: string, name: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = Object.values(err).flat().join(" ") || "Registration failed";
      throw new Error(msg);
    }
    const data = await res.json();
    persist(data.access, data.refresh, data.user);
    router.push("/dashboard");
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setAccessToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  const authFetch = useCallback((path: string, init: RequestInit = {}) => {
    const token = localStorage.getItem("access_token");
    return fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, register, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
