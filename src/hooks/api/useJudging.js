import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/queryKeys";
import apiClient from "@/lib/axios";

/**
 * Competitions assigned to DH as a judge
 * GET /api/v1/judging/my-competitions
 */
export function useMyJudgingCompetitions() {
  return useQuery({
    queryKey: queryKeys.judging.myCompetitions(),
    queryFn: async () => {
      const { data } = await apiClient.get("/judging/my-competitions");
      return (
        data?.data?.competitions ||
        data?.competitions ||
        (Array.isArray(data?.data) ? data.data : null) ||
        (Array.isArray(data) ? data : [])
      );
    },
  });
}

/**
 * All rounds for a competition
 * GET /api/v1/judging/competitions/:competitionId/rounds
 */
export function useCompetitionRounds(competitionId) {
  return useQuery({
    queryKey: queryKeys.judging.rounds(competitionId),
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/judging/competitions/${competitionId}/rounds`,
      );
      return (
        data?.data?.rounds ||
        data?.rounds ||
        (Array.isArray(data?.data) ? data.data : null) ||
        (Array.isArray(data) ? data : [])
      );
    },
    enabled: !!competitionId,
  });
}

/**
 * Participants for a round
 * GET /api/v1/judging/rounds/:roundId/participants
 */
export function useRoundParticipants(roundId) {
  return useQuery({
    queryKey: queryKeys.judging.participants(roundId),
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/judging/rounds/${roundId}/participants`,
      );
      return (
        data?.data?.participants ||
        data?.participants ||
        (Array.isArray(data?.data) ? data.data : null) ||
        (Array.isArray(data) ? data : [])
      );
    },
    enabled: !!roundId,
  });
}

/**
 * Judging criteria for a round
 * GET /api/v1/judging/rounds/:roundId/criteria
 */
export function useJudgingCriteria(roundId) {
  return useQuery({
    queryKey: queryKeys.judging.criteria(roundId),
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/judging/rounds/${roundId}/criteria`,
      );
      return (
        data?.data?.criteria ||
        data?.criteria ||
        (Array.isArray(data?.data) ? data.data : null) ||
        (Array.isArray(data) ? data : [])
      );
    },
    enabled: !!roundId,
  });
}

/**
 * Judges who haven't submitted scores yet (Head Judge / DH)
 * GET /api/v1/judging/rounds/:roundId/pending-judges
 */
export function usePendingJudges(roundId) {
  return useQuery({
    queryKey: queryKeys.judging.pendingJudges(roundId),
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/judging/rounds/${roundId}/pending-judges`,
      );
      return (
        data?.data?.judges ||
        data?.judges ||
        (Array.isArray(data?.data) ? data.data : null) ||
        (Array.isArray(data) ? data : [])
      );
    },
    enabled: !!roundId,
  });
}

/**
 * Leaderboard for a round
 * GET /api/v1/judging/rounds/:roundId/leaderboard
 */
export function useRoundLeaderboard(roundId) {
  return useQuery({
    queryKey: queryKeys.judging.leaderboard(roundId),
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/judging/rounds/${roundId}/leaderboard`,
      );
      return (
        data?.data?.leaderboard ||
        data?.leaderboard ||
        (Array.isArray(data?.data) ? data.data : null) ||
        (Array.isArray(data) ? data : [])
      );
    },
    enabled: !!roundId,
  });
}

/**
 * Whether all judges have submitted scores for a round
 * GET /api/v1/judging/rounds/:roundId/all-scored
 */
export function useAllScored(roundId) {
  return useQuery({
    queryKey: queryKeys.judging.allScored(roundId),
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/judging/rounds/${roundId}/all-scored`,
      );
      return data?.data?.allScored ?? data?.allScored ?? false;
    },
    enabled: !!roundId,
  });
}

/**
 * Mark a team as qualified/eliminated (Head Judge / DH)
 * POST /api/v1/judging/rounds/:roundId/teams/:teamId/qualification
 */
export function useMarkTeamQualification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ roundId, teamId, status, notes }) => {
      const { data } = await apiClient.post(
        `/judging/rounds/${roundId}/teams/${teamId}/qualification`,
        { status, notes },
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.judging.participants(variables.roundId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.judging.leaderboard(variables.roundId),
      });
    },
  });
}

/**
 * Send lock request to SA for a round (Head Judge / DH)
 * POST /api/v1/judging/rounds/:roundId/lock-request
 */
export function useSendLockRequest() {
  return useMutation({
    mutationFn: async (roundId) => {
      const { data } = await apiClient.post(
        `/judging/rounds/${roundId}/lock-request`,
      );
      return data;
    },
  });
}

/**
 * Create judging criteria for a round (Head Judge / DH)
 * POST /api/v1/judging/rounds/:roundId/criteria
 */
export function useCreateJudgingCriteria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ roundId, name, weight, description, maxScore }) => {
      const { data } = await apiClient.post(
        `/judging/rounds/${roundId}/criteria`,
        { name, weight, description, maxScore },
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.judging.criteria(variables.roundId),
      });
    },
  });
}
