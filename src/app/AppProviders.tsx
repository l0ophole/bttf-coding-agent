import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import type { ApiClient } from '@/api/client';
import { ApiContext } from '@/api/context';
import { createApi } from '@/api/createApi';

import { createQueryClient } from './queryClient';

interface AppProvidersProps {
  children: ReactNode;
  /** Inject a client (tests use a zero-latency mock). */
  api?: ApiClient;
  queryClient?: QueryClient;
}

export function AppProviders({ children, api, queryClient }: AppProvidersProps) {
  const [client] = useState(() => api ?? createApi());
  const [query] = useState(() => queryClient ?? createQueryClient());
  return (
    <ApiContext value={client}>
      <QueryClientProvider client={query}>{children}</QueryClientProvider>
    </ApiContext>
  );
}
