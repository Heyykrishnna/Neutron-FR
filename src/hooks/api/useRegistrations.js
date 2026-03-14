import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/queryKeys";
import apiClient from "@/lib/axios";

/**
 * Fetch pending registrations (DH & SA only)
 * GET /api/v1/registration/pending?competitionId=X
 */
export function usePendingRegistrations(filters = {}) {
  return useQuery({
    queryKey: queryKeys.registrations.pending(filters),
    queryFn: async () => {
      const { data } = await apiClient.get("/registration/pending", {
        params: filters,
      });
      return (
        data?.data?.registrations ||
        data?.registrations ||
        (Array.isArray(data?.data) ? data.data : null) ||
        (Array.isArray(data) ? data : [])
      );
    },
  });
}

/**
 * Approve a registration (DH & SA only)
 * POST /api/v1/registration/:registrationId/approve
 */
export function useApproveRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (registrationId) => {
      const { data } = await apiClient.post(
        `/registration/${registrationId}/approve`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.registrations.all });
    },
  });
}

/**
 * Reject a registration (DH & SA only)
 * POST /api/v1/registration/:registrationId/reject
 */
export function useRejectRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ registrationId, reason }) => {
      const { data } = await apiClient.post(
        `/registration/${registrationId}/reject`,
        { reason },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.registrations.all });
    },
  });
}
