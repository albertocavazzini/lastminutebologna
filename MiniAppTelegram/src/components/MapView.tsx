import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  ZoomControl,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import type { Drop } from "@/data/mockDrops";
import { encodeGeohash } from "@/lib/geo/geohash";
import { haversineKm } from "@/lib/geo/distanceKm";
import type { UserMapPosition } from "@/lib/geo/userMapPosition";
import "leaflet/dist/leaflet.css";

/** Centro Bologna (MVP radar last minute). */
const BOLOGNA_CENTER: [number, number] = [44.4949, 11.3426];

/** Vista “dall’alto” prima del fly verso il GPS (stile app mappe native). */
const INTRO_OVERVIEW_ZOOM = 11;
const INTRO_TARGET_ZOOM = 15;

/**
 * Basemap CARTO (CDN dedicato), dati OSM — adatto a MVP senza chiave API.
 * @see https://carto.com/basemaps/
 */
const TILE_URL_CARTO_POSITRON =
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION_CARTO =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
  '&copy; <a href="https://carto.com/attributions">CARTO</a>';

export interface MapViewProps {
  drops: Drop[];
  radarRangeKm: number;
  onSelectDrop: (drop: Drop) => void;
  /** Stessa posizione usata per il radar in lista (evita una seconda richiesta GPS). */
  userPos: UserMapPosition | null;
  onZoomLevelChange?: (zoom: number) => void;
  onViewChange?: (view: { centerLat: number; centerLng: number; zoom: number }) => void;
  initialView?: { centerLat: number; centerLng: number; zoom: number } | null;
  autoFitOnMount?: boolean;
}

type FarCluster = {
  key: string;
  lat: number;
  lng: number;
  count: number;
  radiusM: number;
};

const HOTSPOT_GEOHASH_PRECISION = 5;
const HOTSPOT_MIN_RADIUS_M = 140;
const HOTSPOT_MAX_RADIUS_M = 420;
const HOTSPOT_PRIVACY_OFFSET_M = 180;

function pseudoRandomUnitFromKey(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 1000) / 1000;
}

function offsetLatLngMeters(
  lat: number,
  lng: number,
  distanceM: number,
  bearingRad: number,
): [number, number] {
  const dLat = (distanceM * Math.cos(bearingRad)) / 111_320;
  const dLng =
    (distanceM * Math.sin(bearingRad)) /
    (111_320 * Math.cos((lat * Math.PI) / 180));
  return [lat + dLat, lng + dLng];
}

/**
 * Se la posizione arriva dopo il primo render (GPS lento), mostra prima un overview
 * sulla città e poi anima verso l’utente. Con posizione già disponibile (cache) non fa nulla.
 */
function MapIntroFlyFromOverview({
  userPos,
  initialView,
  autoFitOnMount,
}: {
  userPos: UserMapPosition | null;
  initialView: MapViewProps["initialView"];
  autoFitOnMount: boolean;
}) {
  const map = useMap();
  const sawMissingUserRef = useRef(false);
  const introRanRef = useRef(false);

  useEffect(() => {
    if (!userPos) sawMissingUserRef.current = true;
  }, [userPos]);

  useLayoutEffect(() => {
    if (!autoFitOnMount || initialView) return;
    if (!userPos || !sawMissingUserRef.current) return;
    if (introRanRef.current) return;
    introRanRef.current = true;

    map.stop();
    map.setView(BOLOGNA_CENTER, INTRO_OVERVIEW_ZOOM, { animate: false });
    const raf = requestAnimationFrame(() => {
      map.flyTo([userPos.lat, userPos.lng], INTRO_TARGET_ZOOM, {
        duration: 0.9,
        easeLinearity: 0.22,
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [map, userPos, initialView, autoFitOnMount]);

  return null;
}

function MapBounds({
  drops,
  userPos,
  autoFitOnMount = true,
}: {
  drops: Drop[];
  userPos: UserMapPosition | null;
  autoFitOnMount?: boolean;
}) {
  const map = useMap();
  const hasAutoFittedRef = useRef(false);
  const lastUserPosKeyRef = useRef<string>("");

  useEffect(() => {
    const userPosKey = userPos ? `${userPos.lat.toFixed(6)}:${userPos.lng.toFixed(6)}` : "";
    const prevKey = lastUserPosKeyRef.current;
    if (userPosKey === prevKey) return;
    // Prima posizione GPS dopo mount senza utente: non rifare fitBounds (altrimenti
    // sovrascrive l’overview + fly di MapIntroFlyFromOverview).
    if (prevKey === "" && userPosKey !== "") {
      lastUserPosKeyRef.current = userPosKey;
      return;
    }
    hasAutoFittedRef.current = false;
    lastUserPosKeyRef.current = userPosKey;
  }, [userPos]);

  useEffect(() => {
    if (!autoFitOnMount) return;
    if (hasAutoFittedRef.current) return;

    const points: L.LatLngExpression[] = drops.map((d) => [d.lat, d.lng]);
    if (userPos) {
      points.push([userPos.lat, userPos.lng]);
    }

    if (points.length === 0) {
      map.setView(BOLOGNA_CENTER, 12);
      hasAutoFittedRef.current = true;
      return;
    }

    if (points.length === 1) {
      const p = points[0] as [number, number];
      map.setView(p, 17);
      hasAutoFittedRef.current = true;
      return;
    }

    map.fitBounds(L.latLngBounds(points), {
      padding: [48, 48],
      maxZoom: 18,
    });
    hasAutoFittedRef.current = true;
  }, [map, drops, userPos, autoFitOnMount]);

  return null;
}

function MapZoomListener({
  onZoomLevelChange,
  onViewChange,
}: {
  onZoomLevelChange?: (zoom: number) => void;
  onViewChange?: (view: { centerLat: number; centerLng: number; zoom: number }) => void;
}) {
  const map = useMapEvents({
    zoomend: () => {
      onZoomLevelChange?.(map.getZoom());
      const c = map.getCenter();
      onViewChange?.({ centerLat: c.lat, centerLng: c.lng, zoom: map.getZoom() });
    },
    moveend: () => {
      const c = map.getCenter();
      onViewChange?.({ centerLat: c.lat, centerLng: c.lng, zoom: map.getZoom() });
    },
  });

  useEffect(() => {
    onZoomLevelChange?.(map.getZoom());
    const c = map.getCenter();
    onViewChange?.({ centerLat: c.lat, centerLng: c.lng, zoom: map.getZoom() });
  }, [map, onZoomLevelChange, onViewChange]);

  return null;
}

/** Pin “posizione” classico (SVG), distinto dai cerchi cluster blu. */
function nearbyOfferLocationPinIcon(fillColor: string): L.DivIcon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40" aria-hidden="true">
    <path d="M15 2C8.92 2 4 6.82 4 12.8c0 7.2 11 21.2 11 21.2s11-14 11-21.2C26 6.82 21.08 2 15 2z"
      fill="${fillColor}" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="15" cy="13" r="3.2" fill="#ffffff"/>
  </svg>`;
  return L.divIcon({
    className: "lmb-nearby-offer-pin",
    iconSize: [30, 40],
    iconAnchor: [15, 38],
    html: svg,
  });
}

const USER_POSITION_DOT_ICON = L.divIcon({
  className: "lmb-user-position-dot",
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  html: `<span style="
    display:block;
    width:14px;
    height:14px;
    border-radius:9999px;
    border:2px solid #ffffff;
    background:#484848;
    box-sizing:border-box;
  "></span>`,
});

const MapView = ({
  drops,
  radarRangeKm,
  onSelectDrop,
  userPos,
  onZoomLevelChange,
  onViewChange,
  initialView,
  autoFitOnMount = true,
}: MapViewProps) => {
  const radarRangeM = Math.max(0, Math.round(radarRangeKm * 1000));
  const nearbyDrops = useMemo(
    () =>
      !userPos
        ? drops
        : drops.filter(
            (d) => Number.isFinite(d.distance) && d.distance <= radarRangeM,
          ),
    [drops, radarRangeM, userPos],
  );
  const farClusters = useMemo<FarCluster[]>(() => {
    if (!userPos || radarRangeM <= 0) return [];
    const farDrops = drops.filter(
      (d) => Number.isFinite(d.distance) && d.distance > radarRangeM,
    );
    if (farDrops.length === 0) return [];

    const grouped = new Map<
      string,
      { latSum: number; lngSum: number; count: number }
    >();
    for (const drop of farDrops) {
      const key = encodeGeohash(drop.lat, drop.lng, HOTSPOT_GEOHASH_PRECISION);
      const current = grouped.get(key);
      if (!current) {
        grouped.set(key, { latSum: drop.lat, lngSum: drop.lng, count: 1 });
      } else {
        current.latSum += drop.lat;
        current.lngSum += drop.lng;
        current.count += 1;
      }
    }

    const clusters = Array.from(grouped.entries()).map(([key, agg]) => ({
      key,
      lat: agg.latSum / agg.count,
      lng: agg.lngSum / agg.count,
      count: agg.count,
    }));

    // Evita sovrapposizioni troppo strette mantenendo i cluster più densi.
    const kept = clusters
      .sort((a, b) => b.count - a.count)
      .filter((candidate, idx, arr) => {
        for (let i = 0; i < idx; i++) {
          const keptCluster = arr[i];
          const dM =
            haversineKm(
              candidate.lat,
              candidate.lng,
              keptCluster.lat,
              keptCluster.lng,
            ) * 1000;
          if (dM < HOTSPOT_MIN_RADIUS_M * 2) return false;
        }
        return true;
      });

    return kept.map((cluster) => {
      const angle = 2 * Math.PI * pseudoRandomUnitFromKey(cluster.key);
      const [displayLat, displayLng] = offsetLatLngMeters(
        cluster.lat,
        cluster.lng,
        HOTSPOT_PRIVACY_OFFSET_M,
        angle,
      );
      let nearestM = Number.POSITIVE_INFINITY;
      for (const other of kept) {
        if (other.key === cluster.key) continue;
        const dM =
          haversineKm(cluster.lat, cluster.lng, other.lat, other.lng) * 1000;
        nearestM = Math.min(nearestM, dM);
      }
      const antiOverlapLimitM = Number.isFinite(nearestM)
        ? nearestM * 0.45
        : HOTSPOT_MAX_RADIUS_M;
      const radiusM = Math.max(
        HOTSPOT_MIN_RADIUS_M,
        Math.min(HOTSPOT_MAX_RADIUS_M, antiOverlapLimitM),
      );
      return {
        ...cluster,
        lat: displayLat,
        lng: displayLng,
        radiusM,
      };
    });
  }, [drops, radarRangeM, userPos]);

  const center = useMemo((): [number, number] => {
    if (initialView) return [initialView.centerLat, initialView.centerLng];
    if (userPos) return [userPos.lat, userPos.lng];
    if (drops.length > 0) {
      const sum = drops.reduce(
        (acc, d) => ({ lat: acc.lat + d.lat, lng: acc.lng + d.lng }),
        { lat: 0, lng: 0 },
      );
      return [sum.lat / drops.length, sum.lng / drops.length];
    }
    return BOLOGNA_CENTER;
  }, [initialView, userPos, drops]);
  const initialZoom = initialView?.zoom ?? 13;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border/40 shadow-inner">
      <MapContainer
        center={center}
        zoom={initialZoom}
        className="lmb-map z-0 h-full w-full [&_.leaflet-control-attribution]:text-lmb-label"
        preferCanvas
        scrollWheelZoom
        zoomAnimation={false}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          attribution={TILE_ATTRIBUTION_CARTO}
          url={TILE_URL_CARTO_POSITRON}
          subdomains="abcd"
          maxZoom={20}
          maxNativeZoom={20}
        />
        <MapIntroFlyFromOverview
          userPos={userPos}
          initialView={initialView}
          autoFitOnMount={autoFitOnMount}
        />
        <MapBounds drops={drops} userPos={userPos} autoFitOnMount={autoFitOnMount} />
        <MapZoomListener onZoomLevelChange={onZoomLevelChange} onViewChange={onViewChange} />
        <ZoomControl position="topright" />
        {userPos && radarRangeM > 0 ? (
          <Circle
            center={[userPos.lat, userPos.lng]}
            radius={radarRangeM}
            pathOptions={{
              color: "#059669",
              fillColor: "#10b981",
              fillOpacity: 0.08,
              weight: 2.5,
              opacity: 0.85,
              dashArray: "10 8",
            }}
          />
        ) : null}
        {userPos ? (
          <Marker position={[userPos.lat, userPos.lng]} icon={USER_POSITION_DOT_ICON} />
        ) : null}
        {nearbyDrops.map((drop) => (
          <Marker
            key={drop.id}
            position={[drop.lat, drop.lng]}
            icon={nearbyOfferLocationPinIcon(
              drop.isGolden ? "#D4B483" : "hsl(11, 100%, 38%)",
            )}
            eventHandlers={{
              click: () => {
                onSelectDrop(drop);
              },
            }}
          />
        ))}
        {farClusters.map((cluster) => (
          <Circle
            key={`hotspot-${cluster.key}`}
            center={[cluster.lat, cluster.lng]}
            radius={cluster.radiusM}
            pathOptions={{
              color: "#2563eb",
              fillColor: "#3b82f6",
              fillOpacity: 0.12,
              weight: 1.5,
              opacity: 0.55,
              dashArray: "4 10",
            }}
          />
        ))}
        {farClusters.map((cluster) => (
          <Marker
            key={`hotspot-count-${cluster.key}`}
            position={[cluster.lat, cluster.lng]}
            icon={L.divIcon({
              className: "lmb-hotspot-badge",
              iconSize: [44, 32],
              iconAnchor: [22, 16],
              html: `<div style="
                position: relative;
                width: 44px;
                height: 32px;
              ">
                <div style="
                  position: absolute;
                  top: 0;
                  left: 0;
                  width: 44px;
                  height: 32px;
                  border-radius: 9999px;
                  background: #1d4ed8;
                  color: white;
                  border: 2px solid white;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 18px;
                  font-weight: 700;
                  line-height: 1;
                ">
                  <span>${cluster.count}</span>
                </div>
              </div>`,
            })}
          />
        ))}
      </MapContainer>

      <div className="pointer-events-none absolute bottom-4 left-4 z-[500] max-w-[11rem] rounded-2xl border border-border/50 bg-card/95 px-3 py-2 text-xs shadow-card backdrop-blur-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: "#484848" }}
            />
            <span className="text-muted-foreground">Tu</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-4 w-3 shrink-0 items-end justify-center pb-0.5">
              <svg
                width="12"
                height="16"
                viewBox="0 0 30 40"
                className="drop-shadow-sm"
              >
                <path
                  d="M15 2C8.92 2 4 6.82 4 12.8c0 7.2 11 21.2 11 21.2s11-14 11-21.2C26 6.82 21.08 2 15 2z"
                  fill="#FF7E5F"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <circle cx="15" cy="13" r="3.2" fill="#ffffff" />
              </svg>
            </span>
            <span className="text-muted-foreground">Offerta vicino a te!</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-5 shrink-0 rounded-sm border border-dashed border-blue-600/70 bg-blue-500/25"
              title="Area aggregata"
            />
            <span className="text-muted-foreground">Altre offerte attive</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
