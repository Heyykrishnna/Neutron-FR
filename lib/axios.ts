import axios, {
  AxiosRequestConfig,
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import {
  connectSocket,
  disconnectSocket,
  isSocketConnectionAllowed,
  waitForSocketConnection,
} from "@/lib/socket";

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

const emitServerRejectedAuth = (): void => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("auth:server-rejected"));
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

const PUBLIC_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
  "/auth/google",
  "/auth/google/callback",
  "/auth/me",
  "/auth/verify-email",
  "/auth/resend-verification-public",
  "/auth/password-reset/request",
  "/auth/password-reset/confirm",
  "/auth/invite/validate",
  "/auth/invite/accept",
  "/competitions",
  "/competitions/:id",
  "",
];

const isPublicPath = (url: string = ""): boolean => {
  return PUBLIC_PATHS.some((path) => url.includes(path));
};

const buildSocketRequiredError = (): any => {
  const socketError: any = new Error("Active socket connection required.");
  socketError.response = {
    status: 401,
    data: {
      error: "SOCKET_NOT_CONNECTED",
      message: "Active socket connection required.",
    },
  };
  return socketError;
};

const recoverSocketWithRefresh = async (): Promise<boolean> => {
  try {
    await apiClient.post("/auth/refresh");
    connectSocket();
    const reconnected = await waitForSocketConnection(2000);
    return reconnected || isSocketConnectionAllowed();
  } catch (refreshError) {
    if (isExplicitAuthRejection(refreshError)) {
      disconnectSocket();
      emitServerRejectedAuth();
    }

    return false;
  }
};

const ensureSocketAccessForProtectedRequest = async (): Promise<boolean> => {
  if (isSocketConnectionAllowed()) {
    return true;
  }
  connectSocket();
  const reconnected = await waitForSocketConnection(2000);
  if (reconnected || isSocketConnectionAllowed()) {
    return true;
  }
  return recoverSocketWithRefresh();
};

// Queue for managing concurrent refresh requests
let refreshPromise: Promise<any> | null = null;
const pendingRequests: Array<() => void> = [];

const onRefreshed = (): void => {
  pendingRequests.forEach((callback) => callback());
  pendingRequests.length = 0;
};

const addPendingRequest = (callback: () => void): void => {
  pendingRequests.push(callback);
};

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  withCredentials: true, // Send cookies with requests
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers["Content-Type"];
      }
    }
    if (typeof window !== "undefined" && !isPublicPath(config.url || "")) {
      const hasSocketAccess = await ensureSocketAccessForProtectedRequest();
      if (!hasSocketAccess) {
        return Promise.reject(buildSocketRequiredError());
      }
    }
    // You can add additional headers here if needed
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  },
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: any) => {
    const originalRequest = error.config as any;

    if (!error.response) {
      return Promise.reject(error);
    }

    // Don't retry these requests to prevent infinite loops
    const skipRefreshPaths = ["/auth/refresh", "/auth/login", "/auth/logout"];
    const shouldSkipRefresh = skipRefreshPaths.some((path) =>
      originalRequest.url?.includes(path),
    );

    // Handle 401 Unauthorized - attempt token refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !shouldSkipRefresh
    ) {
      originalRequest._retry = true;

      // If already refreshing, wait for the refresh to complete
      if (refreshPromise) {
        return new Promise((resolve, reject) => {
          addPendingRequest(() => {
            resolve(apiClient(originalRequest));
          });
        }).catch(() => {
          return Promise.reject(error);
        });
      }

      // Start refresh and store the promise
      refreshPromise = apiClient
        .post("/auth/refresh")
        .then(() => {
          refreshPromise = null;
          onRefreshed();
          return apiClient(originalRequest);
        })
        .catch((refreshError: unknown) => {
          refreshPromise = null;
          if (isExplicitAuthRejection(refreshError)) {
            disconnectSocket();
            emitServerRejectedAuth();
          }
          return Promise.reject(refreshError);
        });

      return refreshPromise;
    }

    if (shouldSkipRefresh && isExplicitAuthRejection(error)) {
      disconnectSocket();
      emitServerRejectedAuth();
    }

    return Promise.reject(error);
  },
);

export default apiClient;
