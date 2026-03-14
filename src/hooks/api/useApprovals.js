import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/queryKeys";
import apiClient from "@/lib/axios";

/**
 * Fetch all approvals with optional filters
 */
export function useApprovals(filters = {}) {
  return useQuery({
    queryKey: queryKeys.approvals.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get("/sa/approvals", {
        params: filters,
      });
      return data;
    },
  });
}

/**
 * Fetch pending approvals
 */
export function usePendingApprovals() {
  return useQuery({
    queryKey: queryKeys.approvals.pending(),
    queryFn: async () => {
      const { data } = await apiClient.get("/sa/approvals/pending");
      return data;
    },
  });
}

/**
 * Fetch single approval by ID
 */
export function useApproval(approvalId) {
  return useQuery({
    queryKey: queryKeys.approvals.detail(approvalId),
    queryFn: async () => {
      const { data } = await apiClient.get(`/sa/approvals/${approvalId}`);
      return data;
    },
    enabled: !!approvalId,
  });
}

/**
 * Approve an approval request
 */
export function useApproveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ approvalId, ...approvalData }) => {
      const { data } = await apiClient.post(
        `/sa/approvals/${approvalId}/approve`,
        approvalData,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.all });
    },
  });
}

/**
 * Reject an approval request
 */
export function useRejectRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ approvalId, reason }) => {
      const { data } = await apiClient.post(
        `/sa/approvals/${approvalId}/reject`,
        { reason },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.all });
    },
  });
}
