"use client";

import { createContext, useContext, useState, useEffect } from "react";
import apiClient from "@/lib/axios";
import { useRouter } from "next/navigation";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch current user on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await apiClient.get("/auth/me");
      if (response.data.success) {
        setUser(response.data.data.user);
      }
    } catch (error) {
      // 401 is expected when not authenticated, so don't log it
      if (error.response?.status !== 401) {
        console.error("Auth check failed:", error);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await apiClient.post("/auth/login", credentials);
      if (response.data.success) {
        setUser(response.data.data.user);
        return { success: true, user: response.data.data.user };
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Login failed",
      };
    }
  };

  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      // Logout errors are usually not critical, only log non-401 errors
      if (error.response?.status !== 401) {
        console.error("Logout error:", error);
      }
    } finally {
      setUser(null);
      router.push("/admin/auth");
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth,
    isAuthenticated: !!user,
    isSA: user?.role === "SA",
    isDH: user?.role === "DH",
    isVH: user?.role === "VH",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
