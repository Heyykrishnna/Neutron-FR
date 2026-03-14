import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/queryKeys";
import apiClient from "@/lib/axios";

/**
 * Overall fest attendance statistics
 * GET /api/v1/volunteer/attendance/fest/stats
 */
export function useFestAttendanceStats() {
  return useQuery({
    queryKey: queryKeys.attendance.festStats(),
    queryFn: async () => {
      const { data } = await apiClient.get("/volunteer/attendance/fest/stats");
      return data?.data?.stats || data?.stats || data?.data || data || null;
    },
  });
}

/**
 * Per-competition attendance statistics
 * GET /api/v1/volunteer/attendance/competition/:competitionId/stats
 */
export function useCompetitionAttendanceStats(competitionId) {
  return useQuery({
    queryKey: queryKeys.attendance.competitionStats(competitionId),
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/volunteer/attendance/competition/${competitionId}/stats`,
      );
      return data?.data?.stats || data?.stats || data?.data || data || null;
    },
    enabled: !!competitionId,
  });
}

/**
 * Mark a participant as attended for a competition
 * POST /api/v1/volunteer/attendance/competition/:competitionId
 */
export function useMarkCompetitionAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ competitionId, userId }) => {
      const { data } = await apiClient.post(
        `/volunteer/attendance/competition/${competitionId}`,
        { userId },
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.attendance.competitionStats(
          variables.competitionId,
        ),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.attendance.festStats(),
      });
    },
  });
}

/**
 * Search participants by name or email
 * GET /api/v1/volunteer/participants/search?query=...
 */
export function useSearchParticipants(query) {
  return useQuery({
    queryKey: queryKeys.attendance.participants(query),
    queryFn: async () => {
      const { data } = await apiClient.get("/volunteer/participants/search", {
        params: { query },
      });
      return (
        data?.data?.participants ||
        data?.participants ||
        (Array.isArray(data?.data) ? data.data : null) ||
        (Array.isArray(data) ? data : [])
      );
    },
    enabled: !!query && query.trim().length >= 2,
  });
}

/**
 * Detailed info for one participant (registrations, attendance history)
 * GET /api/v1/volunteer/participants/:userId
 */
export function useParticipantDetails(userId) {
  return useQuery({
    queryKey: queryKeys.attendance.participant(userId),
    queryFn: async () => {
      const { data } = await apiClient.get(`/volunteer/participants/${userId}`);
      return (
        data?.data?.participant ||
        data?.participant ||
        data?.data ||
        data ||
        null
      );
    },
    enabled: !!userId,
  });
}
