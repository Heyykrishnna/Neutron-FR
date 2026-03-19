import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/queryKeys";
import apiClient from "@/lib/axios";

/**
 * Fetch all users with optional filters
 */
export function useUsers(filters = {}, queryOptions = {}) {
  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get("/sa/users", { params: filters });
      return data.data.users; // Return just the users array
    },
    ...queryOptions,
  });
}

/**
 * Fetch single user by ID
 */
export function useUser(userId) {
  return useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: async () => {
      const { data } = await apiClient.get(`/sa/users/${userId}`);
      return data;
    },
    enabled: !!userId,
  });
}

/**
 * Update user role
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }) => {
      const { data } = await apiClient.put(`/sa/users/${userId}/role`, {
        role,
      });
      return data;
    },
    onMutate: async ({ userId, role }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.users.all });

      // Snapshot previous value
      const previousUsers = queryClient.getQueryData(queryKeys.users.lists());

      // Optimistically update to new value
      queryClient.setQueriesData(
        { queryKey: queryKeys.users.lists() },
        (old) => {
          if (!old || !Array.isArray(old)) return old;
          return old.map((user) =>
            user.id === userId ? { ...user, role } : user,
          );
        },
      );

      return { previousUsers };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousUsers) {
        queryClient.setQueryData(
          queryKeys.users.lists(),
          context.previousUsers,
        );
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

/**
 * Suspend user
 */
export function useSuspendUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, data: suspendData }) => {
      const { data } = await apiClient.post(
        `/auth/admin/users/${userId}/suspend`,
        suspendData,
      );
      return data;
    },
    onMutate: async ({ userId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users.all });
      const previousUsers = queryClient.getQueryData(queryKeys.users.lists());

      queryClient.setQueriesData(
        { queryKey: queryKeys.users.lists() },
        (old) => {
          if (!old || !Array.isArray(old)) return old;
          return old.map((user) =>
            user.id === userId ? { ...user, isSuspended: true } : user,
          );
        },
      );

      return { previousUsers };
    },
    onError: (err, variables, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(
          queryKeys.users.lists(),
          context.previousUsers,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

/**
 * Unsuspend user
 */
export function useUnsuspendUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId) => {
      const { data } = await apiClient.post(
        `/auth/admin/users/${userId}/unsuspend`,
      );
      return data;
    },
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users.all });
      const previousUsers = queryClient.getQueryData(queryKeys.users.lists());

      queryClient.setQueriesData(
        { queryKey: queryKeys.users.lists() },
        (old) => {
          if (!old || !Array.isArray(old)) return old;
          return old.map((user) =>
            user.id === userId ? { ...user, isSuspended: false } : user,
          );
        },
      );

      return { previousUsers };
    },
    onError: (err, variables, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(
          queryKeys.users.lists(),
          context.previousUsers,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

/**
 * Revoke user access
 */
export function useRevokeUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, reason }) => {
      const { data } = await apiClient.post(
        `/auth/admin/users/${userId}/revoke`,
        { reason },
      );
      return data;
    },
    onMutate: async ({ userId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users.all });
      const previousUsers = queryClient.getQueryData(queryKeys.users.lists());

      queryClient.setQueriesData(
        { queryKey: queryKeys.users.lists() },
        (old) => {
          if (!old || !Array.isArray(old)) return old;
          return old.map((user) =>
            user.id === userId ? { ...user, isRevoked: true } : user,
          );
        },
      );

      return { previousUsers };
    },
    onError: (err, variables, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(
          queryKeys.users.lists(),
          context.previousUsers,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

/**
 * Permanently delete a user (SA only)
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId) => {
      const { data } = await apiClient.delete(`/sa/users/${userId}`);
      return data;
    },
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users.all });
      const previousUsers = queryClient.getQueryData(queryKeys.users.lists());

      queryClient.setQueriesData(
        { queryKey: queryKeys.users.lists() },
        (old) => {
          if (!old || !Array.isArray(old)) return old;
          return old.filter((user) => user.id !== userId);
        },
      );

      return { previousUsers };
    },
    onError: (err, variables, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(
          queryKeys.users.lists(),
          context.previousUsers,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

/**
 * Invite a new user (sends invite email)
 */
export function useInviteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, email, role }) => {
      // Map frontend role codes to backend enum values
      const roleMap = {
        VOL: "VOLUNTEER",
        PART: "USER",
        VH: "VOLUNTEER",
      };

      const apiRole = roleMap[role] || role || "USER";

      const { data } = await apiClient.post("/auth/invite", {
        email,
        role: apiRole,
      });
      return data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

/**
 * DH: Fetch own department members (backend enforces the scope — DH cannot
 * supply an arbitrary departmentId, the server derives it from their session).
 */
export function useDHDepartmentMembers() {
  return useQuery({
    queryKey: ["dh", "my-department", "members"],
    queryFn: async () => {
      const { data } = await apiClient.get("/dh/my-department/members");
      return data.data; // { department, members }
    },
  });
}
