import axios from "axios";

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
        // Refresh failed - just reject, don't redirect
        // Let the component handle the redirect based on context
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
