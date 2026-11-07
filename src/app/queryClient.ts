import { MutationCache, QueryClient } from '@tanstack/react-query';

import { toast } from '@/stores/toastStore';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 15_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
    mutationCache: new MutationCache({
      // One place to tell the user a write failed; callers handle rollback.
      onError: (error) => {
        toast.error('Something went wrong', {
          description: error instanceof Error ? error.message : 'Please try again.',
        });
      },
    }),
  });
}
