import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, setStoredAccessToken } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { PublicUser } from "@/lib/services/authService";

/** The signed-in account (see PublicUser in authService). */
export type CurrentUser = PublicUser;

/**
 * Hook to retrieve the currently logged in user profile
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.profile(),
    queryFn: async (): Promise<CurrentUser> => {
      const { data } = await api.get<{ user: CurrentUser }>("/auth/me");
      return data.user;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

/**
 * Hook to perform user logout across devices/locally
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
      setStoredAccessToken(null);
    },
    onSuccess: () => {
      queryClient.clear();
      if (typeof window !== "undefined") {
        window.location.replace("/");
      }
    },
  });
}
