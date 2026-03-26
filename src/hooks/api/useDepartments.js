import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/queryKeys";
import apiClient from "@/lib/axios";

const normalizeDepartment = (dept) => ({
  ...dept,
  deptHeadIds: Array.isArray(dept?.deptHeadIds)
    ? dept.deptHeadIds
    : dept?.deptHeadId
      ? [dept.deptHeadId]
      : [],
  deptHeads: Array.isArray(dept?.deptHeads)
    ? dept.deptHeads
    : dept?.deptHead
      ? [dept.deptHead]
      : [],
  deptHead:
    dept?.deptHead ||
    (Array.isArray(dept?.deptHeads) && dept.deptHeads.length > 0
      ? dept.deptHeads[0]
      : null),
  membersCount:
    dept?.membersCount ??
    dept?.memberCount ??
    dept?.members_count ??
    (Array.isArray(dept?.members) ? dept.members.length : 0),
});

/**
 * Fetch all departments
 */
export function useDepartments(filters = {}) {
  const { enabled = true, ...params } = filters || {};

  return useQuery({
    queryKey: queryKeys.departments.list(params),
    queryFn: async () => {
      const { data } = await apiClient.get("/sa/departments", {
        params,
      });

      const departments = data?.data?.departments || data?.departments || [];
      return departments.map(normalizeDepartment);
    },
    enabled,
  });
}

/**
 * Fetch single department by ID
 */
export function useDepartment(deptId) {
  return useQuery({
    queryKey: queryKeys.departments.detail(deptId),
    queryFn: async () => {
      const { data } = await apiClient.get(`/sa/departments/${deptId}`);
      const department = data?.data?.department || data?.department;
      return department ? normalizeDepartment(department) : department;
    },
    enabled: !!deptId,
  });
}

/**
 * Create department
 */
export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (departmentData) => {
      const { data } = await apiClient.post("/sa/departments", departmentData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
    },
  });
}

/**
 * Update department
 */
export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ deptId, ...updateData }) => {
      const { data } = await apiClient.put(
        `/sa/departments/${deptId}`,
        updateData,
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.departments.detail(variables.deptId),
      });
    },
  });
}

/**
 * Delete department
 */
export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deptId) => {
      const { data } = await apiClient.delete(`/sa/departments/${deptId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
    },
  });
}

export function useAssignUserToDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ departmentId, userId }) => {
      const { data } = await apiClient.post(
        `/sa/departments/${departmentId}/members`,
        { userId },
      );
      return data;
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.departments.detail(variables.departmentId),
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.departments.all,
      });
    },
  });
}

export function useRemoveUserFromDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ departmentId, userId }) => {
      await apiClient.delete(
        `/sa/departments/${departmentId}/members/${userId}`,
      );
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.departments.detail(variables.departmentId),
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.departments.all,
      });
    },
  });
}
