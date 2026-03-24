import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/queryKeys";
import apiClient from "@/lib/axios";

const normalizeClub = (club) => ({
  ...club,
  membersCount:
    club?.membersCount ??
    club?.memberCount ??
    club?.members_count ??
    (Array.isArray(club?.members) ? club.members.length : 0),
});

export function useClubs(filters = {}) {
  return useQuery({
    queryKey: queryKeys.clubs.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get("/sa/clubs", { params: filters });
      const clubs = data?.data?.clubs || data?.clubs || [];
      return clubs.map(normalizeClub);
    },
  });
}

export function useClub(clubId) {
  return useQuery({
    queryKey: queryKeys.clubs.detail(clubId),
    queryFn: async () => {
      const { data } = await apiClient.get(`/sa/clubs/${clubId}`);
      const club = data?.data?.club || data?.club;
      return club ? normalizeClub(club) : club;
    },
    enabled: !!clubId,
  });
}

export function useCreateClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clubData) => {
      const { data } = await apiClient.post("/sa/clubs", clubData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs.all });
    },
  });
}

export function useUpdateClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clubId, ...updateData }) => {
      const { data } = await apiClient.put(`/sa/clubs/${clubId}`, updateData);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.clubs.detail(variables.clubId),
      });
    },
  });
}

export function useDeleteClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clubId) => {
      const { data } = await apiClient.delete(`/sa/clubs/${clubId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs.all });
    },
  });
}

export function useAssignUserToClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clubId, userId, role = "MEMBER" }) => {
      const { data } = await apiClient.post(`/sa/clubs/${clubId}/members`, {
        userId,
        role,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.clubs.detail(variables.clubId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs.all });
    },
  });
}

export function useRemoveUserFromClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clubId, userId }) => {
      await apiClient.delete(`/sa/clubs/${clubId}/members/${userId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.clubs.detail(variables.clubId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs.all });
    },
  });
}
