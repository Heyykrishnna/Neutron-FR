import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/queryKeys";
import apiClient from "@/lib/axios";

/**
 * Fetch registrations for DH/SA dashboard (defaults to pending)
 * GET /api/v1/registration/pending?competitionId=X&status=PENDING,REJECTED
 */
export function usePendingRegistrations(filters = {}) {
  return useQuery({
    queryKey: queryKeys.registrations.pending(filters),
    queryFn: async () => {
      const { data } = await apiClient.get("/registration/pending", {
        params: filters,
      });
      const rows =
        data?.data?.registrations ||
        data?.registrations ||
        (Array.isArray(data?.data) ? data.data : null) ||
        (Array.isArray(data) ? data : []);

      return rows.map((row) => {
        if (row?.registration && typeof row.registration === "object") {
          return {
            ...row.registration,
            registrationId: row.registration.id,
            user: row.user || null,
            competition: row.competition || null,
            team: row.team || null,
            formDetails: row.formDetails || null,
            readiness: row.readiness || null,
          };
        }

        return {
          ...row,
          registrationId: row?.registrationId || row?.id || null,
        };
      });
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
