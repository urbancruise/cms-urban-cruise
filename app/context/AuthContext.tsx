"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

interface City {
  id: number;
  name: string;
  state: string | null;
  code: string | null;
}

interface CityAccess {
  city_id: number;
  permissions: string[];
}

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
  roles: string[];
  role_ids?: number[];
  permissions: string[];
  cities?: City[];
  city_ids?: number[];
  city_permissions?: CityAccess[];
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (perm: string) => boolean;
  hasCityPermission: (perm: string, cityId: number | null) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================
// CSRF helper — read cookie from document
// ============================================================
export function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match?.[1] ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Ensure CSRF cookie exists on mount
  useEffect(() => {
    fetch("/api/auth/csrf").catch(() => {});
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        if (response.status === 401) setUser(null);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const logout = async () => {
    try {
      const csrf = getCsrfToken();
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: csrf ? { "x-csrf-token": csrf } : {},
      });
      setUser(null);
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  const hasPermission = (perm: string) => {
    if (!user) return false;
    if (user.roles?.includes("admin")) return true;
    return user.permissions?.includes(perm) ?? false;
  };

  const hasCityPermission = (perm: string, cityId: number | null): boolean => {
    if (!user) return false;
    if (user.roles?.includes("admin")) return true;
    if (!cityId) return hasPermission(perm);

    const cityAccess = (user.city_permissions || []).find(
      (cp) => cp.city_id === cityId
    );

    if (!cityAccess || cityAccess.permissions.length === 0) {
      return hasPermission(perm);
    }
    return cityAccess.permissions.includes(perm);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        logout,
        refreshUser,
        hasPermission,
        hasCityPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
