"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import apiClient from "@/lib/axios";
import { usePathname, useRouter } from "next/navigation";
import {
  initSocket,
  connectSocket,
  disconnectSocket,
  isSocketConnectionAllowed,
  waitForSocketConnection,
} from "@/lib/socket";

interface AuthUser {
  id?: string;
  role?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (credentials: Record<string, any>) => Promise<{
    success: boolean;
    user?: AuthUser;
    errorCode?: string;
    error?: string;
  }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  isAuthenticated: boolean;
  isSocketReady: boolean;
  isSA: boolean;
  isDH: boolean;
  isVH: boolean;
  isJudge: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);
const AUTH_USER_CACHE_KEY = "neutron.auth.user";
const AUTH_REJECTION_ERRORS = new Set([
  "UNAUTHORIZED",
  "INVALID_ACCESS_TOKEN",
  "ACCESS_TOKEN_EXPIRED",
  "INVALID_REFRESH_TOKEN",
  "REFRESH_TOKEN_EXPIRED",
  "SESSION_NOT_FOUND",
  "SESSION_REVOKED",
  "SESSION_EXPIRED",
  "USER_NOT_FOUND",
  "ACCOUNT_SUSPENDED",
  "ACCOUNT_REVOKED",
  "NO_DEPARTMENT_ASSIGNED",
]);

const isExplicitAuthRejection = (error: unknown): boolean => {
  const err = error as {
    response?: { status?: number; data?: { error?: string } };
  };
  const status = err?.response?.status;
  const code = err?.response?.data?.error;

  if (status !== 401 && status !== 403) return false;
  return code ? AUTH_REJECTION_ERRORS.has(code) : false;
};

const getCachedUser = (): AuthUser | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_USER_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const cacheUser = (user: AuthUser | null) => {
  if (typeof window === "undefined") return;
  if (!user) {
    window.localStorage.removeItem(AUTH_USER_CACHE_KEY);
    return;
  }
  window.localStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(user));
};

const buildFallbackDeviceName = (userAgent: string = ""): string | null => {
  const ua = userAgent.toLowerCase();

  let platform = "";
  if (ua.includes("android")) platform = "Android";
  else if (ua.includes("iphone")) platform = "iPhone";
  else if (ua.includes("ipad")) platform = "iPad";
  else if (ua.includes("mac os x")) platform = "macOS";
  else if (ua.includes("windows")) platform = "Windows";
  else if (ua.includes("linux")) platform = "Linux";

  let browser = "";
  if (ua.includes("samsungbrowser")) browser = "Samsung Internet";
  else if (ua.includes("edg/")) browser = "Edge";
  else if (ua.includes("opr/") || ua.includes("opera")) browser = "Opera";
  else if (ua.includes("firefox/")) browser = "Firefox";
  else if (
    ua.includes("chrome/") &&
    !ua.includes("edg/") &&
    !ua.includes("opr/")
  )
    browser = "Chrome";
  else if (
    ua.includes("safari/") &&
    !ua.includes("chrome/") &&
    !ua.includes("chromium")
  )
    browser = "Safari";

  if (platform && browser) return `${platform} ${browser}`;
  return platform || browser || null;
};

const getClientDeviceName = async (): Promise<string | null> => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return null;
  }
  try {
    if ((navigator as any).userAgentData?.getHighEntropyValues) {
      const values = await (
        navigator as any
      ).userAgentData.getHighEntropyValues(["model", "platform"]);
      const model = values?.model?.trim();
      const platform = values?.platform?.trim();
      if (model) {
        const normalizedModel = /^SM-/i.test(model)
          ? `Samsung ${model.toUpperCase()}`
          : model;
        if (platform) {
          return `${normalizedModel} ${platform}`;
        }
        return normalizedModel;
      }
      if (platform) {
        return buildFallbackDeviceName(navigator.userAgent) || platform;
      }
    }
  } catch {
    // Fall back to user-agent-derived naming below.
  }
  return buildFallbackDeviceName(navigator.userAgent);
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(() => getCachedUser());
  const [loading, setLoading] = useState<boolean>(true);
  const [isSocketReady, setIsSocketReady] = useState<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();

  const getAuthRedirectPath = useCallback(() => {
    return pathname?.startsWith("/admin") ? "/admin/auth" : "/auth/signin";
  }, [pathname]);

  const isAuthRoute = useCallback(() => {
    if (!pathname) return false;
    return pathname.startsWith("/auth") || pathname.startsWith("/admin/auth");
  }, [pathname]);

  const clearUserAndRedirect = useCallback((): void => {
    setUser(null);
    cacheUser(null);
    disconnectSocket();
    if (!isAuthRoute()) {
      router.replace(getAuthRedirectPath());
    }
  }, [getAuthRedirectPath, isAuthRoute, router]);

  useEffect(() => {
    initSocket({
      onConnect: () => {
        setIsSocketReady(true);
      },
      onDisconnect: (reason?: string) => {
        setIsSocketReady(false);
        if (reason === "io server disconnect") {
          clearUserAndRedirect();
        }
      },
      onForceLogout: () => {
        clearUserAndRedirect();
      },
      onConnectError: () => {
        setIsSocketReady(false);
      },
    });

    connectSocket();

    const bootstrapAuth = async () => {
      await waitForSocketConnection(1500);
      await checkAuth();
    };

    bootstrapAuth();

    return () => {
      disconnectSocket();
    };
  }, [clearUserAndRedirect]);

  useEffect(() => {
    const onServerRejectedAuth = () => {
      disconnectSocket();
      clearUserAndRedirect();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("auth:server-rejected", onServerRejectedAuth);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(
          "auth:server-rejected",
          onServerRejectedAuth,
        );
      }
    };
  }, [clearUserAndRedirect]);

  const checkAuth = async (): Promise<void> => {
    try {
      if (!isSocketConnectionAllowed()) {
        connectSocket();
        await waitForSocketConnection(2500);
      }

      const response = await apiClient.get("/auth/me");
      if (response.data.success) {
        setUser(response.data.data.user);
        cacheUser(response.data.data.user);
      }
    } catch (error: unknown) {
      if ((error as any)?.response?.data?.error === "SOCKET_NOT_CONNECTED") {
        console.warn("Auth check paused until socket reconnects.");
      }

      if (isExplicitAuthRejection(error)) {
        setUser(null);
        cacheUser(null);
      } else if (
        (error as any).response?.status >= 500 ||
        !(error as any).response
      ) {
        console.warn("Auth check skipped due to backend/network issue.");
      } else if ((error as any).response?.status !== 401) {
        console.error("Auth check failed:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (
    credentials: Record<string, any>,
  ): Promise<{
    success: boolean;
    user?: AuthUser;
    errorCode?: string;
    error?: string;
  }> => {
    try {
      const deviceName = await getClientDeviceName();
      const response = await apiClient.post("/auth/login", {
        ...credentials,
        ...(deviceName ? { deviceName } : {}),
      });
      if (response.data.success) {
        setUser(response.data.data.user);
        cacheUser(response.data.data.user);
        connectSocket();
        await waitForSocketConnection(2000);
        return { success: true, user: response.data.data.user };
      }
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { error?: string; message?: string } };
      };
      return {
        success: false,
        errorCode: err.response?.data?.error,
        error: err.response?.data?.message || "Login failed",
      };
    }
    return { success: false, error: "Login failed" };
  };

  const logout = async (): Promise<void> => {
    try {
      await apiClient.post("/auth/logout");
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      // Logout errors are usually not critical, only log non-401 errors
      if (err.response?.status !== 401) {
        console.error("Logout error:", error);
      }
    } finally {
      disconnectSocket();
      setUser(null);
      cacheUser(null);
      if (!isAuthRoute()) {
        router.replace(getAuthRedirectPath());
      }
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth,
    isAuthenticated: !!user,
    isSocketReady,
    isSA: user?.role === "SA",
    isDH: user?.role === "DH",
    isVH: user?.role === "VH",
    isJudge: user?.role === "JUDGE",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
