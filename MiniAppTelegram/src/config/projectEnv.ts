/**
 * Punti di contatto con LastMinuteBologna (Apps Script + Telegram).
 *
 * Priorità: variabili Vite (`VITE_*` in `.env` o build CI) → poi
 * `public/runtime-config.json` (caricato in `main.tsx` prima del render).
 */

declare global {
  interface Window {
    __LMB_RUNTIME__?: {
      appsScriptWebAppBase?: string;
      publicMiniAppUrl?: string;
    };
  }
}

function fromRuntime(): Window["__LMB_RUNTIME__"] {
  if (typeof window === "undefined") return undefined;
  return window.__LMB_RUNTIME__;
}

export function getAppsScriptWebAppBase(): string {
  const env = (import.meta.env.VITE_APPS_SCRIPT_WEBAPP_BASE ?? "").trim();
  if (env) return env;
  return (fromRuntime()?.appsScriptWebAppBase ?? "").trim();
}

export function getPublicMiniAppUrl(): string {
  const env = (import.meta.env.VITE_PUBLIC_MINI_APP_URL ?? "").trim();
  if (env) return env;
  return (fromRuntime()?.publicMiniAppUrl ?? "").trim();
}

/** Accesso tipizzato; i campi sono letti a ogni accesso (dopo il fetch in bootstrap). */
export const projectEnv = {
  get appsScriptWebAppBase() {
    return getAppsScriptWebAppBase();
  },
  get publicMiniAppUrl() {
    return getPublicMiniAppUrl();
  },
};
