/**
 * Legge `runtime-config.json` dalla root del sito (cartella `public/` in dev/build).
 * Chiamare una sola volta prima di `createRoot`.
 */
export async function loadPublicRuntimeConfig(): Promise<void> {
  const url = `${import.meta.env.BASE_URL}runtime-config.json`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return;
    const j = (await res.json()) as Record<string, unknown>;
    const base =
      typeof j.appsScriptWebAppBase === "string"
        ? j.appsScriptWebAppBase.trim()
        : "";
    const pub =
      typeof j.publicMiniAppUrl === "string"
        ? j.publicMiniAppUrl.trim()
        : "";
    const next: NonNullable<Window["__LMB_RUNTIME__"]> = {};
    if (base) next.appsScriptWebAppBase = base;
    if (pub) next.publicMiniAppUrl = pub;
    if (Object.keys(next).length > 0) {
      window.__LMB_RUNTIME__ = next;
    }
  } catch {
    /* offline / JSON non valido */
  }
}
