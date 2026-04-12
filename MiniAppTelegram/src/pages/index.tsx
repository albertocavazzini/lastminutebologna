import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Map,
  List,
  RefreshCw,
  MapPin,
  MessageSquare,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Drop } from "@/data/mockDrops";
import DropCard from "@/components/DropCard";
import {
  datasetSupportaRadar,
  fetchMiniappOfferteJsonp,
  filterOffersRadarStyle,
  offertaToDrop,
} from "@/api/miniappOfferte";
import { projectEnv } from "@/config/projectEnv";
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
import MapView from "@/components/MapView";

/** Se la cache è più recente, non richiamiamo il GPS aprendo la mappa (meno prompt nel WebView). */
const REFINE_MAP_MIN_INTERVAL_MS = 30 * 60 * 1000;

/** Polling offerte sul tab radar (mappa/elenco); fermo su altre tab per risparmiare quota Apps Script. */
const RADAR_OFFERTE_REFETCH_MS = 30_000;
import DropDetail from "@/components/DropDetail";
import BottomNav from "@/components/BottomNav";
import ProfileView from "@/components/ProfileView";
import PrenotazioniView, {
  type PrenotazioniSubView,
} from "@/components/PrenotazioniView";
import AlertsView from "@/components/AlertsView";

const Index = () => {
  const [activeTab, setActiveTab] = useState("radar");
  const [viewMode, setViewMode] = useState<"map" | "list">("list");
  const [prenotazioniSubView, setPrenotazioniSubView] =
    useState<PrenotazioniSubView>("lista");
  const [selectedDrop, setSelectedDrop] = useState<Drop | null>(null);
  const [userPos, setUserPos] = useState<UserMapPosition | null>(() =>
    typeof window !== "undefined" ? readGeoCache() : null,
  );
  const [geoDone, setGeoDone] = useState(
    () => typeof window !== "undefined" && readGeoCache() !== null,
  );
  const [geoDenied, setGeoDenied] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [manualOffersRefresh, setManualOffersRefresh] = useState(false);

  const webAppBase = projectEnv.appsScriptWebAppBase?.trim() ?? "";

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

  /** Aggiorna solo coordinate (senza resettare geoDone / loading): utile aprendo la mappa. */
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
    if (readGeoCache()) {
      return;
    }
    requestLocation();
  }, [requestLocation]);

  /** Nuovo fix GPS passando a vista mappa solo se la cache non è fresca (evita prompt ripetuti). */
  const prevViewMode = useRef(viewMode);
  useEffect(() => {
    if (
      activeTab === "radar" &&
      viewMode === "map" &&
      prevViewMode.current !== "map"
    ) {
      const savedAt = getGeoCacheSavedAt();
      if (
        savedAt == null ||
        Date.now() - savedAt >= REFINE_MAP_MIN_INTERVAL_MS
      ) {
        refineLocation();
      }
    }
    prevViewMode.current = viewMode;
  }, [activeTab, viewMode, refineLocation]);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["miniapp-offerte", webAppBase],
    queryFn: () => fetchMiniappOfferteJsonp(webAppBase),
    staleTime: 30_000,
    enabled: Boolean(webAppBase),
    refetchInterval: activeTab === "radar" ? RADAR_OFFERTE_REFETCH_MS : false,
  });

  const refreshOffersManual = useCallback(() => {
    setManualOffersRefresh(true);
    void refetch().finally(() => setManualOffersRefresh(false));
  }, [refetch]);

  const radarDrops = useMemo(() => {
    if (!data?.ok || !data.offerte?.length || !userPos) return [];
    const raw = data.offerte;
    if (!datasetSupportaRadar(raw)) return [];
    const raggio = data.raggio_km ?? 5.12;
    const prec = data.geo_precisione ?? 6;
    const filtered = filterOffersRadarStyle(
      raw,
      userPos.lat,
      userPos.lng,
      raggio,
      prec,
    );
    return filtered
      .map((o) => offertaToDrop(o, userPos.lat, userPos.lng))
      .sort((a, b) => a.distance - b.distance);
  }, [data, userPos]);

  const apiErrorMessage =
    isError && error instanceof Error
      ? error.message
      : data && !data.ok
        ? (data.error ?? "Risposta non valida")
        : null;

  return (
    <div className="relative mx-auto min-h-screen min-h-[100dvh] max-w-md bg-background">
      <header className="lmb-header-safe-pt sticky top-0 z-30 glass-strong px-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" strokeWidth={1.25} />
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              LastMinute<span className="text-primary">Bologna</span>
            </h1>
          </div>

          {activeTab === "radar" && (
            <div className="flex items-center gap-1 rounded-lg bg-secondary/50 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`rounded-md p-1.5 transition-colors ${
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
                aria-label="Elenco offerte"
              >
                <List className="h-4 w-4" strokeWidth={1.25} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={`rounded-md p-1.5 transition-colors ${
                  viewMode === "map"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
                aria-label="Mappa"
              >
                <Map className="h-4 w-4" strokeWidth={1.25} />
              </button>
            </div>
          )}

          {activeTab === "prenotazioni" && (
            <div className="flex items-center gap-1 rounded-lg bg-secondary/50 p-0.5">
              <button
                type="button"
                onClick={() => setPrenotazioniSubView("lista")}
                className={`rounded-md p-1.5 transition-colors ${
                  prenotazioniSubView === "lista"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
                aria-label="Prenotazioni e QR"
              >
                <Ticket className="h-4 w-4" strokeWidth={1.25} />
              </button>
              <button
                type="button"
                onClick={() => setPrenotazioniSubView("feedback")}
                className={`rounded-md p-1.5 transition-colors ${
                  prenotazioniSubView === "feedback"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
                aria-label="Feedback"
              >
                <MessageSquare className="h-4 w-4" strokeWidth={1.25} />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="lmb-main-scroll-pb px-4 pt-3">
        <AnimatePresence mode="wait">
          {activeTab === "radar" && (
            <motion.div
              key="radar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {!webAppBase && (
                <div className="mb-3 space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-xs leading-relaxed text-amber-900 dark:text-amber-100">
                  <p>
                    <strong className="text-foreground">
                      URL web app mancante.
                    </strong>{" "}
                    Apri{" "}
                    <span className="font-mono">
                      MiniAppTelegram/public/runtime-config.json
                    </span>
                    , metti il tuo link{" "}
                    <span className="font-mono">
                      https://script.google.com/macros/s/…/exec
                    </span>{" "}
                    in <span className="font-mono">appsScriptWebAppBase</span>,
                    poi commit e push.
                  </p>
                  <p className="text-[11px] opacity-90">
                    Prova rapida senza commit: aggiungi alla fine
                    dell&apos;indirizzo della mini app{" "}
                    <span className="font-mono">#exec=</span> più l&apos;URL
                    codificato con{" "}
                    <span className="font-mono">encodeURIComponent</span> (anche
                    da console browser). Oppure{" "}
                    <span className="font-mono">.env</span> / secret GitHub{" "}
                    <span className="font-mono">
                      VITE_APPS_SCRIPT_WEBAPP_BASE
                    </span>
                    .
                  </p>
                </div>
              )}

              {webAppBase && (
                <div className="mb-3 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => refreshOffersManual()}
                    disabled={manualOffersRefresh}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-1.5 text-xs font-medium text-foreground"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${manualOffersRefresh ? "animate-spin" : ""}`}
                      strokeWidth={1.25}
                    />
                    Aggiorna
                  </button>
                  {data?.ok && typeof data.raggio_km === "number" && (
                    <span className="text-[11px] text-muted-foreground">
                      Raggio radar ≈ {data.raggio_km.toFixed(2)} km
                    </span>
                  )}
                </div>
              )}

              {isPending && webAppBase && (
                <p className="text-sm text-muted-foreground">
                  Caricamento offerte…
                </p>
              )}

              {apiErrorMessage && (
                <p className="mb-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {apiErrorMessage}
                </p>
              )}

              {webAppBase && geoDone && !userPos && (
                <div className="mb-3 space-y-3 rounded-xl border border-border/60 bg-muted/40 px-3 py-3">
                  <p className="text-xs text-muted-foreground">
                    {geoDenied ? (
                      <>
                        <strong className="text-foreground">
                          Posizione bloccata.
                        </strong>{" "}
                        Su iPhone/Android apri le impostazioni di sistema per
                        Telegram e consenti la posizione, oppure tocca di nuovo
                        qui sotto dopo averlo abilitato.
                      </>
                    ) : (
                      <>
                        Su <strong className="text-foreground">Telegram</strong>{" "}
                        il GPS spesso parte solo dopo un{" "}
                        <strong className="text-foreground">tocco</strong>.
                        Serve per il radar (geohash + distanza come sul bot).
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
                      onClick={() => requestLocation()}
                    >
                      <MapPin className="mr-2 h-4 w-4" strokeWidth={1.25} />
                      {geoLoading
                        ? "Rilevazione posizione…"
                        : "Attiva posizione per il radar"}
                    </Button>
                  ) : (
                    <p className="text-xs text-destructive">
                      Questo dispositivo non espone la geolocalizzazione al
                      browser.
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
                    possibile applicare il filtro radar. Controlla il deploy
                    Apps Script (<span className="font-mono">api_miniapp</span>
                    ).
                  </p>
                )}

              {viewMode === "map" ? (
                <div className="lmb-map-viewport-height">
                  <MapView
                    drops={radarDrops}
                    onSelectDrop={setSelectedDrop}
                    userPos={userPos}
                  />
                  {userPos &&
                    radarDrops.length === 0 &&
                    data?.ok &&
                    !isPending && (
                      <p className="mt-2 text-center text-xs text-muted-foreground">
                        Nessuna offerta attiva nel raggio da te in questo
                        momento.
                      </p>
                    )}
                </div>
              ) : (
                <div className="space-y-3">
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
                  {userPos &&
                    radarDrops.map((drop, i) => (
                      <DropCard
                        key={drop.id}
                        drop={drop}
                        index={i}
                        onSelect={setSelectedDrop}
                      />
                    ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "alerts" && (
            <motion.div
              key="alerts"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AlertsView />
            </motion.div>
          )}

          {activeTab === "prenotazioni" && (
            <motion.div
              key="prenotazioni"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <PrenotazioniView subView={prenotazioniSubView} />
            </motion.div>
          )}

          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ProfileView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <DropDetail drop={selectedDrop} onClose={() => setSelectedDrop(null)} />

      <BottomNav active={activeTab} onNavigate={setActiveTab} />
    </div>
  );
};

export default Index;
