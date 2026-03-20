import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { queryKeys } from "@/src/lib/queryKeys";

export function usePublicUserProfile(userId) {
  return useQuery({
    queryKey: queryKeys.publicProfiles.detail(userId),
    queryFn: async () => {
      const { data } = await apiClient.get(`/auth/users/${userId}/profile`);
      return data?.data || data;
    },
    enabled: Boolean(userId),
  });
}
