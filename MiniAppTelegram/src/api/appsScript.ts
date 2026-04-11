import { projectEnv } from "@/config/projectEnv";

/**
 * Costruisce un URL verso la web app Apps Script (stesso deployment usato dal resto del progetto).
 * Usa `VITE_APPS_SCRIPT_WEBAPP_BASE` nel `.env` della mini app.
 */
export function appsScriptUrl(pathOrQuery: string): string {
  const base = projectEnv.appsScriptWebAppBase.replace(/\/$/, "");
  if (!base) return "";
  const suffix = pathOrQuery.startsWith("?") || pathOrQuery.startsWith("/")
    ? pathOrQuery
    : `/${pathOrQuery}`;
  return `${base}${suffix}`;
}
