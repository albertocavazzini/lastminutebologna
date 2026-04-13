import { useCallback, useEffect, useRef, useState } from "react";
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

export function useRadarLocation() {
  const [userPos, setUserPos] = useState<UserMapPosition | null>(() =>
    typeof window !== "undefined" ? readGeoCache() : null,
  );
  const [geoDone, setGeoDone] = useState(
    () => typeof window !== "undefined" && readGeoCache() !== null,
  );
  const [geoDenied, setGeoDenied] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const prevViewMode = useRef<"map" | "list">("list");

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
  }, []);

  const refineLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const u = userMapPositionFromGeolocation(pos);
        setUserPos(u);
        writeGeoCache(u);
      },
      () => {},
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 25_000,
      },
    );
  }, []);

  useEffect(() => {
    if (readGeoCache()) return;
    requestLocation();
  }, [requestLocation]);

  const handleViewModeChange = useCallback(
    (activeTab: string, viewMode: "map" | "list") => {
      if (activeTab === "radar" && viewMode === "map" && prevViewMode.current !== "map") {
        const savedAt = getGeoCacheSavedAt();
        if (savedAt == null || Date.now() - savedAt >= REFINE_MAP_MIN_INTERVAL_MS) {
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
