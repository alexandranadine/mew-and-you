import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute — search results don't need to refetch aggressively
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
