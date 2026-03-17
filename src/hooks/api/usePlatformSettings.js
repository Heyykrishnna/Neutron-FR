import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { queryKeys } from "@/src/lib/queryKeys";

export function usePlatformSettingsSummary() {
  return useQuery({
    queryKey: queryKeys.settings.system(),
    queryFn: async () => {
      const { data } = await apiClient.get("/sa/platform-settings");
      return data?.data;
    },
  });
}

export function useEmailTemplates() {
  return useQuery({
    queryKey: [...queryKeys.settings.all, "email-templates"],
    queryFn: async () => {
      const { data } = await apiClient.get(
        "/sa/platform-settings/email-templates",
      );
      return data?.data?.templates || [];
    },
  });
}

export function useEmailTemplate(templateKey) {
  return useQuery({
    queryKey: [...queryKeys.settings.all, "email-templates", templateKey],
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/sa/platform-settings/email-templates/${templateKey}`,
      );
      return data?.data?.template;
    },
    enabled: !!templateKey,
  });
}

export function useFreezeAllChanges() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (frozen) => {
      const { data } = await apiClient.patch("/sa/platform-settings/freeze", {
        frozen,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.competitions.all });
    },
  });
}

export function usePauseAllRegistrations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paused) => {
      const { data } = await apiClient.patch(
        "/sa/platform-settings/registrations",
        {
          paused,
        },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.competitions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.registrations.all });
    },
  });
}

export function useTriggerDbBackup() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post("/sa/platform-settings/backup");
      return data?.data;
    },
  });
}

export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateKey, subject, html }) => {
      const { data } = await apiClient.put(
        `/sa/platform-settings/email-templates/${templateKey}`,
        {
          subject,
          html,
        },
      );
      return data?.data?.template;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
      queryClient.invalidateQueries({
        queryKey: [
          ...queryKeys.settings.all,
          "email-templates",
          variables.templateKey,
        ],
      });
    },
  });
}

export function useResetEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateKey) => {
      const { data } = await apiClient.delete(
        `/sa/platform-settings/email-templates/${templateKey}`,
      );
      return data?.data?.template;
    },
    onSuccess: (_, templateKey) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.settings.all, "email-templates", templateKey],
      });
    },
  });
}
