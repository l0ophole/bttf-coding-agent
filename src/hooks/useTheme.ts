import { useEffect } from 'react';

import { useUiStore } from '@/stores/uiStore';

import { useMediaQuery } from './useMediaQuery';

/** The theme actually shown, resolving "system" against the OS preference. */
export function useResolvedTheme(): 'light' | 'dark' {
  const preference = useUiStore((s) => s.theme);
  const prefersLight = useMediaQuery('(prefers-color-scheme: light)');
  if (preference === 'system') return prefersLight ? 'light' : 'dark';
  return preference;
}

/** Mirror the resolved theme onto <html> so the CSS tokens switch. */
export function useApplyTheme(): void {
  const theme = useResolvedTheme();
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    document
      .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
      .forEach((meta) => meta.setAttribute('content', theme === 'dark' ? '#02060d' : '#eef2f8'));
  }, [theme]);
}
