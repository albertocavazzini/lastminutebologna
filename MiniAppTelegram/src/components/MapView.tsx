import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import type { Drop } from "@/data/mockDrops";

interface MapViewProps {
  drops: Drop[];
  onSelectDrop: (drop: Drop) => void;
}

const DEFAULT_CENTER = { lat: 41.9028, lng: 12.4964 };

function dropMarkerIcon(drop: Drop): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: drop.isGolden ? "#D4B483" : "#FF7E5F",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
    scale: 11,
  };
}

/** Non a livello modulo: `google` esiste solo dopo il loader della Maps API. */
function getUserMarkerIcon(): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: "#484848",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
    scale: 9,
  };
}

function MissingKeyFallback() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-2xl border border-border/50 bg-card p-6 text-center shadow-inner">
      <p className="text-sm font-semibold text-foreground">
        Google Maps non configurata
      </p>
      <p className="max-w-[280px] text-xs leading-relaxed text-muted-foreground">
        Crea una chiave con{" "}
        <span className="font-mono text-foreground">
          Maps JavaScript API
        </span>{" "}
        attiva, poi aggiungi in{" "}
        <span className="font-mono text-foreground">.env</span>:
      </p>
      <code className="rounded-lg bg-secondary px-3 py-2 text-left text-[11px] text-foreground">
        VITE_GOOGLE_MAPS_API_KEY=la_tua_chiave
      </code>
      <p className="text-[10px] text-muted-foreground">
        Riavvia <span className="font-mono">npm run dev</span> dopo aver salvato.
      </p>
    </div>
  );
}

interface GoogleMapInnerProps {
  apiKey: string;
  drops: Drop[];
  onSelectDrop: (drop: Drop) => void;
}

function GoogleMapInner({ apiKey, drops, onSelectDrop }: GoogleMapInnerProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    id: "flashdrop-map",
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [userPos, setUserPos] = useState<google.maps.LatLngLiteral | null>(
    null,
  );

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 12_000 },
    );
  }, []);

  const center = useMemo(() => {
    if (userPos) return userPos;
    if (drops.length === 0) return DEFAULT_CENTER;
    const sum = drops.reduce(
      (acc, d) => ({ lat: acc.lat + d.lat, lng: acc.lng + d.lng }),
      { lat: 0, lng: 0 },
    );
    return { lat: sum.lat / drops.length, lng: sum.lng / drops.length };
  }, [userPos, drops]);

  const fitMapToDrops = useCallback(
    (map: google.maps.Map) => {
      const bounds = new google.maps.LatLngBounds();
      drops.forEach((d) => bounds.extend({ lat: d.lat, lng: d.lng }));
      if (userPos) bounds.extend(userPos);
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, 64);
      } else {
        map.setCenter(center);
        map.setZoom(15);
      }
    },
    [drops, userPos, center],
  );

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      fitMapToDrops(map);
    },
    [fitMapToDrops],
  );

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    fitMapToDrops(mapRef.current);
  }, [isLoaded, fitMapToDrops]);

  const mapOptions = useMemo(
    (): google.maps.MapOptions => ({
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      clickableIcons: false,
    }),
    [],
  );

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-destructive/30 bg-card p-4 text-center text-sm text-destructive">
        Errore nel caricamento di Google Maps. Controlla la API key e il
        billing su Google Cloud.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-border/40 bg-muted/30 text-sm text-muted-foreground">
        Caricamento mappa…
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border/40 shadow-inner">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={center}
        zoom={15}
        onLoad={onLoad}
        options={mapOptions}
      >
        {userPos && (
          <Marker
            position={userPos}
            icon={getUserMarkerIcon()}
            zIndex={1000}
            title="La tua posizione"
          />
        )}
        {drops.map((drop) => (
          <Marker
            key={drop.id}
            position={{ lat: drop.lat, lng: drop.lng }}
            icon={dropMarkerIcon(drop)}
            title={`${drop.merchant} — ${drop.title}`}
            onClick={() => onSelectDrop(drop)}
            zIndex={drop.isGolden ? 500 : 400}
          />
        ))}
      </GoogleMap>

      <div className="pointer-events-none absolute bottom-4 left-4 z-[1] rounded-2xl border border-border/50 bg-card/95 px-3 py-2 text-xs shadow-card backdrop-blur-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: "#484848" }}
            />
            <span className="text-muted-foreground">Tu</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: "#FF7E5F" }}
            />
            <span className="text-muted-foreground">FlashDrop</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: "#D4B483" }}
            />
            <span className="text-muted-foreground">GoldenDrop</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const MapView = ({ drops, onSelectDrop }: MapViewProps) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ?? "";

  if (!apiKey) {
    return <MissingKeyFallback />;
  }

  return (
    <GoogleMapInner
      apiKey={apiKey}
      drops={drops}
      onSelectDrop={onSelectDrop}
    />
  );
};

export default MapView;
