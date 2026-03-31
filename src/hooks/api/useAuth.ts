import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/queryKeys";
import apiClient from "@/lib/axios";

/**
 * Types
 */

export interface User {
  _id: string;
  name: string;
  email: string;
  role?: string;
  [key: string]: any;
}

export interface Session {
  _id: string;
  device?: string;
  ip?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

/**
 * Get current authenticated user
 */
export function useAuthMe() {
  return useQuery<User>({
    queryKey: queryKeys.auth.me(),
    queryFn: async () => {
      const { data } = await apiClient.get<any>("/auth/me");
      return data?.data?.user || data?.user || data;
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

  return useMutation<User, Error, LoginCredentials>({
    mutationFn: async (credentials) => {
      const { data } = await apiClient.post<User>("/auth/login", credentials);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.auth.me(), data);
    },
  });
}

/**
 * Logout mutation
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await apiClient.post("/auth/logout");
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

/**
 * Google OAuth login
 */
export function useGoogleLogin() {
  const queryClient = useQueryClient();

  return useMutation<User, Error, { token: string }>({
    mutationFn: async ({ token }) => {
      const { data } = await apiClient.post<User>("/auth/google", {
        token,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.auth.me(), data);
    },
  });
}

/**
 * Email registration
 */
export function useRegister() {
  return useMutation<
    { success: boolean; message?: string; data?: { userId?: string } },
    Error,
    RegisterPayload
  >({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post("/auth/register", payload);
      return data;
    },
  });
}

/**
 * Request password reset link
 */
export function useRequestPasswordReset() {
  return useMutation<
    { success: boolean; message?: string },
    Error,
    { email: string }
  >({
    mutationFn: async ({ email }) => {
      const { data } = await apiClient.post("/auth/password-reset/request", {
        email,
      });
      return data;
    },
  });
}

/**
 * Get all active sessions
 */
export function useSessions() {
  return useQuery<Session[]>({
    queryKey: [...queryKeys.auth.all, "sessions"],
    queryFn: async () => {
      const { data } = await apiClient.get<any>("/auth/sessions");
      return data?.data?.sessions || data?.sessions || [];
    },
  });
}

/**
 * Revoke single session
 */
export function useRevokeSession() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, string>({
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
 * Revoke all sessions
 */
export function useRevokeAllSessions() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await apiClient.delete("/auth/sessions");
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

/**
 * Change password
 */
export function useChangePassword() {
  return useMutation<
    any,
    Error,
    { currentPassword: string; newPassword: string }
  >({
    mutationFn: async ({ currentPassword, newPassword }) => {
      const { data } = await apiClient.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      return data;
    },
  });
}

/**
 * Resend verification email
 */
export function useResendVerificationEmail() {
  return useMutation<
    { success: boolean; message?: string },
    Error,
    { email: string }
  >({
    mutationFn: async ({ email }) => {
      const { data } = await apiClient.post(
        "/auth/resend-verification-public",
        {
          email,
        },
      );
      return data;
    },
  });
}

/**
 * Verify email with token
 */
export function useVerifyEmail() {
  return useMutation<
    { success: boolean; message?: string },
    Error,
    { token: string }
  >({
    mutationFn: async ({ token }) => {
      const { data } = await apiClient.get("/auth/verify-email", {
        params: { token },
      });
      return data;
    },
  });
}
