/**
 * Punti di contatto con LastMinuteBologna (Apps Script + Telegram).
 *
 * - Variabili Vite: file `.env` in questa cartella (non committare segreti).
 * - Bot / Script: stesso URL pubblico della mini app come riga
 *   `URL_MINI_APP_TELEGRAM` nel foglio credenziali (merge in getConfigOttimizzato).
 */
export const projectEnv = {
  /** Base URL della web app Apps Script (…/exec), senza path aggiuntivi se usi query */
  appsScriptWebAppBase: import.meta.env.VITE_APPS_SCRIPT_WEBAPP_BASE ?? "",
  /** URL pubblico della mini app (es. GitHub Pages) — allineato a URL_MINI_APP_TELEGRAM */
  publicMiniAppUrl: import.meta.env.VITE_PUBLIC_MINI_APP_URL ?? "",
} as const;
