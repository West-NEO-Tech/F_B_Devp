import { QueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

const defaultQueryFn = async ({ queryKey }: { queryKey: readonly unknown[] }) => {
  const url = queryKey[0] as string;
  return apiRequest("GET", url);
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (failureCount >= 2) return false;
        return error instanceof Error && error.message.startsWith("Server error");
      },
    },
    mutations: {
      retry: false,
    },
  },
});

export { apiRequest };
