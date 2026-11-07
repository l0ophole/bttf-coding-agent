import { createContext, use } from 'react';

import type { ApiClient } from './client';

export const ApiContext = createContext<ApiClient | null>(null);

/** The API client provided by `AppProviders`. */
export function useApi(): ApiClient {
  const api = use(ApiContext);
  if (!api) throw new Error('useApi must be used inside <AppProviders>');
  return api;
}
