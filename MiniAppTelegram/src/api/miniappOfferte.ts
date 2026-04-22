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
  scope?: "all" | "radar" | string;
};

export const MINIAPP_OFFERTE_QUERY_ROOT = "miniapp-offerte" as const;

/**
 * Username bot (senza @) da URL tipo `https://t.me/NomeBot?start=…` come in `link_prenota`.
 */
export function parseTelegramBotUsernameFromTMeLink(
  link: string | undefined | null,
): string {
  const s = String(link ?? "").trim();
  if (!s) return "";
  try {
    const u = new URL(s);
    const h = u.hostname.toLowerCase();
    if (h !== "t.me" && h !== "telegram.me" && h !== "telegram.dog") {
      return "";
    }
    const first = u.pathname.replace(/^\//, "").split("/")[0]?.trim() ?? "";
    return first.replace(/^@/, "");
  } catch {
    return "";
  }
}

/** Allineato ad AppScript: {@code dd/MM/yyyy HH:mm:ss} oppure legacy {@code HH:mm} (stesso giorno). */
function scadenzaOffertaToEndMs(scadenza: string): number | null {
  const t = String(scadenza || "").trim();
  const full = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/.exec(t);
  if (full) {
    const day = parseInt(full[1], 10);
    const month = parseInt(full[2], 10) - 1;
    const year = parseInt(full[3], 10);
    const h = parseInt(full[4], 10);
    const min = parseInt(full[5], 10);
    const sec = parseInt(full[6], 10);
    const end = new Date(year, month, day, h, min, sec);
    const ms = end.getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  const hm = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (hm) {
    const h = parseInt(hm[1], 10);
    const min = parseInt(hm[2], 10);
    if (!Number.isFinite(h) || !Number.isFinite(min)) return null;
    const end = new Date();
    end.setHours(h, min, 0, 0);
    return end.getTime();
  }
  return null;
}

function secondsUntilScadenzaLocale(scadenza: string): number {
  const endMs = scadenzaOffertaToEndMs(scadenza);
  if (endMs == null) return 3600;
  const now = Date.now();
  if (endMs <= now) return 0;
  return Math.floor((endMs - now) / 1000);
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
export function fetchMiniappOfferteJsonp(
  baseRaw: string,
  opts?: {
    scope?: "all" | "radar";
    userLat?: number | null;
    userLng?: number | null;
  },
): Promise<MiniappOfferteResponse> {
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
    const scope = opts?.scope ?? "all";
    url.searchParams.set("scope", scope);
    if (
      scope === "radar" &&
      Number.isFinite(opts?.userLat) &&
      Number.isFinite(opts?.userLng)
    ) {
      url.searchParams.set("user_lat", String(opts?.userLat));
      url.searchParams.set("user_lng", String(opts?.userLng));
    }
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
