import { QueryClient, isServer } from "@tanstack/react-query";

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 1 minute
        staleTime: 60 * 1000,
        // Unused cache data garbage collected after 5 minutes
        gcTime: 5 * 60 * 1000,
        // Do not retry on client errors (4xx)
        retry(failureCount, error: unknown) {
          if (failureCount >= 2) return false;
          const err = error as { status?: number; response?: { status?: number } } | null | undefined;
          const status = err?.status || err?.response?.status;
          if (status && status >= 400 && status < 500) return false;
          return true;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: "always",
      },
      mutations: {
        retry: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

/**
 * Returns a QueryClient instance.
 * On server: creates a new QueryClient per request to avoid cross-request data leaks.
 * On client: maintains a singleton QueryClient across the browser session.
 */
export function getQueryClient(): QueryClient {
  if (isServer) {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
