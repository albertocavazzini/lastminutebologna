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
      /** Username bot senza @ (es. LastMinuteBolognaBot) per link t.me dal profilo. */
      telegramBotUsername?: string;
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

export function getTelegramBotUsername(): string {
  const raw = (
    (import.meta.env.VITE_TELEGRAM_BOT_USERNAME ?? "").trim() ||
    (fromRuntime()?.telegramBotUsername ?? "").trim()
  ).replace(/^@/, "");
  return raw;
}

/** Accesso tipizzato; i campi sono letti a ogni accesso (dopo il fetch in bootstrap). */
export const projectEnv = {
  get appsScriptWebAppBase() {
    return getAppsScriptWebAppBase();
  },
  get publicMiniAppUrl() {
    return getPublicMiniAppUrl();
  },
  get telegramBotUsername() {
    return getTelegramBotUsername();
  },
};
