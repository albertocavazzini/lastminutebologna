import type { TouchEventHandler } from "react";
import { motion } from "framer-motion";
import { Expand, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import DropCard from "@/components/DropCard";
import MapView from "@/components/MapView";
import {
  datasetSupportaRadar,
  type MiniappOfferteResponse,
} from "@/api/miniappOfferte";
import type { Drop } from "@/data/mockDrops";
import type { UserMapPosition } from "@/lib/geo/userMapPosition";

type RadarTabContentProps = {
  webAppBase: string;
  isPending: boolean;
  apiErrorMessage: string | null;
  geoDone: boolean;
  geoDenied: boolean;
  geoLoading: boolean;
  userPos: UserMapPosition | null;
  data: MiniappOfferteResponse | undefined;
  radarDrops: Drop[];
  allDrops: Drop[];
  radarRangeKm: number;
  dataUpdatedAtMs: number;
  viewMode: "map" | "list";
  onRequestLocation: () => void;
  onSelectDrop: (drop: Drop) => void;
  onRadarTouchStart: TouchEventHandler<HTMLDivElement>;
  onRadarTouchMove: TouchEventHandler<HTMLDivElement>;
  onRadarTouchEnd: TouchEventHandler<HTMLDivElement>;
  isMapFullscreen: boolean;
  onMapFullscreenChange: (next: boolean) => void;
  onCompactMapZoomLevelChange: (zoom: number) => void;
  onCompactMapViewChange: (view: { centerLat: number; centerLng: number; zoom: number }) => void;
  compactMapView: { centerLat: number; centerLng: number; zoom: number } | null;
};

const RadarTabContent = ({
  webAppBase,
  isPending,
  apiErrorMessage,
  geoDone,
  geoDenied,
  geoLoading,
  userPos,
  data,
  radarDrops,
  allDrops,
  radarRangeKm,
  dataUpdatedAtMs,
  viewMode,
  onRequestLocation,
  onSelectDrop,
  onRadarTouchStart,
  onRadarTouchMove,
  onRadarTouchEnd,
  isMapFullscreen,
  onMapFullscreenChange,
  onCompactMapZoomLevelChange,
  onCompactMapViewChange,
  compactMapView,
}: RadarTabContentProps) => {
  return (
    <motion.div
      key="radar"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {!webAppBase && (
        <div className="mb-3 space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-xs leading-relaxed text-amber-900 dark:text-amber-100">
          <p>
            <strong className="text-foreground">URL web app mancante.</strong>{" "}
            Apri{" "}
            <span className="font-mono">
              MiniAppTelegram/public/runtime-config.json
            </span>
            , metti il tuo link{" "}
            <span className="font-mono">
              https://script.google.com/macros/s/…/exec
            </span>{" "}
            in <span className="font-mono">appsScriptWebAppBase</span>, poi
            commit e push.
          </p>
          <p className="text-[11px] opacity-90">
            Prova rapida senza commit: aggiungi alla fine dell&apos;indirizzo
            della mini app <span className="font-mono">#exec=</span> più
            l&apos;URL codificato con{" "}
            <span className="font-mono">encodeURIComponent</span> (anche da
            console browser). Oppure <span className="font-mono">.env</span> /
            secret GitHub{" "}
            <span className="font-mono">VITE_APPS_SCRIPT_WEBAPP_BASE</span>.
          </p>
        </div>
      )}

      {isPending && webAppBase && !data?.ok && (
        <p className="text-sm text-muted-foreground">Caricamento offerte…</p>
      )}
      {!isPending && viewMode === "map" && userPos && radarDrops.length === 0 && data?.ok && (
        <p className="mb-3 text-sm text-muted-foreground">
          Nessuna offerta attiva vicino a te.
        </p>
      )}

      {apiErrorMessage && (
        <p className="mb-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {apiErrorMessage}
        </p>
      )}

      {webAppBase && geoDenied && !userPos && (
        <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-3">
          <p className="text-xs text-amber-900 dark:text-amber-100">
            <strong className="text-foreground">Posizione disattivata.</strong>{" "}
            Per ricevere notifiche vicine abilita la posizione per Telegram nelle impostazioni del
            telefono, poi torna qui e tocca il pulsante sotto.
          </p>
        </div>
      )}

      {webAppBase && geoDone && !userPos && (
        <div className="mb-3 space-y-3 rounded-xl border border-border/60 bg-muted/40 px-3 py-3">
          <p className="text-xs text-muted-foreground">
            {geoDenied ? (
              <>
                <strong className="text-foreground">Posizione bloccata.</strong>{" "}
                Su iPhone/Android apri le impostazioni di sistema per Telegram e
                consenti la posizione, oppure tocca di nuovo qui sotto dopo
                averlo abilitato.
              </>
            ) : (
              <>
                Su <strong className="text-foreground">Telegram</strong> il GPS
                spesso parte solo dopo un{" "}
                <strong className="text-foreground">tocco</strong>. Serve per il
                radar (geohash + distanza come sul bot).
              </>
            )}
          </p>
          {navigator.geolocation ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full rounded-xl"
              disabled={geoLoading}
              onClick={onRequestLocation}
            >
              <MapPin className="mr-2 h-4 w-4" strokeWidth={1.25} />
              {geoLoading
                ? "Rilevazione posizione…"
                : "Attiva posizione per il radar"}
            </Button>
          ) : (
            <p className="text-xs text-destructive">
              Questo dispositivo non espone la geolocalizzazione al browser.
            </p>
          )}
        </div>
      )}

      {geoDone &&
        userPos &&
        data?.ok &&
        data.offerte &&
        data.offerte.length > 0 &&
        !datasetSupportaRadar(data.offerte) && (
          <p className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
            Le offerte dal server non includono ancora{" "}
            <span className="font-mono">ghash</span> e coordinate: non è
            possibile applicare il filtro radar. Controlla il deploy Apps Script
            (<span className="font-mono">api_miniapp</span>).
          </p>
        )}

      {viewMode === "map" ? (
        <div className="lmb-map-viewport-height">
          {!isMapFullscreen ? (
            <div className="relative h-full w-full">
              <MapView
                drops={allDrops}
                radarRangeKm={radarRangeKm}
                onSelectDrop={onSelectDrop}
                userPos={userPos}
                onZoomLevelChange={onCompactMapZoomLevelChange}
                onViewChange={onCompactMapViewChange}
                initialView={compactMapView}
                autoFitOnMount={!compactMapView}
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="pointer-events-auto absolute right-3 top-3 z-[600] rounded-full px-2.5"
                onClick={() => onMapFullscreenChange(true)}
              >
                <Expand className="h-4 w-4" />
                Schermo intero
              </Button>
            </div>
          ) : (
            <div className="lmb-map-fullscreen fixed inset-0 z-[1200] bg-background">
              <div className="relative h-full w-full">
                <MapView
                  drops={allDrops}
                  radarRangeKm={radarRangeKm}
                  onSelectDrop={(drop) => {
                    onSelectDrop(drop);
                    onMapFullscreenChange(false);
                  }}
                  userPos={userPos}
                  onZoomLevelChange={onCompactMapZoomLevelChange}
                  onViewChange={onCompactMapViewChange}
                  initialView={compactMapView}
                  autoFitOnMount={false}
                />
                <Button
                  type="button"
                  size="lg"
                  variant="secondary"
                  className="lmb-map-fullscreen-close pointer-events-auto absolute right-3 z-[1300] rounded-full px-3"
                  onClick={() => onMapFullscreenChange(false)}
                >
                  <X className="h-4 w-4" />
                  Chiudi schermo intero
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          className="space-y-3 overscroll-y-contain"
          style={{ overscrollBehaviorY: "contain" }}
          onTouchStart={onRadarTouchStart}
          onTouchMove={onRadarTouchMove}
          onTouchEnd={onRadarTouchEnd}
          onTouchCancel={onRadarTouchEnd}
        >
          {!isPending ? (
            <div className="mb-1 flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">
                {!webAppBase
                  ? "Prima configura l'URL della web app (vedi sopra)"
                  : userPos
                    ? `${radarDrops.length} offerte attive nel tuo raggio`
                    : "Tocca «Attiva posizione» per l'elenco radar"}
              </span>
            </div>
          ) : null}
          {userPos &&
            radarDrops.map((drop, i) => (
              <DropCard
                key={drop.id}
                drop={drop}
                index={i}
                dataUpdatedAtMs={dataUpdatedAtMs}
                onSelect={onSelectDrop}
              />
            ))}
        </div>
      )}
    </motion.div>
  );
};

export default RadarTabContent;
