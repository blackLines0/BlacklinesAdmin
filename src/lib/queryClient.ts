import { QueryClient } from "@tanstack/react-query";

// Admin data changes often (stock, orders, avis) and several people can be
// editing at once, so we keep a short staleTime rather than caching
// aggressively: cached data still shows instantly on navigation, but a
// background refetch kicks in quickly instead of trusting a stale value.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});
