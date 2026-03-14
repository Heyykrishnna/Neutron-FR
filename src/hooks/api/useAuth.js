import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/queryKeys";
import apiClient from "@/lib/axios";

/**
 * Check current authenticated user
 */
export function useAuthMe() {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: async () => {
      const { data } = await apiClient.get("/auth/me");
      return data;
    },
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Login mutation
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials) => {
      const { data } = await apiClient.post("/auth/login", credentials);
      return data;
    },
    onSuccess: (data) => {
      // Update auth.me cache with logged-in user
      queryClient.setQueryData(queryKeys.auth.me(), data);
    },
  });
}

/**
 * Logout mutation
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post("/auth/logout");
      return data;
    },
    onSuccess: () => {
      // Clear all caches on logout
      queryClient.clear();
    },
  });
}

/**
 * Google OAuth login
 */
export function useGoogleLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token) => {
      const { data } = await apiClient.post("/auth/google", { token });
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.auth.me(), data);
    },
  });
}

/**
 * Get all active sessions for the current user
 * GET /api/v1/auth/sessions
 */
export function useSessions() {
  return useQuery({
    queryKey: [...queryKeys.auth.all, "sessions"],
    queryFn: async () => {
      const { data } = await apiClient.get("/auth/sessions");
      return data?.data?.sessions || data?.sessions || [];
    },
  });
}

/**
 * Revoke a single session
 * DELETE /api/v1/auth/sessions/:sessionId
 */
export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId) => {
      const { data } = await apiClient.delete(`/auth/sessions/${sessionId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.auth.all, "sessions"],
      });
    },
  });
}

/**
 * Revoke all sessions (logout everywhere)
 * DELETE /api/v1/auth/sessions
 */
export function useRevokeAllSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.delete("/auth/sessions");
      return data;
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

/**
 * Change password for authenticated user
 * POST /api/v1/auth/change-password
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }) => {
      const { data } = await apiClient.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      return data;
    },
  });
}
