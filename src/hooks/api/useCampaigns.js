import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { queryKeys } from "@/src/lib/queryKeys";

const buildCampaignPayload = (payload = {}) => {
  const {
    csvFile,
    audienceQuery,
    name,
    subject,
    templateHtml,
    audienceType,
    scheduledAt,
  } = payload;

  if (audienceType === "CSV" && csvFile) {
    const formData = new FormData();
    formData.append("name", name || "");
    formData.append("subject", subject || "");
    formData.append("templateHtml", templateHtml || "");
    formData.append("audienceType", audienceType || "CSV");
    formData.append("audienceQuery", JSON.stringify(audienceQuery || {}));

    if (scheduledAt) {
      formData.append("scheduledAt", scheduledAt);
    }

    formData.append("csvFile", csvFile);

    return formData;
  }

  return {
    name,
    subject,
    templateHtml,
    audienceType,
    audienceQuery: audienceQuery || {},
    scheduledAt: scheduledAt || null,
  };
};

export function useCampaignMetadata() {
  return useQuery({
    queryKey: queryKeys.campaigns.metadata(),
    queryFn: async () => {
      const { data } = await apiClient.get("/sa/campaigns/metadata");
      return data?.data || { allowedVariables: [], audienceTypes: [] };
    },
  });
}

export function useCampaigns(filters = {}) {
  return useQuery({
    queryKey: queryKeys.campaigns.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get("/sa/campaigns", {
        params: filters,
      });
      return data?.data || { campaigns: [], pagination: null };
    },
  });
}

export function useCampaignDetail(campaignId) {
  return useQuery({
    queryKey: queryKeys.campaigns.detail(campaignId),
    queryFn: async () => {
      const { data } = await apiClient.get(`/sa/campaigns/${campaignId}`);
      return data?.data;
    },
    enabled: !!campaignId,
  });
}

export function useCampaignRecipients(campaignId, filters = {}) {
  return useQuery({
    queryKey: queryKeys.campaigns.recipients(campaignId, filters),
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/sa/campaigns/${campaignId}/recipients`,
        {
          params: filters,
        },
      );
      return data?.data || { recipients: [], pagination: null };
    },
    enabled: !!campaignId,
  });
}

export function usePreviewCampaignTemplate() {
  return useMutation({
    mutationFn: async ({ templateHtml, sampleData }) => {
      const { data } = await apiClient.post("/sa/campaigns/preview", {
        templateHtml,
        sampleData,
      });
      return data?.data?.preview;
    },
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const body = buildCampaignPayload(payload);
      const { data } = await apiClient.post("/sa/campaigns", body);
      return data?.data?.campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
    },
  });
}

export function useUpdateCampaignTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ campaignId, ...payload }) => {
      const { data } = await apiClient.patch(`/sa/campaigns/${campaignId}`, {
        ...payload,
      });
      return data?.data?.campaign;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.campaigns.detail(variables.campaignId),
      });
    },
  });
}

export function useUpdateCampaignAudience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      campaignId,
      audienceType,
      audienceQuery,
      csvFile,
    }) => {
      const body =
        audienceType === "CSV" && csvFile
          ? (() => {
              const formData = new FormData();
              formData.append("audienceType", audienceType);
              formData.append(
                "audienceQuery",
                JSON.stringify(audienceQuery || {}),
              );
              formData.append("csvFile", csvFile);
              return formData;
            })()
          : {
              audienceType,
              audienceQuery: audienceQuery || {},
            };

      const { data } = await apiClient.patch(
        `/sa/campaigns/${campaignId}/audience`,
        body,
      );

      return data?.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.campaigns.detail(variables.campaignId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.campaigns.recipients(variables.campaignId),
      });
    },
  });
}

export function useScheduleCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ campaignId, scheduledAt }) => {
      const { data } = await apiClient.post(
        `/sa/campaigns/${campaignId}/schedule`,
        {
          scheduledAt,
        },
      );
      return data?.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.campaigns.detail(variables.campaignId),
      });
    },
  });
}

export function useSendCampaignNow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignId) => {
      const { data } = await apiClient.post(`/sa/campaigns/${campaignId}/send`);
      return data?.data;
    },
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.campaigns.detail(campaignId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.campaigns.recipients(campaignId),
      });
    },
  });
}

export function useRetryFailedCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignId) => {
      const { data } = await apiClient.post(
        `/sa/campaigns/${campaignId}/retry-failed`,
      );
      return data?.data;
    },
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.campaigns.detail(campaignId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.campaigns.recipients(campaignId),
      });
    },
  });
}

export function useRerunCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignId) => {
      const { data } = await apiClient.post(
        `/sa/campaigns/${campaignId}/rerun`,
      );
      return data?.data;
    },
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.campaigns.detail(campaignId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.campaigns.recipients(campaignId),
      });
    },
  });
}

export function useCancelCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignId) => {
      const { data } = await apiClient.post(
        `/sa/campaigns/${campaignId}/cancel`,
      );
      return data?.data;
    },
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.campaigns.detail(campaignId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.campaigns.recipients(campaignId),
      });
    },
  });
}
