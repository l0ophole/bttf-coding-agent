import { AppShell } from '@/features/shell/AppShell';

import { AppProviders } from './AppProviders';

export function App() {
  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  );
}
