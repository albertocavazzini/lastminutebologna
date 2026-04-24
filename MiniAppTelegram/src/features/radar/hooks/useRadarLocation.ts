import { useCallback, useEffect, useRef, useState } from "react";
import { inviaMiniappAggiornaPosizioneJsonp } from "@/api/miniappPosizione";
import {
  clearGeoCache,
  getGeoCacheSavedAt,
  readGeoCache,
  writeGeoCache,
} from "@/lib/geo/geoCache";
import {
  userMapPositionFromGeolocation,
  type UserMapPosition,
} from "@/lib/geo/userMapPosition";

const REFINE_MAP_MIN_INTERVAL_MS = 30 * 60 * 1000;
/** Evita burst JSONP verso AppScript (salvaPosizioneUtente ha già dedup lato server). */
const FIREBASE_POSIZIONE_MIN_INTERVAL_MS = 120_000;
/** Prompt geolocalizzazione automatico solo al primo avvio mini app. */
const GEO_FIRST_PROMPT_DONE_KEY = "lmb-geo-first-prompt-done-v1";

export function useRadarLocation(webAppBase: string, initData: string) {
  const [userPos, setUserPos] = useState<UserMapPosition | null>(() =>
    typeof window !== "undefined" ? readGeoCache() : null,
  );
  const [geoDone, setGeoDone] = useState(
    () => typeof window !== "undefined" && readGeoCache() !== null,
  );
  const [geoDenied, setGeoDenied] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const prevViewMode = useRef<"map" | "list">("list");
  const lastFirebasePosSyncMs = useRef(0);

  const syncPosizioneRadarFirebase = useCallback(
    (u: UserMapPosition) => {
      if (!webAppBase?.trim() || !initData) return;
      const now = Date.now();
      if (
        lastFirebasePosSyncMs.current > 0 &&
        now - lastFirebasePosSyncMs.current < FIREBASE_POSIZIONE_MIN_INTERVAL_MS
      ) {
        return;
      }
      lastFirebasePosSyncMs.current = now;
      void inviaMiniappAggiornaPosizioneJsonp(webAppBase, initData, u.lat, u.lng).catch(
        () => {
          /* best-effort: radar offline non blocca UX */
        },
      );
    },
    [webAppBase, initData],
  );

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoDone(true);
      setGeoDenied(false);
      return;
    }
    setGeoLoading(true);
    setGeoDone(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const u = userMapPositionFromGeolocation(pos);
        setUserPos(u);
        writeGeoCache(u);
        syncPosizioneRadarFirebase(u);
        setGeoDone(true);
        setGeoDenied(false);
        setGeoLoading(false);
      },
      (err) => {
        setGeoDone(true);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoDenied(true);
          clearGeoCache();
          setUserPos(null);
        } else {
          setGeoDenied(false);
        }
        setGeoLoading(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 25_000,
      },
    );
  }, [syncPosizioneRadarFirebase]);

  const refineLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const u = userMapPositionFromGeolocation(pos);
        setUserPos(u);
        writeGeoCache(u);
        syncPosizioneRadarFirebase(u);
      },
      () => {},
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 25_000,
      },
    );
  }, [syncPosizioneRadarFirebase]);

  useEffect(() => {
    if (readGeoCache()) return;
    let firstPromptDone = false;
    try {
      firstPromptDone = window.localStorage.getItem(GEO_FIRST_PROMPT_DONE_KEY) === "1";
    } catch {
      firstPromptDone = false;
    }
    if (firstPromptDone) return;
    try {
      window.localStorage.setItem(GEO_FIRST_PROMPT_DONE_KEY, "1");
    } catch {
      // ignore storage errors: fallback a comportamento best-effort
    }
    requestLocation();
  }, [requestLocation]);

  const handleViewModeChange = useCallback(
    (activeTab: string, viewMode: "map" | "list") => {
      if (activeTab === "radar" && viewMode === "map" && prevViewMode.current !== "map") {
        const savedAt = getGeoCacheSavedAt();
        if (savedAt != null && Date.now() - savedAt >= REFINE_MAP_MIN_INTERVAL_MS) {
          refineLocation();
        }
      }
      prevViewMode.current = viewMode;
    },
    [refineLocation],
  );

  return {
    userPos,
    geoDone,
    geoDenied,
    geoLoading,
    requestLocation,
    handleViewModeChange,
  };
}
