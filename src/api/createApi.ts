import { clock } from '@/lib/clock';

import type { ApiClient } from './client';
import { createHttpApi } from './httpClient';
import { FIXTURE_NOW } from './mock/fixtures';
import { createMockApi } from './mock/mockApi';

/**
 * Build the API client for this environment.
 * `VITE_API_MODE=http` talks to `VITE_API_URL`; anything else uses the in-memory mock.
 */
export function createApi(): ApiClient {
  if (import.meta.env.VITE_API_MODE === 'http') {
    return createHttpApi(import.meta.env.VITE_API_URL ?? '/api');
  }
  // Line the clock up with the demo data so the app opens at 10:26 AM like the design.
  clock.setNow(FIXTURE_NOW());
  return createMockApi();
}
