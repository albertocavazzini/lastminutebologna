import type { Drop } from "@/data/mockDrops";
import { encodeGeohash } from "@/lib/geo/geohash";
import { haversineKm } from "@/lib/geo/distanceKm";

export type MiniappOffertaApi = {
  id_offerta: string;
  nome_locale: string;
  indirizzo: string;
  descrizione: string;
  prezzo_finale: string;
  prezzo_iniziale: string;
  posti_rimasti: number;
  posti_totali: number;
  scadenza_offerta: string;
  inizio_offerta: string;
  lat: number | null;
  lng: number | null;
  ghash: string;
  url_maps: string;
  link_prenota: string;
};

export type MiniappOfferteResponse = {
  ok: boolean;
  error?: string;
  offerte?: MiniappOffertaApi[];
  raggio_km?: number;
  geo_precisione?: number;
};

export const MINIAPP_OFFERTE_QUERY_ROOT = "miniapp-offerte" as const;

function secondsUntilScadenzaLocale(scadenzaHHmm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(scadenzaHHmm || "").trim());
  if (!m) return 3600;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return 3600;
  const end = new Date();
  end.setHours(h, min, 0, 0);
  const now = Date.now();
  if (end.getTime() <= now) return 0;
  return Math.floor((end.getTime() - now) / 1000);
}

export function offertaToDrop(
  o: MiniappOffertaApi,
  userLat: number,
  userLng: number,
): Drop {
  const lat = o.lat ?? NaN;
  const lng = o.lng ?? NaN;
  const prezzoIni = parseFloat(String(o.prezzo_iniziale || "").replace(",", ".")) || 0;
  const prezzoFin =
    parseFloat(String(o.prezzo_finale || "").replace(",", ".")) || 0;
  const base = prezzoIni > 0 ? prezzoIni : prezzoFin;
  const discount =
    base > 0 && prezzoFin >= 0
      ? Math.round((1 - prezzoFin / base) * 100)
      : 0;

  const distanceM =
    Number.isFinite(lat) && Number.isFinite(lng)
      ? Math.round(haversineKm(userLat, userLng, lat, lng) * 1000)
      : 0;

  return {
    id: o.id_offerta,
    title: o.descrizione?.trim() ? o.descrizione : o.nome_locale || "Offerta",
    merchant: o.nome_locale || "Locale",
    merchantLogo: "🥯",
    originalPrice: base || prezzoFin,
    discountedPrice: prezzoFin,
    discountPercent: Math.max(0, Math.min(99, discount)),
    category: "Offerta",
    distance: distanceM,
    remainingSeconds: secondsUntilScadenzaLocale(o.scadenza_offerta),
    quantityLeft: o.posti_rimasti || 0,
    quantityTotal: o.posti_totali || o.posti_rimasti || 0,
    isGolden: discount >= 85,
    lat,
    lng,
    image: "",
    description: o.descrizione || "",
    linkPrenota: o.link_prenota || undefined,
    urlMaps: o.url_maps || undefined,
  };
}

/** Come filtraComeRadar in MiniAppTelegram/app.js */
export function filterOffersRadarStyle(
  offerte: MiniappOffertaApi[],
  uLat: number,
  uLng: number,
  raggioKm: number,
  precisione: number,
): MiniappOffertaApi[] {
  const ug = encodeGeohash(uLat, uLng, precisione);
  return offerte.filter((o) => {
    const og = o.ghash != null ? String(o.ghash) : "";
    if (!og || og !== ug) return false;
    if (o.lat == null || o.lng == null) return false;
    const la = Number(o.lat);
    const ln = Number(o.lng);
    if (!Number.isFinite(la) || !Number.isFinite(ln)) return false;
    return haversineKm(uLat, uLng, la, ln) <= raggioKm;
  });
}

export function datasetSupportaRadar(offerte: MiniappOffertaApi[]): boolean {
  return offerte.some((o) => {
    const g = o.ghash != null ? String(o.ghash) : "";
    if (!g) return false;
    const la = Number(o.lat);
    const ln = Number(o.lng);
    return Number.isFinite(la) && Number.isFinite(ln);
  });
}

/**
 * JSONP verso la web app (stesso contratto di MiniAppTelegram/app.js).
 */
export function fetchMiniappOfferteJsonp(baseRaw: string): Promise<MiniappOfferteResponse> {
  const base = baseRaw.replace(/\/$/, "");
  if (!base) {
    return Promise.reject(new Error("Base URL web app mancante."));
  }

  return new Promise((resolve, reject) => {
    const cbName = `lmb_cb_${Date.now()}`;
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
      resolve(data as MiniappOfferteResponse);
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
    url.searchParams.set("action", "offerte");
    url.searchParams.set("callback", cbName);

    script.src = url.toString();
    script.async = true;
    script.onerror = () => {
      cleanup();
      reject(new Error("Impossibile contattare la web app (rete o URL)."));
    };
    document.head.appendChild(script);
  });
}
