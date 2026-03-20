import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { queryKeys } from "@/src/lib/queryKeys";

export function usePublicCompetitionFormFields(competitionId) {
  return useQuery({
    queryKey: ["public", "competition-form-fields", competitionId],
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/registration/competition/${competitionId}/form-fields`,
      );

      const payload = data?.data;
      if (Array.isArray(payload)) {
        return { formId: null, fields: payload };
      }

      return {
        formId: payload?.formId || null,
        fields: Array.isArray(payload?.fields) ? payload.fields : [],
      };
    },
    enabled: !!competitionId,
  });
}

export function useUploadRegistrationImage() {
  return useMutation({
    mutationFn: async ({ competitionId, formId, fieldName, file }) => {
      const body = new FormData();
      body.append("image", file);
      body.append("fieldName", fieldName);

      const { data } = await apiClient.post(
        `/registration/competition/${competitionId}/form/${formId}/upload-image`,
        body,
      );

      return data?.data;
    },
  });
}

export function useRegisterSoloCompetition() {
  return useMutation({
    mutationFn: async ({ competitionId, formData = [] }) => {
      const { data } = await apiClient.post("/registration/solo", {
        competitionId,
        formData,
      });

      return data?.data || data;
    },
  });
}

export function useRegisterTeamCompetition() {
  return useMutation({
    mutationFn: async ({ competitionId, teamName, formData = [] }) => {
      const { data } = await apiClient.post("/registration/team", {
        competitionId,
        teamName,
        formData,
      });

      return data?.data || data;
    },
  });
}

export function useMyRegistrations(enabled = true) {
  return useQuery({
    queryKey: queryKeys.publicRegistrations.my(),
    queryFn: async () => {
      const { data } = await apiClient.get("/registration/my");
      return Array.isArray(data?.data) ? data.data : [];
    },
    enabled,
  });
}

export function useSendTeamInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, invitedEmail }) => {
      const { data } = await apiClient.post("/registration/team/invite", {
        teamId,
        invitedEmail,
      });

      return data?.data || data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.publicRegistrations.pendingInvites(),
      });

      if (variables?.teamId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.publicRegistrations.team(variables.teamId),
        });
      }
    },
  });
}

export function useAcceptTeamInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteToken) => {
      const { data } = await apiClient.post(
        `/registration/team/invite/${inviteToken}/accept`,
      );

      return data?.data || data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.publicRegistrations.my(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.publicRegistrations.pendingInvites(),
      });
    },
  });
}

export function useDeclineTeamInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteToken) => {
      const { data } = await apiClient.post(
        `/registration/team/invite/${inviteToken}/decline`,
      );

      return data?.data || data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.publicRegistrations.pendingInvites(),
      });
    },
  });
}

export function useTeamInvitePreview(inviteToken, enabled = true) {
  return useQuery({
    queryKey: queryKeys.publicRegistrations.invitePreview(inviteToken),
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/registration/team/invite/${inviteToken}`,
      );

      return data?.data || data;
    },
    enabled: Boolean(inviteToken) && enabled,
    retry: false,
  });
}

export function useSubmitTeamMemberForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, formData = [] }) => {
      const { data } = await apiClient.post(
        `/registration/team/${teamId}/member-form`,
        { formData },
      );

      return data?.data || data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.publicRegistrations.my(),
      });

      if (variables?.teamId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.publicRegistrations.team(variables.teamId),
        });
      }
    },
  });
}

export function usePendingTeamInvites(enabled = true) {
  return useQuery({
    queryKey: queryKeys.publicRegistrations.pendingInvites(),
    queryFn: async () => {
      const { data } = await apiClient.get("/registration/my/pending-invites");
      return Array.isArray(data?.data) ? data.data : [];
    },
    enabled,
  });
}

export function useTeamDetails(teamId, enabled = true) {
  return useQuery({
    queryKey: queryKeys.publicRegistrations.team(teamId),
    queryFn: async () => {
      const { data } = await apiClient.get(`/registration/team/${teamId}`);
      return data?.data || data;
    },
    enabled: Boolean(teamId) && enabled,
  });
}

export function useTransferTeamLeadership() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, newLeaderId }) => {
      const { data } = await apiClient.post(
        `/registration/team/transfer-leadership`,
        {
          teamId,
          newLeaderId,
        },
      );
      return data?.data || data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.publicRegistrations.my(),
      });

      if (variables?.teamId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.publicRegistrations.team(variables.teamId),
        });
      }
    },
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, memberId }) => {
      const { data } = await apiClient.delete(
        `/registration/team/${teamId}/member/${memberId}`,
      );
      return data?.data || data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.publicRegistrations.my(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.publicRegistrations.pendingInvites(),
      });

      if (variables?.teamId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.publicRegistrations.team(variables.teamId),
        });
      }
    },
  });
}

export function useRemovePendingTeamInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, inviteId }) => {
      const { data } = await apiClient.delete(
        `/registration/team/${teamId}/invite/${inviteId}`,
      );
      return data?.data || data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.publicRegistrations.my(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.publicRegistrations.pendingInvites(),
      });

      if (variables?.teamId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.publicRegistrations.team(variables.teamId),
        });
      }
    },
  });
}

export function useLeaveTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teamId) => {
      const { data } = await apiClient.delete(
        `/registration/team/${teamId}/leave`,
      );
      return data?.data || data;
    },
    onSuccess: (_, teamId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.publicRegistrations.my(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.publicRegistrations.pendingInvites(),
      });

      if (teamId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.publicRegistrations.team(teamId),
        });
      }
    },
  });
}
