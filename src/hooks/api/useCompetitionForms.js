import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { queryKeys } from "@/src/lib/queryKeys";

const normalizeList = (data) =>
  data?.data?.forms ||
  data?.forms ||
  (Array.isArray(data?.data) ? data.data : null) ||
  (Array.isArray(data) ? data : []);

const normalizeOne = (data) => data?.data || data || null;

export function useCompetitionForms() {
  return useQuery({
    queryKey: queryKeys.forms.list(),
    queryFn: async () => {
      const { data } = await apiClient.get("/forms");
      return normalizeList(data);
    },
  });
}

export function useCompetitionForm(formId, enabled = true) {
  return useQuery({
    queryKey: queryKeys.forms.detail(formId),
    queryFn: async () => {
      const { data } = await apiClient.get(`/forms/${formId}`);
      return normalizeOne(data);
    },
    enabled: !!formId && enabled,
  });
}

export function useCreateCompetitionForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post("/forms", payload);
      const normalized = normalizeOne(data);
      if (normalized && typeof normalized === "object") {
        return {
          ...normalized,
          pendingApproval: Boolean(data?.pendingApproval),
          message: data?.message,
        };
      }
      return {
        data: normalized,
        pendingApproval: Boolean(data?.pendingApproval),
        message: data?.message,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.competitions.all });
    },
  });
}

export function useUpdateCompetitionForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ formId, ...payload }) => {
      const { data } = await apiClient.put(`/forms/${formId}`, payload);
      const normalized = normalizeOne(data);
      if (normalized && typeof normalized === "object") {
        return {
          ...normalized,
          pendingApproval: Boolean(data?.pendingApproval),
          message: data?.message,
        };
      }
      return {
        data: normalized,
        pendingApproval: Boolean(data?.pendingApproval),
        message: data?.message,
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.forms.detail(variables.formId),
      });
    },
  });
}

export function useDeleteCompetitionForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formId) => {
      const { data } = await apiClient.delete(`/forms/${formId}`);
      const normalized = normalizeOne(data);
      if (normalized && typeof normalized === "object") {
        return {
          ...normalized,
          pendingApproval: Boolean(data?.pendingApproval),
          message: data?.message,
        };
      }
      return {
        data: normalized,
        pendingApproval: Boolean(data?.pendingApproval),
        message: data?.message,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.competitions.all });
    },
  });
}

export function useCreateCompetitionFormField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ formId, ...payload }) => {
      const { data } = await apiClient.post(`/forms/${formId}/fields`, payload);
      return normalizeOne(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.forms.detail(variables.formId),
      });
    },
  });
}

export function useUpdateCompetitionFormField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ formId, fieldId, ...payload }) => {
      const { data } = await apiClient.put(
        `/forms/${formId}/fields/${fieldId}`,
        payload,
      );
      return normalizeOne(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.forms.detail(variables.formId),
      });
    },
  });
}

export function useDeleteCompetitionFormField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ formId, fieldId }) => {
      const { data } = await apiClient.delete(
        `/forms/${formId}/fields/${fieldId}`,
      );
      return normalizeOne(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.forms.detail(variables.formId),
      });
    },
  });
}

export function useReorderCompetitionFormFields() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ formId, fieldIds }) => {
      const { data } = await apiClient.patch(
        `/forms/${formId}/fields/reorder`,
        {
          fieldIds,
        },
      );
      return normalizeOne(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.forms.detail(variables.formId),
      });
    },
  });
}
