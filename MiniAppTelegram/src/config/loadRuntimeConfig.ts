/**
 * Override senza riconfigurare il repo: apri la mini app con
 * `#exec=` + URL della web app codificato (encodeURIComponent).
 * Esempio: `#exec=https%3A%2F%2Fscript.google.com%2Fmacros%2Fs%2FXXX%2Fexec`
 */
function execFromLocationHash(): string {
  if (typeof location === "undefined") return "";
  const raw = location.hash.slice(1);
  if (!raw.startsWith("exec=")) return "";
  try {
    return decodeURIComponent(raw.slice(5)).trim();
  } catch {
    return "";
  }
}

/**
 * Legge `runtime-config.json` dalla root del sito (cartella `public/` in dev/build).
 * L’hash `#exec=…` ha priorità sul JSON. Chiamare una sola volta prima di `createRoot`.
 */
export async function loadPublicRuntimeConfig(): Promise<void> {
  const url = `${import.meta.env.BASE_URL}runtime-config.json`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
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
    }
  } catch {
    /* offline / JSON non valido */
  }

  const fromHash = execFromLocationHash();
  if (fromHash) {
    window.__LMB_RUNTIME__ = {
      ...(window.__LMB_RUNTIME__ ?? {}),
      appsScriptWebAppBase: fromHash,
    };
  }
}
