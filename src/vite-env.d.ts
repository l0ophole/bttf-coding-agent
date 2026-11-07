/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** `mock` (default) or `http`. */
  readonly VITE_API_MODE?: 'mock' | 'http';
  /** Base URL for the HTTP API, e.g. `https://picode.example.com/api`. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Injected by a desktop shell (Electron/Tauri preload) to control the native window. */
interface DesktopBridge {
  minimize(): void;
  toggleMaximize(): void;
  close(): void;
}

interface Window {
  desktopBridge?: DesktopBridge;
}
