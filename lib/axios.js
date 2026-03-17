import axios from "axios";

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

const emitServerRejectedAuth = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("auth:server-rejected"));
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

// Queue for managing concurrent refresh requests
let refreshPromise = null;
const pendingRequests = [];

const onRefreshed = () => {
  pendingRequests.forEach((callback) => callback());
  pendingRequests.length = 0;
};

const addPendingRequest = (callback) => {
  pendingRequests.push(callback);
};

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  withCredentials: true, // Send cookies with requests
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers["Content-Type"];
      }
    }

    // You can add additional headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      return Promise.reject(error);
    }

    // Don't retry these requests to prevent infinite loops
    const skipRefreshPaths = [
      "/auth/refresh",
      "/auth/me",
      "/auth/login",
      "/auth/logout",
    ];
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
        .catch((refreshError) => {
          refreshPromise = null;
          if (isExplicitAuthRejection(refreshError)) {
            emitServerRejectedAuth();
          }
          return Promise.reject(refreshError);
        });

      return refreshPromise;
    }

    if (shouldSkipRefresh && isExplicitAuthRejection(error)) {
      emitServerRejectedAuth();
    }

    return Promise.reject(error);
  },
);

export default apiClient;
