import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/queryKeys";
import apiClient from "@/lib/axios";

// Define types for user data
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isSuspended?: boolean;
  isRevoked?: boolean;
  [key: string]: any;
}

interface UserFilters {
  [key: string]: any;
}

interface UpdateUserRoleParams {
  userId: string;
  role: string;
}

interface SuspendUserParams {
  userId: string;
  data: any;
}

interface RevokeUserParams {
  userId: string;
  reason: string;
}

interface InviteUserParams {
  name: string;
  email: string;
  role: string;
}

interface BulkInviteParams {
  email: string;
  role: string;
}

/**
 * Fetch all users with optional filters
 */
export function useUsers(filters: UserFilters = {}, queryOptions = {}) {
  return useQuery<User[]>({
    queryKey: queryKeys.users.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get("/sa/users", { params: filters });
      return data.data.users;
    },
    ...queryOptions,
  });
}

/**
 * Fetch single user by ID
 */
export function useUser(userId: string) {
  return useQuery<User>({
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
    mutationFn: async (params: UpdateUserRoleParams) => {
      const { data } = await apiClient.put(`/sa/users/${params.userId}/role`, {
        role: params.role,
      });
      return data;
    },
    onMutate: async (params: UpdateUserRoleParams) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users.all });
      const previousUsers = queryClient.getQueryData<User[]>(queryKeys.users.lists());

      queryClient.setQueriesData<User[]>(
        { queryKey: queryKeys.users.lists() },
        (old) => {
          if (!old || !Array.isArray(old)) return old;
          return old.map((user) =>
            user.id === params.userId ? { ...user, role: params.role } : user,
          );
        },
      );

      return { previousUsers };
    },
    onError: (err, variables, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(queryKeys.users.lists(), context.previousUsers);
      }
    },
    onSettled: () => {
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
    mutationFn: async (params: SuspendUserParams) => {
      const { data } = await apiClient.post(
        `/auth/admin/users/${params.userId}/suspend`,
        params.data,
      );
      return data;
    },
    onMutate: async (params: SuspendUserParams) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users.all });
      const previousUsers = queryClient.getQueryData<User[]>(queryKeys.users.lists());

      queryClient.setQueriesData<User[]>(
        { queryKey: queryKeys.users.lists() },
        (old) => {
          if (!old || !Array.isArray(old)) return old;
          return old.map((user) =>
            user.id === params.userId ? { ...user, isSuspended: true } : user,
          );
        },
      );

      return { previousUsers };
    },
    onError: (err, variables, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(queryKeys.users.lists(), context.previousUsers);
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
    mutationFn: async (userId: string) => {
      const { data } = await apiClient.post(
        `/auth/admin/users/${userId}/unsuspend`,
      );
      return data;
    },
    onMutate: async (userId: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users.all });
      const previousUsers = queryClient.getQueryData<User[]>(queryKeys.users.lists());

      queryClient.setQueriesData<User[]>(
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
        queryClient.setQueryData(queryKeys.users.lists(), context.previousUsers);
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
    mutationFn: async (params: RevokeUserParams) => {
      const { data } = await apiClient.post(
        `/auth/admin/users/${params.userId}/revoke`,
        { reason: params.reason },
      );
      return data;
    },
    onMutate: async (params: RevokeUserParams) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users.all });
      const previousUsers = queryClient.getQueryData<User[]>(queryKeys.users.lists());

      queryClient.setQueriesData<User[]>(
        { queryKey: queryKeys.users.lists() },
        (old) => {
          if (!old || !Array.isArray(old)) return old;
          return old.map((user) =>
            user.id === params.userId ? { ...user, isRevoked: true } : user,
          );
        },
      );

      return { previousUsers };
    },
    onError: (err, variables, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(queryKeys.users.lists(), context.previousUsers);
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
    mutationFn: async (userId: string) => {
      const { data } = await apiClient.delete(`/sa/users/${userId}`);
      return data;
    },
    onMutate: async (userId: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users.all });
      const previousUsers = queryClient.getQueryData<User[]>(queryKeys.users.lists());

      queryClient.setQueriesData<User[]>(
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
        queryClient.setQueryData(queryKeys.users.lists(), context.previousUsers);
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
    mutationFn: async (params: InviteUserParams) => {
      const roleMap: Record<string, string> = {
        SA: "SA",
        BOARD: "BOARD",
        DH: "DH",
        CH: "CH",
        JUDGE: "JUDGE",
        VOLUNTEER: "VOLUNTEER",
        USER: "USER",
        VOL: "VOLUNTEER",
        PART: "USER",
        VH: "VOLUNTEER",
      };

      const apiRole = roleMap[params.role] || params.role;

      const validRoles = new Set([
        "SA",
        "BOARD",
        "DH",
        "CH",
        "JUDGE",
        "VOLUNTEER",
        "USER",
      ]);

      if (!apiRole || !validRoles.has(apiRole)) {
        throw new Error("Invalid invite role selected");
      }

      const { data } = await apiClient.post("/auth/invite", {
        email: params.email,
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
 * Invite multiple users via CSV (sends invite emails in bulk)
 */
export function useBulkInviteUsers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invites: BulkInviteParams[]) => {
      const roleMap: Record<string, string> = {
        SA: "SA",
        BOARD: "BOARD",
        DH: "DH",
        CH: "CH",
        JUDGE: "JUDGE",
        VOLUNTEER: "VOLUNTEER",
        USER: "USER",
        VOL: "VOLUNTEER",
        PART: "USER",
        VH: "VOLUNTEER",
      };
      const validRoles = new Set([
        "SA",
        "BOARD",
        "DH",
        "CH",
        "JUDGE",
        "VOLUNTEER",
        "USER",
      ]);

      const mapped = invites.map(({ email, role }) => {
        const apiRole = roleMap[role] || role;
        return {
          email: email.trim(),
          role: validRoles.has(apiRole) ? apiRole : "USER",
        };
      });

      const { data } = await apiClient.post("/auth/invite/bulk", {
        invites: mapped,
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
export function useDHDepartmentMembers(enabled = true) {
  return useQuery({
    queryKey: ["dh", "my-department", "members"],
    queryFn: async () => {
      const { data } = await apiClient.get("/dh/my-department/members");
      return data.data; // { department, members }
    },
    enabled,
  });
}


