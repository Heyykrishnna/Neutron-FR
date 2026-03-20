"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import apiClient from "@/lib/axios";
import { useRouter } from "next/navigation";
import {
  initSocket,
  connectSocket,
  disconnectSocket,
  isSocketConnectionAllowed,
  waitForSocketConnection,
} from "@/lib/socket";

const AuthContext = createContext(null);
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
]);

const isExplicitAuthRejection = (error) => {
  const status = error?.response?.status;
  const code = error?.response?.data?.error;

  if (status !== 401 && status !== 403) return false;
  return AUTH_REJECTION_ERRORS.has(code);
};

const getCachedUser = () => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(AUTH_USER_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const cacheUser = (user) => {
  if (typeof window === "undefined") return;

  if (!user) {
    window.localStorage.removeItem(AUTH_USER_CACHE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(user));
};

const buildFallbackDeviceName = (userAgent = "") => {
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

const getClientDeviceName = async () => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return null;
  }

  try {
    if (navigator.userAgentData?.getHighEntropyValues) {
      const values = await navigator.userAgentData.getHighEntropyValues([
        "model",
        "platform",
      ]);

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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getCachedUser());
  const [loading, setLoading] = useState(true);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const router = useRouter();

  const clearUserAndRedirect = useCallback(() => {
    setUser(null);
    cacheUser(null);
    disconnectSocket();
    router.push("/admin/auth");
  }, [router]);

  useEffect(() => {
    initSocket({
      onConnect: () => {
        setIsSocketReady(true);
      },
      onDisconnect: (reason) => {
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

  const checkAuth = async () => {
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
    } catch (error) {
      if (error?.response?.data?.error === "SOCKET_NOT_CONNECTED") {
        console.warn("Auth check paused until socket reconnects.");
      }

      if (isExplicitAuthRejection(error)) {
        setUser(null);
        cacheUser(null);
      } else if (error.response?.status >= 500 || !error.response) {
        console.warn("Auth check skipped due to backend/network issue.");
      } else if (error.response?.status !== 401) {
        console.error("Auth check failed:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
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
    } catch (error) {
      return {
        success: false,
        errorCode: error.response?.data?.error,
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
      disconnectSocket();
      setUser(null);
      cacheUser(null);
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
    isSocketReady,
    isSA: user?.role === "SA",
    isDH: user?.role === "DH",
    isVH: user?.role === "VH",
    isJudge: user?.role === "JUDGE",
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
