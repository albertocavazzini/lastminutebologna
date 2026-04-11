export type MiniappFeedbackRichiesta = {
  id_prenotazione: string;
  locale: string;
  ora_scansione: string;
};

export type MiniappFeedbackListaResponse = {
  ok: boolean;
  error?: string;
  feedback_richieste?: MiniappFeedbackRichiesta[];
};

export type MiniappFeedbackInviaResponse = {
  ok: boolean;
  error?: string;
};

/**
 * JSONP: `mode=api_miniapp&action=feedback_da_lasciare&init_data=…`
 * Elenco prenotazioni validate da ≥30 min senza riga in feedback_log.
 */
export function fetchMiniappFeedbackDaLasciareJsonp(
  baseRaw: string,
  initData: string,
): Promise<MiniappFeedbackListaResponse> {
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
    const cbName = `lmb_fbl_${Date.now()}`;
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
      resolve(data as MiniappFeedbackListaResponse);
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
    url.searchParams.set("action", "feedback_da_lasciare");
    url.searchParams.set("init_data", initData);
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

/**
 * JSONP GET: invio valutazione (commento max 500 caratteri lato server).
 */
export function inviaMiniappFeedbackJsonp(
  baseRaw: string,
  initData: string,
  idPrenotazione: string,
  valutazione: number,
  commento: string,
): Promise<MiniappFeedbackInviaResponse> {
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
    const cbName = `lmb_fbi_${Date.now()}`;
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
      resolve(data as MiniappFeedbackInviaResponse);
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
    url.searchParams.set("action", "feedback_invia");
    url.searchParams.set("init_data", initData);
    url.searchParams.set("id_prenotazione", idPrenotazione);
    url.searchParams.set("valutazione", String(valutazione));
    url.searchParams.set("commento", commento.slice(0, 500));
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
