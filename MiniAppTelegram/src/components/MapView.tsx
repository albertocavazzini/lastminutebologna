import { useEffect, useMemo } from "react";
import {
  Circle,
  CircleMarker,
  MapContainer,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { Drop } from "@/data/mockDrops";
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
  onSelectDrop: (drop: Drop) => void;
  /** Stessa posizione usata per il radar in lista (evita una seconda richiesta GPS). */
  userPos: UserMapPosition | null;
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

const MapView = ({ drops, onSelectDrop, userPos }: MapViewProps) => {
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
        {drops.map((drop) => (
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
