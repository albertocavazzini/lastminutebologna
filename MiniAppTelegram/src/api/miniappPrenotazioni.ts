export type MiniappPrenotazioneRow = {
  stato_id: string;
  locale: string;
  id_offerta: string;
  timestamp: string;
  validata: boolean;
  qr_url: string;
  url_validazione: string;
};

export type MiniappPrenotazioniResponse = {
  ok: boolean;
  error?: string;
  prenotazioni?: MiniappPrenotazioneRow[];
};

/** StaleTime condiviso (Index + Prenotazioni): meno GET al cambio tab; si rivalida dopo bot / visibility. */
export const MINIAPP_PRENOTAZIONI_STALE_MS = 5 * 60_000;

export const MINIAPP_PRENOTAZIONI_QUERY_ROOT = "miniapp-prenotazioni" as const;

/**
 * JSONP: `mode=api_miniapp&action=prenotazioni_mie&init_data=…`
 * Nota: initData può essere lunga; se la richiesta fallisce, prova da Telegram (non browser desktop senza mini app).
 */
export function fetchMiniappPrenotazioniJsonp(
  baseRaw: string,
  initData: string,
): Promise<MiniappPrenotazioniResponse> {
  const base = baseRaw.replace(/\/$/, "");
  if (!base) {
    return Promise.reject(new Error("Base URL web app mancante."));
  }
  if (!initData) {
    return Promise.reject(
      new Error("Dati Telegram assenti: apri la mini app da Telegram."),
    );
  }

  return new Promise((resolve, reject) => {
    const cbName = `lmb_pre_${Date.now()}`;
    const script = document.createElement("script");

    const cleanup = () => {
      try {
        delete (window as unknown as Record<string, unknown>)[cbName];
      } catch {
        /* ignore */
      }
      script.remove();
    };

    (window as unknown as Record<string, unknown>)[cbName] = (data: unknown) => {
      cleanup();
      resolve(data as MiniappPrenotazioniResponse);
    };

    let url: URL;
    try {
      url = new URL(base);
    } catch {
      cleanup();
      reject(new Error("URL web app non valido."));
      return;
    }
    url.searchParams.set("mode", "api_miniapp");
    url.searchParams.set("action", "prenotazioni_mie");
    url.searchParams.set("init_data", initData);
    url.searchParams.set("callback", cbName);

    script.src = url.toString();
    script.async = true;
    script.onerror = () => {
      cleanup();
      reject(
        new Error(
          "Richiesta troppo lunga o rete: apri da Telegram o riduci i parametri.",
        ),
      );
    };
    document.head.appendChild(script);
  });
}
