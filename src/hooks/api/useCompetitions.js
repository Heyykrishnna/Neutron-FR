import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/queryKeys";
import apiClient from "@/lib/axios";

const normalizeList = (data) =>
  data?.data?.competitions ||
  data?.competitions ||
  (Array.isArray(data?.data) ? data.data : null) ||
  (Array.isArray(data) ? data : []);

const normalizeOne = (data) =>
  data?.data?.competition || data?.competition || data?.data || data || null;

/**
 * All competitions (public, no auth required but auth cookie sent)
 */
export function useCompetitions(filters = {}) {
  return useQuery({
    queryKey: queryKeys.competitions.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get("/competitions", {
        params: filters,
      });
      return normalizeList(data);
    },
  });
}

/**
 * Single competition
 */
export function useCompetition(competitionId) {
  return useQuery({
    queryKey: queryKeys.competitions.detail(competitionId),
    queryFn: async () => {
      const { data } = await apiClient.get(`/competitions/${competitionId}`);
      return normalizeOne(data);
    },
    enabled: !!competitionId,
  });
}

/**
 * Create competition (SA/DH)
 */
export function useCreateCompetition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post("/competitions", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.competitions.all });
    },
  });
}

/**
 * Update competition (SA/DH)
 */
export function useUpdateCompetition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ competitionId, formData, ...rest }) => {
      // Accept either a FormData instance (for file uploads) or a plain object
      const body = formData instanceof FormData ? formData : rest;
      const { data } = await apiClient.put(
        `/competitions/${competitionId}`,
        body,
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.competitions.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.competitions.detail(variables.competitionId),
      });
    },
  });
}

/**
 * Delete competition (SA/DH)
 */
export function useDeleteCompetition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (competitionId) => {
      const { data } = await apiClient.delete(`/competitions/${competitionId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.competitions.all });
    },
  });
}

/**
 * Toggle registrations open/closed (SA/DH)
 */
export function useToggleRegistrations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ competitionId, registrationsOpen }) => {
      const { data } = await apiClient.patch(
        `/competitions/${competitionId}/toggle-registrations`,
        { registrationsOpen },
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.competitions.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.competitions.detail(variables.competitionId),
      });
    },
  });
}

/**
 * Freeze/unfreeze changes (SA/DH)
 */
export function useFreezeChanges() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ competitionId, frozen }) => {
      const { data } = await apiClient.patch(
        `/competitions/${competitionId}/freeze-changes`,
        { frozen },
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.competitions.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.competitions.detail(variables.competitionId),
      });
    },
  });
}

/**
 * Toggle read-only mode (SA/DH)
 */
export function useToggleReadOnlyMode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ competitionId, readOnly }) => {
      const { data } = await apiClient.patch(
        `/competitions/${competitionId}/read-only-mode`,
        { readOnly },
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.competitions.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.competitions.detail(variables.competitionId),
      });
    },
  });
}

/**
 * Cancel or postpone competition with optional email (SA/DH)
 */
export function useCancelOrPostpone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      competitionId,
      status,
      autoNotify = false,
      newDate,
      notes,
    }) => {
      const { data } = await apiClient.patch(
        `/competitions/${competitionId}/cancel-postpone`,
        { status, autoNotify, newDate, notes },
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.competitions.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.competitions.detail(variables.competitionId),
      });
    },
  });
}

/**
 * Get judges for a competition
 */
export function useCompetitionJudges(competitionId) {
  return useQuery({
    queryKey: queryKeys.competitions.judges(competitionId),
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/competitions/${competitionId}/judges`,
      );
      return (
        data?.data?.judges ||
        data?.judges ||
        (Array.isArray(data?.data) ? data.data : null) ||
        (Array.isArray(data) ? data : [])
      );
    },
    enabled: !!competitionId,
  });
}

/**
 * Assign judge to competition (SA/DH)
 */
export function useAssignJudge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ competitionId, judgeUserId, isHeadJudge = false }) => {
      const { data } = await apiClient.post(
        `/competitions/${competitionId}/judges`,
        { judgeUserId, isHeadJudge },
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.competitions.judges(variables.competitionId),
      });
    },
  });
}

/**
 * Remove judge from competition (SA/DH)
 */
export function useRemoveJudge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ judgeAssignmentId, competitionId }) => {
      const { data } = await apiClient.delete(
        `/competitions/judges/${judgeAssignmentId}`,
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.competitions.judges(variables.competitionId),
      });
    },
  });
}

/**
 * Get volunteers for a competition
 */
export function useCompetitionVolunteers(competitionId) {
  return useQuery({
    queryKey: queryKeys.competitions.volunteers(competitionId),
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/competitions/${competitionId}/volunteers`,
      );
      return (
        data?.data?.volunteers ||
        data?.volunteers ||
        (Array.isArray(data?.data) ? data.data : null) ||
        (Array.isArray(data) ? data : [])
      );
    },
    enabled: !!competitionId,
  });
}

/**
 * Assign volunteer to competition (SA/DH)
 */
export function useAssignVolunteer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ competitionId, volunteerUserId, userId, role }) => {
      const resolvedVolunteerUserId = volunteerUserId ?? userId;
      const { data } = await apiClient.post(
        `/competitions/${competitionId}/volunteers`,
        { volunteerUserId: resolvedVolunteerUserId, role },
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.competitions.volunteers(variables.competitionId),
      });
    },
  });
}

/**
 * Remove volunteer from competition (SA/DH)
 */
export function useRemoveVolunteer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ volunteerAssignmentId, competitionId }) => {
      const { data } = await apiClient.delete(
        `/competitions/volunteers/${volunteerAssignmentId}`,
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.competitions.volunteers(variables.competitionId),
      });
    },
  });
}

/**
 * Get clubs assigned to a competition
 */
export function useCompetitionClubs(competitionId) {
  return useQuery({
    queryKey: ["competitions", competitionId, "clubs"],
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/competitions/${competitionId}/clubs`,
      );
      return data?.data?.clubs || [];
    },
    enabled: !!competitionId,
  });
}

/**
 * Assign a club to a competition (SA/DH)
 */
export function useAssignClubToCompetition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ competitionId, clubId }) => {
      const { data } = await apiClient.post(
        `/competitions/${competitionId}/clubs`,
        { clubId },
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["competitions", variables.competitionId, "clubs"],
      });
    },
  });
}

/**
 * Remove a club from a competition (SA/DH)
 */
export function useRemoveClubFromCompetition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ competitionId, clubId }) => {
      const { data } = await apiClient.delete(
        `/competitions/${competitionId}/clubs/${clubId}`,
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["competitions", variables.competitionId, "clubs"],
      });
    },
  });
}

/**
 * Get departments assigned to a competition (SA)
 */
export function useCompetitionDepartments(competitionId) {
  return useQuery({
    queryKey: ["competitions", competitionId, "departments"],
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/competitions/${competitionId}/departments`,
      );
      return data?.data?.departments || [];
    },
    enabled: !!competitionId,
  });
}

/**
 * Assign a department to a competition (SA)
 */
export function useAssignDepartmentToCompetition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ competitionId, departmentId }) => {
      const { data } = await apiClient.post(
        `/competitions/${competitionId}/departments`,
        { departmentId },
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["competitions", variables.competitionId, "departments"],
      });
    },
  });
}

/**
 * Remove a department from a competition (SA)
 */
export function useRemoveDepartmentFromCompetition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ competitionId, departmentId }) => {
      const { data } = await apiClient.delete(
        `/competitions/${competitionId}/departments/${departmentId}`,
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["competitions", variables.competitionId, "departments"],
      });
    },
  });
}

/**
 * Request promo code approval (DH only)
 */
export function useRequestPromoCodeApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ competitionId, promoCodes }) => {
      const { data } = await apiClient.post(
        `/competitions/${competitionId}/request-promo-code-approval`,
        { promoCodes },
      );
      return data?.data || data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.approvals.list(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.competitions.detail(variables.competitionId),
      });
    },
  });
}
