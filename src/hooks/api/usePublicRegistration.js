import { useMutation, useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axios";

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
    queryKey: ["public", "my-registrations"],
    queryFn: async () => {
      const { data } = await apiClient.get("/registration/my");
      return Array.isArray(data?.data) ? data.data : [];
    },
    enabled,
  });
}

export function useSendTeamInvite() {
  return useMutation({
    mutationFn: async ({ teamId, invitedEmail }) => {
      const { data } = await apiClient.post("/registration/team/invite", {
        teamId,
        invitedEmail,
      });

      return data?.data || data;
    },
  });
}
