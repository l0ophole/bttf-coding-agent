import { toast } from '@/stores/toastStore';

/**
 * Window controls for the custom title bar. A desktop shell (Electron or Tauri)
 * exposes `window.desktopBridge`; in a browser the controls explain themselves.
 */
export const windowControls = {
  get isDesktop(): boolean {
    return typeof window !== 'undefined' && Boolean(window.desktopBridge);
  },
  minimize(): void {
    if (window.desktopBridge) window.desktopBridge.minimize();
    else toast.info('Window controls work in the desktop app');
  },
  async toggleMaximize(): Promise<void> {
    if (window.desktopBridge) {
      window.desktopBridge.toggleMaximize();
      return;
    }
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      toast.info('Full screen is not available here');
    }
  },
  close(): void {
    if (window.desktopBridge) window.desktopBridge.close();
    else toast.info('Window controls work in the desktop app');
  },
};
