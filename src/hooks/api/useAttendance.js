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
 * Mark fest attendance
 * POST /api/v1/volunteer/attendance/fest
 */
export function useMarkFestAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, qrData }) => {
      const { data } = await apiClient.post("/volunteer/attendance/fest", {
        ...(userId ? { userId } : {}),
        ...(qrData ? { qrData } : {}),
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.attendance.festStats(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.attendance.participants(""),
        exact: false,
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

/**
 * Verify QR payload
 * POST /api/v1/qr/verify
 */
export function useVerifyQRCode() {
  return useMutation({
    mutationFn: async ({ qrData }) => {
      const { data } = await apiClient.post("/qr/verify", { qrData });
      return data?.data || data;
    },
  });
}

/**
 * Get volunteer profile/permissions for attendance actions
 * GET /api/v1/volunteer/my-events
 */
export function useVolunteerAttendanceProfile() {
  return useQuery({
    queryKey: queryKeys.attendance.volunteerProfile(),
    queryFn: async () => {
      const { data } = await apiClient.get("/volunteer/my-events");
      return data?.data || null;
    },
  });
}

/**
 * Search participants filtered by competition
 * GET /api/v1/volunteer/participants/search?query=...&competitionId=...
 */
export function useSearchParticipantsWithComp(query, competitionId = null) {
  return useQuery({
    queryKey: [...queryKeys.attendance.participants(query), competitionId],
    queryFn: async () => {
      const { data } = await apiClient.get("/volunteer/participants/search", {
        params: { query, ...(competitionId ? { competitionId } : {}) },
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
 * SA: list registration desk (gate) volunteers
 * GET /api/v1/volunteer/registration-desk
 */
export function useRegistrationDeskVolunteers() {
  return useQuery({
    queryKey: queryKeys.attendance.registrationDeskVolunteers(),
    queryFn: async () => {
      const { data } = await apiClient.get("/volunteer/registration-desk");
      return (
        data?.data?.volunteers ||
        data?.volunteers ||
        (Array.isArray(data?.data) ? data.data : null) ||
        (Array.isArray(data) ? data : [])
      );
    },
  });
}

/**
 * SA: assign a registration desk volunteer
 * POST /api/v1/volunteer/registration-desk/assign
 */
export function useAssignRegistrationDeskVolunteer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }) => {
      const { data } = await apiClient.post(
        "/volunteer/registration-desk/assign",
        {
          userId,
        },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.attendance.registrationDeskVolunteers(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.attendance.volunteerProfile(),
      });
    },
  });
}

/**
 * SA: remove a registration desk volunteer assignment
 * DELETE /api/v1/volunteer/registration-desk/:volunteerId
 */
export function useRemoveRegistrationDeskVolunteer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ volunteerId }) => {
      const { data } = await apiClient.delete(
        `/volunteer/registration-desk/${volunteerId}`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.attendance.registrationDeskVolunteers(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.attendance.volunteerProfile(),
      });
    },
  });
}
