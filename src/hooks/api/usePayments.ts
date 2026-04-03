import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { queryKeys } from "@/src/lib/queryKeys";

interface ApprovedUnpaidFilters {
  competitionId?: string;
  page?: number;
  pageSize?: number;
}

const unwrapResponse = (data: any) => data?.data || data;

export function useRegistrationPaymentStatus(
  registrationId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.payments.status(registrationId || ""),
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/payment/registration/${registrationId}/status`,
      );
      return unwrapResponse(data);
    },
    enabled: Boolean(registrationId) && enabled,
  });
}

export function useRetryRegistrationPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (registrationId: string) => {
      const { data } = await apiClient.post(
        `/payment/registration/${registrationId}/retry`,
      );
      return unwrapResponse(data);
    },
    onSuccess: (_, registrationId) => {
      if (registrationId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.payments.status(registrationId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.registrations.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.publicRegistrations.all,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
    },
  });
}

export function useCreateRegistrationCheckoutSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (registrationId: string) => {
      const { data } = await apiClient.post(
        `/payment/registration/${registrationId}/checkout`,
      );
      return unwrapResponse(data);
    },
    onSuccess: (_, registrationId) => {
      if (registrationId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.payments.status(registrationId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
    },
  });
}

export function useApprovedUnpaidRegistrations(
  filters: ApprovedUnpaidFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.payments.approvedUnpaid(filters),
    queryFn: async () => {
      const { data } = await apiClient.get("/payment/admin/approved-unpaid", {
        params: filters,
      });
      return Array.isArray(data?.data) ? data.data : [];
    },
    enabled,
  });
}

export function useResendRegistrationPaymentLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (registrationId: string) => {
      const { data } = await apiClient.post(
        `/payment/admin/registration/${registrationId}/resend-link`,
      );
      return unwrapResponse(data);
    },
    onSuccess: (_, registrationId) => {
      if (registrationId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.payments.status(registrationId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.registrations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
    },
  });
}

export function useRegistrationPaymentSessions(
  registrationId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.payments.sessions(registrationId || ""),
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/payment/admin/registration/${registrationId}/sessions`,
      );
      return Array.isArray(data?.data) ? data.data : [];
    },
    enabled: Boolean(registrationId) && enabled,
  });
}
