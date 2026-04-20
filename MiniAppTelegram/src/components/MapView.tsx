import { useEffect, useMemo } from "react";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { Drop } from "@/data/mockDrops";
import { encodeGeohash } from "@/lib/geo/geohash";
import { haversineKm } from "@/lib/geo/distanceKm";
import type { UserMapPosition } from "@/lib/geo/userMapPosition";
import "leaflet/dist/leaflet.css";

/** Centro Bologna (MVP radar last minute). */
const BOLOGNA_CENTER: [number, number] = [44.4949, 11.3426];

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
  const dLng = (distanceM * Math.sin(bearingRad)) / (111_320 * Math.cos((lat * Math.PI) / 180));
  return [lat + dLat, lng + dLng];
}

function MapBounds({
  drops,
  userPos,
}: {
  drops: Drop[];
  userPos: UserMapPosition | null;
}) {
  const map = useMap();

  useEffect(() => {
    const points: L.LatLngExpression[] = drops.map((d) => [d.lat, d.lng]);
    if (userPos) {
      points.push([userPos.lat, userPos.lng]);
    }

    if (points.length === 0) {
      map.setView(BOLOGNA_CENTER, 12);
      return;
    }

    if (points.length === 1) {
      const p = points[0] as [number, number];
      map.setView(p, 17);
      return;
    }

    map.fitBounds(L.latLngBounds(points), {
      padding: [48, 48],
      maxZoom: 18,
    });
  }, [map, drops, userPos]);

  return null;
}

const MapView = ({ drops, radarRangeKm, onSelectDrop, userPos }: MapViewProps) => {
  const radarRangeM = Math.max(0, Math.round(radarRangeKm * 1000));
  const nearbyDrops = useMemo(
    () =>
      !userPos
        ? drops
        : drops.filter((d) => Number.isFinite(d.distance) && d.distance <= radarRangeM),
    [drops, radarRangeM, userPos],
  );
  const farClusters = useMemo<FarCluster[]>(() => {
    if (!userPos || radarRangeM <= 0) return [];
    const farDrops = drops.filter(
      (d) => Number.isFinite(d.distance) && d.distance > radarRangeM,
    );
    if (farDrops.length === 0) return [];

    const grouped = new Map<string, { latSum: number; lngSum: number; count: number }>();
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
            haversineKm(candidate.lat, candidate.lng, keptCluster.lat, keptCluster.lng) * 1000;
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
        const dM = haversineKm(cluster.lat, cluster.lng, other.lat, other.lng) * 1000;
        nearestM = Math.min(nearestM, dM);
      }
      const antiOverlapLimitM = Number.isFinite(nearestM) ? nearestM * 0.45 : HOTSPOT_MAX_RADIUS_M;
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
    if (userPos) return [userPos.lat, userPos.lng];
    if (drops.length > 0) {
      const sum = drops.reduce(
        (acc, d) => ({ lat: acc.lat + d.lat, lng: acc.lng + d.lng }),
        { lat: 0, lng: 0 },
      );
      return [sum.lat / drops.length, sum.lng / drops.length];
    }
    return BOLOGNA_CENTER;
  }, [userPos, drops]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border/40 shadow-inner">
      <MapContainer
        center={center}
        zoom={13}
        className="z-0 h-full w-full [&_.leaflet-control-attribution]:text-[10px]"
        scrollWheelZoom
      >
        <TileLayer
          attribution={TILE_ATTRIBUTION_CARTO}
          url={TILE_URL_CARTO_POSITRON}
          subdomains="abcd"
          maxZoom={20}
          maxNativeZoom={20}
        />
        <MapBounds drops={drops} userPos={userPos} />
        {userPos && userPos.accuracyM != null && userPos.accuracyM > 0 ? (
          <Circle
            center={[userPos.lat, userPos.lng]}
            radius={Math.min(userPos.accuracyM, 1500)}
            pathOptions={{
              color: "#484848",
              fillColor: "#484848",
              fillOpacity: 0.14,
              weight: 1,
              opacity: 0.5,
            }}
          />
        ) : null}
        {userPos ? (
          <CircleMarker
            center={[userPos.lat, userPos.lng]}
            radius={7}
            pathOptions={{
              color: "#ffffff",
              weight: 2,
              fillColor: "#484848",
              fillOpacity: 1,
            }}
          />
        ) : null}
        {nearbyDrops.map((drop) => (
          <CircleMarker
            key={drop.id}
            center={[drop.lat, drop.lng]}
            radius={9}
            pathOptions={{
              color: "#ffffff",
              weight: 2,
              fillColor: drop.isGolden ? "#D4B483" : "#FF7E5F",
              fillOpacity: 1,
            }}
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
              color: "#3b82f6",
              fillColor: "#3b82f6",
              fillOpacity: 0.16,
              weight: 1.5,
              opacity: 0.45,
            }}
          />
        ))}
        {farClusters.map((cluster) => (
          <Marker
            key={`hotspot-count-${cluster.key}`}
            position={[cluster.lat, cluster.lng]}
            icon={L.divIcon({
              className: "lmb-hotspot-badge",
              iconSize: [28, 28],
              iconAnchor: [14, 14],
              html: `<div style="
                width: 28px;
                height: 28px;
                border-radius: 999px;
                background: #1d4ed8;
                color: white;
                border: 2px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.25);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 700;
                line-height: 1;
              ">${cluster.count}</div>`,
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
          {userPos?.accuracyM != null && userPos.accuracyM > 0 ? (
            <p className="pl-5 text-[10px] leading-tight text-muted-foreground/90">
              Cerchio ≈ incertezza GPS (~{userPos.accuracyM}&nbsp;m)
            </p>
          ) : null}
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: "#FF7E5F" }}
            />
            <span className="text-muted-foreground">Offerta</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: "#D4B483" }}
            />
            <span className="text-muted-foreground">GoldenDrop</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: "#3b82f6" }}
            />
            <span className="text-muted-foreground">Fuori raggio (conteggio)</span>
          </div>
          <p className="mt-1 border-t border-border/40 pt-1.5 text-[10px] leading-tight text-muted-foreground/85">
            I punti dei locali seguono lat/long salvate in anagrafica (geocoding
            o mappa usata in inserimento).
          </p>
        </div>
      </div>
    </div>
  );
};

export default MapView;
