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

export function useTeamInvitePreview(inviteToken: string, enabled = true) {
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

export function useTeamDetails(teamId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.publicRegistrations.team(teamId),
    queryFn: async () => {
      const { data } = await apiClient.get(`/registration/team/${teamId}`);
      return data?.data || data;
    },
    enabled: Boolean(teamId) && enabled,
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

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { queryKeys } from "@/src/lib/queryKeys";

// Define types for public registration data
interface FormField {
  id: string;
  name: string;
  type: string;
  [key: string]: any;
}

interface CompetitionFormFields {
  formId: string | null;
  fields: FormField[];
}

interface UploadImageParams {
  competitionId: string;
  formId: string;
  fieldName: string;
  file: File;
}

interface RegisterSoloParams {
  competitionId: string;
  formData?: any[];
  promoCode?: string | null;
}

interface RegisterTeamParams {
  competitionId: string;
  teamName: string;
  formData?: any[];
  promoCode?: string | null;
  referralCode?: string | null;
}

interface TeamInviteParams {
  teamId: string;
  invitedEmail: string;
}

interface AcceptInviteParams {
  inviteToken: string;
}

interface DeclineInviteParams {
  inviteToken: string;
}

interface SubmitTeamMemberFormParams {
  teamId: string;
  formData?: any[];
}

interface TransferLeadershipParams {
  teamId: string;
  newLeaderId: string;
}

interface RemoveTeamMemberParams {
  teamId: string;
  memberId: string;
}

interface RemovePendingInviteParams {
  teamId: string;
  inviteId: string;
}

// Update all hooks with appropriate types
export function usePublicCompetitionFormFields(competitionId: string) {
  return useQuery<CompetitionFormFields>({
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
    mutationFn: async (params: UploadImageParams) => {
      const body = new FormData();
      body.append("image", params.file);
      body.append("fieldName", params.fieldName);

      const { data } = await apiClient.post(
        `/registration/competition/${params.competitionId}/form/${params.formId}/upload-image`,
        body,
      );

      return data?.data;
    },
  });
}

export function useRegisterSoloCompetition() {
  return useMutation({
    mutationFn: async (params: RegisterSoloParams) => {
      const { data } = await apiClient.post("/registration/solo", params);
      return data?.data || data;
    },
  });
}

export function useRegisterTeamCompetition() {
  return useMutation({
    mutationFn: async (params: RegisterTeamParams) => {
      const { data } = await apiClient.post("/registration/team", params);
      return data?.data || data;
    },
  });
}

export function useSendTeamInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: TeamInviteParams) => {
      const { data } = await apiClient.post(
        "/registration/team/invite",
        params,
      );
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
    mutationFn: async (params: AcceptInviteParams) => {
      const { data } = await apiClient.post(
        `/registration/team/invite/${params.inviteToken}/accept`,
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
    mutationFn: async (params: DeclineInviteParams) => {
      const { data } = await apiClient.post(
        `/registration/team/invite/${params.inviteToken}/decline`,
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

export function useSubmitTeamMemberForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SubmitTeamMemberFormParams) => {
      const { data } = await apiClient.post(
        `/registration/team/${params.teamId}/member-form`,
        { formData: params.formData },
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

export function useTransferTeamLeadership() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: TransferLeadershipParams) => {
      const { data } = await apiClient.post(
        `/registration/team/transfer-leadership`,
        params,
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
    mutationFn: async (params: RemoveTeamMemberParams) => {
      const { data } = await apiClient.delete(
        `/registration/team/${params.teamId}/member/${params.memberId}`,
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
    mutationFn: async (params: RemovePendingInviteParams) => {
      const { data } = await apiClient.delete(
        `/registration/team/${params.teamId}/invite/${params.inviteId}`,
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
    mutationFn: async (teamId: string) => {
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
