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

    // Handle 401 Unauthorized - attempt token refresh (only once)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !shouldSkipRefresh
    ) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token
        await apiClient.post("/auth/refresh");

        // Retry the original request after successful refresh
        return apiClient(originalRequest);
      } catch (refreshError) {
        if (isExplicitAuthRejection(refreshError)) {
          emitServerRejectedAuth();
        }

        return Promise.reject(refreshError);
      }
    }

    if (shouldSkipRefresh && isExplicitAuthRejection(error)) {
      emitServerRejectedAuth();
    }

    return Promise.reject(error);
  },
);

export default apiClient;
