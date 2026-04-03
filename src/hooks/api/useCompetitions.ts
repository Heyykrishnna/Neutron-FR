import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/queryKeys";
import apiClient from "@/lib/axios";

// Define types for competition data
interface Competition {
  id: string;
  name: string;
  [key: string]: any; // Extendable for additional fields
}

interface CompetitionFilters {
  [key: string]: any;
}

interface VenueCatalogSubVenue {
  name: string;
  floor?: string | null;
  capacity?: number | null;
}

interface VenueCatalogVenue {
  venueName: string;
  subVenues: VenueCatalogSubVenue[];
}

interface CompetitionVenueCatalog {
  venueNames: string[];
  venues: VenueCatalogVenue[];
}

const normalizeList = (data: any): Competition[] =>
  data?.data?.competitions ||
  data?.competitions ||
  (Array.isArray(data?.data) ? data.data : null) ||
  (Array.isArray(data) ? data : []);

const normalizeOne = (data: any): Competition | null =>
  data?.data?.competition || data?.competition || data?.data || data || null;

// Define types for mutation parameters
interface CancelOrPostponeParams {
  competitionId: string;
  status: string;
  autoNotify?: boolean;
  newDate?: string;
  notes?: string;
}

interface AssignJudgeParams {
  competitionId: string;
  judgeUserId: string;
  isHeadJudge?: boolean;
}

interface RemoveJudgeParams {
  judgeAssignmentId: string;
  competitionId: string;
}

interface AssignVolunteerParams {
  competitionId: string;
  volunteerUserId?: string;
  userId?: string;
  role: string;
}

interface RemoveVolunteerParams {
  volunteerAssignmentId: string;
  competitionId: string;
}

interface AssignClubParams {
  competitionId: string;
  clubId: string;
}

interface RemoveClubParams {
  competitionId: string;
  clubId: string;
}

interface AssignDepartmentParams {
  competitionId: string;
  departmentId: string;
}

interface RemoveDepartmentParams {
  competitionId: string;
  departmentId: string;
}

interface RequestPromoCodeApprovalParams {
  competitionId: string;
  promoCodes: string[];
}

/**
 * All competitions (public, no auth required but auth cookie sent)
 */
export function useCompetitions(filters: CompetitionFilters = {}) {
  return useQuery<Competition[]>({
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
export function useCompetition(competitionId: string) {
  return useQuery<Competition | null>({
    queryKey: queryKeys.competitions.detail(competitionId),
    queryFn: async () => {
      const { data } = await apiClient.get(`/competitions/${competitionId}`);
      return normalizeOne(data);
    },
    enabled: !!competitionId,
  });
}

/**
 * Canonical venue/sub-venue catalog for scoped dropdowns
 */
export function useCompetitionVenueCatalog(enabled: boolean = true) {
  return useQuery<CompetitionVenueCatalog>({
    queryKey: ["competitions", "venue-catalog"],
    queryFn: async () => {
      const { data } = await apiClient.get("/competitions/venue-catalog");
      const payload = data?.data || data || {};

      return {
        venueNames: Array.isArray(payload?.venueNames)
          ? payload.venueNames
          : [],
        venues: Array.isArray(payload?.venues) ? payload.venues : [],
      };
    },
    enabled,
  });
}

/**
 * Create competition (SA/DH)
 */
export function useCreateCompetition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Competition>) => {
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
    mutationFn: async ({
      competitionId,
      formData,
      ...rest
    }: {
      competitionId: string;
      formData?: FormData;
      [key: string]: any;
    }) => {
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
    mutationFn: async (competitionId: string) => {
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
    mutationFn: async ({
      competitionId,
      registrationsOpen,
    }: {
      competitionId: string;
      registrationsOpen: boolean;
    }) => {
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
    mutationFn: async ({
      competitionId,
      frozen,
    }: {
      competitionId: string;
      frozen: boolean;
    }) => {
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
    mutationFn: async ({
      competitionId,
      readOnly,
    }: {
      competitionId: string;
      readOnly: boolean;
    }) => {
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
    mutationFn: async (params: CancelOrPostponeParams) => {
      const { data } = await apiClient.patch(
        `/competitions/${params.competitionId}/cancel-postpone`,
        params,
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
export function useCompetitionJudges(competitionId: string) {
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
    mutationFn: async (params: AssignJudgeParams) => {
      const { data } = await apiClient.post(
        `/competitions/${params.competitionId}/judges`,
        params,
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
    mutationFn: async (params: RemoveJudgeParams) => {
      const { data } = await apiClient.delete(
        `/competitions/judges/${params.judgeAssignmentId}`,
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
export function useCompetitionVolunteers(competitionId: string) {
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
    mutationFn: async (params: AssignVolunteerParams) => {
      const resolvedVolunteerUserId = params.volunteerUserId ?? params.userId;
      const { data } = await apiClient.post(
        `/competitions/${params.competitionId}/volunteers`,
        { volunteerUserId: resolvedVolunteerUserId, role: params.role },
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
    mutationFn: async (params: RemoveVolunteerParams) => {
      const { data } = await apiClient.delete(
        `/competitions/volunteers/${params.volunteerAssignmentId}`,
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
export function useCompetitionClubs(competitionId: string) {
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
    mutationFn: async (params: AssignClubParams) => {
      const { data } = await apiClient.post(
        `/competitions/${params.competitionId}/clubs`,
        { clubId: params.clubId },
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
    mutationFn: async (params: RemoveClubParams) => {
      const { data } = await apiClient.delete(
        `/competitions/${params.competitionId}/clubs/${params.clubId}`,
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
export function useCompetitionDepartments(competitionId: string) {
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
    mutationFn: async (params: AssignDepartmentParams) => {
      const { data } = await apiClient.post(
        `/competitions/${params.competitionId}/departments`,
        { departmentId: params.departmentId },
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
    mutationFn: async (params: RemoveDepartmentParams) => {
      const { data } = await apiClient.delete(
        `/competitions/${params.competitionId}/departments/${params.departmentId}`,
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
 * Request promo code approval / direct apply (SA/DH)
 */
export function useRequestPromoCodeApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: RequestPromoCodeApprovalParams) => {
      const { data } = await apiClient.post(
        `/competitions/${params.competitionId}/request-promo-code-approval`,
        { promoCodes: params.promoCodes },
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.approvals.list({}),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.competitions.detail(variables.competitionId),
      });
    },
  });
}
