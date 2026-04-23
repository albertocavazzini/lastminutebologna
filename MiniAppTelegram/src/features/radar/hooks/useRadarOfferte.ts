import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MINIAPP_OFFERTE_QUERY_ROOT,
  datasetSupportaRadar,
  fetchMiniappOfferteJsonp,
  filterOffersRadarStyle,
  offertaToDrop,
} from "@/api/miniappOfferte";
import type { UserMapPosition } from "@/lib/geo/userMapPosition";

const RADAR_DEFAULT_KM = 5.12;
const RADAR_DEFAULT_PRECISION = 6;

export function useRadarOfferte({
  webAppBase,
  activeTab,
  userPos,
  viewMode,
  isMapFullscreen,
  isMapZoomedOut,
  viewportBucket,
}: {
  webAppBase: string;
  activeTab: string;
  userPos: UserMapPosition | null;
  viewMode: "map" | "list";
  isMapFullscreen: boolean;
  isMapZoomedOut: boolean;
  viewportBucket?: string | null;
}) {
  const mapCompactRadarScope =
    activeTab === "radar" &&
    viewMode === "map" &&
    !isMapZoomedOut &&
    Boolean(userPos);
  const scope: "all" | "radar" = mapCompactRadarScope ? "radar" : "all";

  const query = useQuery({
    queryKey: [
      MINIAPP_OFFERTE_QUERY_ROOT,
      webAppBase,
      scope,
      viewportBucket ?? "no-viewport",
      userPos?.lat ?? null,
      userPos?.lng ?? null,
    ],
    queryFn: () =>
      fetchMiniappOfferteJsonp(webAppBase, {
        scope,
        userLat: userPos?.lat ?? null,
        userLng: userPos?.lng ?? null,
      }),
    staleTime: 3 * 60_000,
    enabled: Boolean(webAppBase),
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  const radarDrops = useMemo(() => {
    const data = query.data;
    if (!data?.ok || !data.offerte?.length || !userPos) return [];
    const raw = data.offerte;
    if (!datasetSupportaRadar(raw)) return [];
    const filtered = filterOffersRadarStyle(
      raw,
      userPos.lat,
      userPos.lng,
      data.raggio_km ?? RADAR_DEFAULT_KM,
      data.geo_precisione ?? RADAR_DEFAULT_PRECISION,
    );
    return filtered
      .map((o) => offertaToDrop(o, userPos.lat, userPos.lng))
      .sort((a, b) => a.distance - b.distance);
  }, [query.data, userPos]);

  const allDrops = useMemo(() => {
    const data = query.data;
    if (!data?.ok || !data.offerte?.length || !userPos) return [];
    return data.offerte
      .map((o) => offertaToDrop(o, userPos.lat, userPos.lng))
      .filter((d) => Number.isFinite(d.lat) && Number.isFinite(d.lng))
      .sort((a, b) => a.distance - b.distance);
  }, [query.data, userPos]);

  const radarRangeKm = query.data?.raggio_km ?? RADAR_DEFAULT_KM;

  return {
    ...query,
    radarDrops,
    allDrops,
    radarRangeKm,
    dataUpdatedAtMs: query.dataUpdatedAt,
    supportaRadarDataset: Boolean(
      query.data?.ok && query.data.offerte?.length && datasetSupportaRadar(query.data.offerte),
    ),
  };
}
