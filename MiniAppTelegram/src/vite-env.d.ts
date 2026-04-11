/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APPS_SCRIPT_WEBAPP_BASE?: string;
  readonly VITE_PUBLIC_MINI_APP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
