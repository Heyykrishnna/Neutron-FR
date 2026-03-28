/**
 * Judges who haven't submitted scores yet (Head Judge / DH)
 * GET /api/v1/judging/rounds/:roundId/pending-judges
 */
export function usePendingJudges(roundId:string) {
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
export function useRoundLeaderboard(roundId:string) {
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
export function useAllScored(roundId:string) {
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
 * Send lock request to SA for a round (Head Judge / DH)
 * POST /api/v1/judging/rounds/:roundId/lock-request
 */
export function useSendLockRequest() {
  return useMutation({
    mutationFn: async (roundId:string) => {
      const { data } = await apiClient.post(
        `/judging/rounds/${roundId}/lock-request`,
      );
      return data;
    },
  });
}

/**
 * Admin: All rounds for a competition (no judge-assignment check)
 * GET /api/v1/judging/admin/competitions/:competitionId/rounds
 */
export function useAdminCompetitionRounds(competitionId:string) {
  return useQuery({
    queryKey: queryKeys.judging.adminRounds(competitionId),
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/judging/admin/competitions/${competitionId}/rounds`,
      );
      return (
        (Array.isArray(data?.data) ? data.data : null) ||
        (Array.isArray(data) ? data : [])
      );
    },
    enabled: !!competitionId,
  });
}

/**
 * Admin: Approved teams for a competition with prevRoundStatus
 * GET /api/v1/judging/admin/competitions/:competitionId/teams
 */
export function useAdminCompetitionTeams(competitionId:string) {
  return useQuery({
    queryKey: queryKeys.judging.adminTeams(competitionId),
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/judging/admin/competitions/${competitionId}/teams`,
      );
      return (
        (Array.isArray(data?.data) ? data.data : null) ||
        (Array.isArray(data) ? data : [])
      );
    },
    enabled: !!competitionId,
  });
}

/**
 * Admin: All teams in a round with scores and qualification status
 * GET /api/v1/judging/admin/rounds/:roundId/teams
 */
export function useAdminRoundTeams(roundId:string) {
  return useQuery({
    queryKey: queryKeys.judging.adminRoundTeams(roundId),
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/judging/admin/rounds/${roundId}/teams`,
      );
      return data?.data || data || null;
    },
    enabled: !!roundId,
  });
}

/**
 * Score details for a team by the current judge (pre-fills scoring form)
 * GET /api/v1/judging/rounds/:roundId/teams/:teamId/score-details
 */
export function useTeamScoreDetails(roundId:string, teamId:string) {
  return useQuery({
    queryKey: queryKeys.judging.teamScoreDetails(roundId, teamId),
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/judging/rounds/${roundId}/teams/${teamId}/score-details`,
      );
      return data?.data || data || null;
    },
    enabled: !!roundId && !!teamId,
  });
}


/**
 * Pending lock requests awaiting SA approval
 * GET /api/v1/judging/lock-requests/pending
 */
export function usePendingLockRequests() {
  return useQuery({
    queryKey: queryKeys.judging.pendingLockRequests(),
    queryFn: async () => {
      const { data } = await apiClient.get("/judging/lock-requests/pending");
      return (
        data?.data?.requests ||
        data?.requests ||
        (Array.isArray(data?.data) ? data.data : null) ||
        (Array.isArray(data) ? data : [])
      );
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/queryKeys";
import apiClient from "@/lib/axios";

// Define types for judging data
interface Competition {
  id: string;
  name: string;
  [key: string]: any;
}

interface Round {
  id: string;
  name: string;
  [key: string]: any;
}

interface Participant {
  id: string;
  name: string;
  [key: string]: any;
}

interface Criteria {
  id: string;
  name: string;
  weight: number;
  maxScore: number;
  [key: string]: any;
}

interface LockRequest {
  id: string;
  status: string;
  [key: string]: any;
}

interface Team {
  id: string;
  name: string;
  [key: string]: any;
}

interface MarkTeamQualificationParams {
  roundId: string;
  teamId: string;
  status: string;
  notes?: string;
}

interface CreateJudgingCriteriaParams {
  roundId: string;
  name: string;
  weight: number;
  description?: string;
  maxScore: number;
}

interface CreateRoundParams {
  competitionId: string;
  name: string;
  teamIds: string[];
}

interface SubmitCriteriaScoreParams {
  roundId: string;
  teamId: string;
  criteriaId: string;
  score: number;
}

interface AddEvaluationNotesParams {
  roundId: string;
  teamId: string;
  notes: string;
}

interface SubmitFinalScoreParams {
  roundId: string;
  teamId: string;
}

interface ReviewLockRequestParams {
  requestId: string;
  status: string;
  reviewNotes?: string;
}

// Update all hooks with appropriate types
export function useMyJudgingCompetitions() {
  return useQuery<Competition[]>({
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

export function useCompetitionRounds(competitionId: string) {
  return useQuery<Round[]>({
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

export function useRoundParticipants(roundId: string) {
  return useQuery<Participant[]>({
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

export function useJudgingCriteria(roundId: string) {
  return useQuery<Criteria[]>({
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

export function useMarkTeamQualification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: MarkTeamQualificationParams) => {
      const { data } = await apiClient.post(
        `/judging/rounds/${params.roundId}/teams/${params.teamId}/qualification`,
        { status: params.status, notes: params.notes },
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

export function useCreateJudgingCriteria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: CreateJudgingCriteriaParams) => {
      const { data } = await apiClient.post(
        `/judging/rounds/${params.roundId}/criteria`,
        params,
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

export function useCreateRound() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: CreateRoundParams) => {
      const { data } = await apiClient.post(
        `/judging/admin/competitions/${params.competitionId}/rounds`,
        params,
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.judging.adminRounds(variables.competitionId),
      });
    },
  });
}

export function useSubmitCriteriaScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: SubmitCriteriaScoreParams) => {
      const { data } = await apiClient.post(
        `/judging/rounds/${params.roundId}/teams/${params.teamId}/criteria/${params.criteriaId}/score`,
        { score: params.score },
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.judging.teamScoreDetails(
          variables.roundId,
          variables.teamId,
        ),
      });
    },
  });
}

export function useAddEvaluationNotes() {
  return useMutation({
    mutationFn: async (params: AddEvaluationNotesParams) => {
      const { data } = await apiClient.post(
        `/judging/rounds/${params.roundId}/teams/${params.teamId}/notes`,
        { notes: params.notes },
      );
      return data;
    },
  });
}

export function useSubmitFinalScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: SubmitFinalScoreParams) => {
      const { data } = await apiClient.post(
        `/judging/rounds/${params.roundId}/teams/${params.teamId}/submit`,
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
      queryClient.invalidateQueries({
        queryKey: queryKeys.judging.allScored(variables.roundId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.judging.teamScoreDetails(
          variables.roundId,
          variables.teamId,
        ),
      });
    },
  });
}

export function useReviewLockRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: ReviewLockRequestParams) => {
      const { data } = await apiClient.post(
        `/judging/lock-requests/${params.requestId}/review`,
        params,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.judging.pendingLockRequests(),
      });
    },
  });
}
