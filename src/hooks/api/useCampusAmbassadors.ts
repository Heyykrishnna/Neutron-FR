import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { queryKeys } from "@/src/lib/queryKeys";

export interface CampusAmbassador {
  id: string;
  name?: string;
  email?: string;
  referralCode?: string | null;
  isCa?: boolean;
  totalRegistrations?: number;
}

interface UpdateCampusAmbassadorsParams {
  userIds: string[];
}

export function useCampusAmbassadors() {
  return useQuery<CampusAmbassador[]>({
    queryKey: queryKeys.campusAmbassadors.lists(),
    queryFn: async () => {
      const { data } = await apiClient.get("/sa/cas");
      return data?.data?.campusAmbassadors || [];
    },
  });
}

export function useUpdateCampusAmbassadors() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateCampusAmbassadorsParams) => {
      const { data } = await apiClient.post("/sa/cas/update", params);
      return data?.data?.campusAmbassadors || [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.campusAmbassadors.all,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}
