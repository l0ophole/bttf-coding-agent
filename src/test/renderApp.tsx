import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockApi, type MockApiOptions } from '@/api/mock/mockApi';
import { FIXTURE_NOW } from '@/api/mock/fixtures';
import { AppProviders } from '@/app/AppProviders';
import { AppShell } from '@/features/shell/AppShell';
import { clock } from '@/lib/clock';
import { useToastStore } from '@/stores/toastStore';
import { useUiStore } from '@/stores/uiStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';

export function resetStores() {
  useUiStore.setState(useUiStore.getInitialState(), true);
  useWorkspaceStore.setState(useWorkspaceStore.getInitialState(), true);
  useToastStore.setState(useToastStore.getInitialState(), true);
}

/** Render the whole app against a zero-latency mock backend. */
export function renderApp(options: MockApiOptions = {}) {
  resetStores();
  clock.setNow(FIXTURE_NOW());
  const api = createMockApi({ latencyMs: 0, autoplay: false, agentStepMs: 20, ...options });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const user = userEvent.setup();
  const utils = render(
    <AppProviders api={api} queryClient={queryClient}>
      <AppShell />
    </AppProviders>,
  );
  return { ...utils, api, queryClient, user };
}
