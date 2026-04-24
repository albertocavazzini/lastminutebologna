export type MiniappAggiornaPosizioneResponse = {
  ok: boolean;
  error?: string;
};

/**
 * JSONP: aggiorna `utenti/<chat_id>` su Firebase (radar notifiche), stesso schema del bot.
 */
export function inviaMiniappAggiornaPosizioneJsonp(
  baseRaw: string,
  initData: string,
  lat: number,
  lng: number,
): Promise<MiniappAggiornaPosizioneResponse> {
  const base = baseRaw.replace(/\/$/, "");
  if (!base) {
    return Promise.reject(new Error("Base URL web app mancante."));
  }
  if (!initData) {
    return Promise.reject(
      new Error("Dati Telegram assenti: apri la mini app da Telegram."),
    );
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Promise.reject(new Error("Coordinate non valide."));
  }

  return new Promise((resolve, reject) => {
    const cbName = `lmb_pos_${Date.now()}`;
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
      resolve(data as MiniappAggiornaPosizioneResponse);
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
    url.searchParams.set("action", "aggiorna_posizione");
    url.searchParams.set("init_data", initData);
    url.searchParams.set("user_lat", String(lat));
    url.searchParams.set("user_lng", String(lng));
    url.searchParams.set("callback", cbName);

    script.src = url.toString();
    script.async = true;
    script.onerror = () => {
      cleanup();
      reject(new Error("Errore di rete o URL troppo lungo."));
    };
    document.head.appendChild(script);
  });
}
