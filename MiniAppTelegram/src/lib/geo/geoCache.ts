import type { UserMapPosition } from "@/lib/geo/userMapPosition";

const STORAGE_KEY = "lmb_user_geo_v1";

/** Dopo questo intervallo richiediamo di nuovo il GPS (nuovo prompt se il browser lo chiede). */
export const GEO_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type Stored = UserMapPosition & { savedAt: number };

function parseStored(raw: string): Stored | null {
  try {
    const p = JSON.parse(raw) as Stored;
    if (
      typeof p.lat !== "number" ||
      typeof p.lng !== "number" ||
      typeof p.savedAt !== "number"
    ) {
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

export function readGeoCache(
  ttlMs: number = GEO_CACHE_TTL_MS,
): UserMapPosition | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = parseStored(raw);
    if (!p) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    if (Date.now() - p.savedAt > ttlMs) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return {
      lat: p.lat,
      lng: p.lng,
      accuracyM: p.accuracyM ?? null,
    };
  } catch {
    return null;
  }
}

/** Timestamp ultimo salvataggio, per decidere se rifare un fix silenzioso in mappa. */
export function getGeoCacheSavedAt(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = parseStored(raw);
    if (!p || Date.now() - p.savedAt > GEO_CACHE_TTL_MS) {
      if (p) localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return p.savedAt;
  } catch {
    return null;
  }
}

export function writeGeoCache(pos: UserMapPosition): void {
  if (typeof window === "undefined") return;
  try {
    const payload: Stored = {
      lat: pos.lat,
      lng: pos.lng,
      accuracyM: pos.accuracyM,
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* storage pieno / modalità privata */
  }
}

export function clearGeoCache(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
