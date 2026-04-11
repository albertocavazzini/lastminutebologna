import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Map, List, RefreshCw } from "lucide-react";
import type { Drop } from "@/data/mockDrops";
import DropCard from "@/components/DropCard";
import {
  datasetSupportaRadar,
  fetchMiniappOfferteJsonp,
  filterOffersRadarStyle,
  offertaToDrop,
} from "@/api/miniappOfferte";
import { projectEnv } from "@/config/projectEnv";

const MapView = lazy(() => import("@/components/MapView"));
import DropDetail from "@/components/DropDetail";
import BottomNav from "@/components/BottomNav";
import ProfileView from "@/components/ProfileView";
import MerchantDashboard from "@/components/MerchantDashboard";
import AlertsView from "@/components/AlertsView";

const Index = () => {
  const [activeTab, setActiveTab] = useState("radar");
  const [viewMode, setViewMode] = useState<"map" | "list">("list");
  const [selectedDrop, setSelectedDrop] = useState<Drop | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [geoDone, setGeoDone] = useState(false);

  const webAppBase = projectEnv.appsScriptWebAppBase?.trim() ?? "";

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["miniapp-offerte", webAppBase],
    queryFn: () => fetchMiniappOfferteJsonp(webAppBase),
    staleTime: 30_000,
    enabled: Boolean(webAppBase),
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoDone(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGeoDone(true);
      },
      () => setGeoDone(true),
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 15_000 },
    );
  }, []);

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
    isError && error instanceof Error ? error.message : data && !data.ok
      ? (data.error ?? "Risposta non valida")
      : null;

  return (
    <div className="relative mx-auto min-h-screen min-h-[100dvh] max-w-md bg-background">
      <header className="sticky top-0 z-30 glass-strong px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" strokeWidth={1.25} />
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              Flash<span className="text-primary">Drop</span>
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
              >
                <Map className="h-4 w-4" strokeWidth={1.25} />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="px-4 pt-3 pb-[calc(5rem+env(safe-area-inset-bottom,0px))]">
        <AnimatePresence mode="wait">
          {activeTab === "radar" && (
            <motion.div
              key="radar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {!webAppBase && (
                <p className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
                  <strong className="text-foreground">Nessun URL web app in build.</strong>{" "}
                  In locale: metti{" "}
                  <span className="font-mono">VITE_APPS_SCRIPT_WEBAPP_BASE</span> in{" "}
                  <span className="font-mono">MiniAppTelegram/.env</span> (URL{" "}
                  <span className="font-mono">…/exec</span>). Su{" "}
                  <strong className="text-foreground">GitHub Pages</strong>: aggiungi lo
                  stesso valore come secret{" "}
                  <span className="font-mono">VITE_APPS_SCRIPT_WEBAPP_BASE</span> in
                  Repository → Settings → Secrets and variables → Actions, poi rilancia
                  il workflow Deploy.
                </p>
              )}

              {webAppBase && (
                <div className="mb-3 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-1.5 text-xs font-medium text-foreground"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
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

              {geoDone && webAppBase && data?.ok && !userPos && (
                <p className="mb-3 rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  Abilita la{" "}
                  <strong className="text-foreground">posizione</strong> per
                  vedere sulla mappa e in elenco solo le offerte{" "}
                  <strong className="text-foreground">
                    attive adesso nel tuo raggio
                  </strong>{" "}
                  (stessa logica del radar sul bot: geohash + distanza massima).
                </p>
              )}

              {geoDone &&
                userPos &&
                data?.ok &&
                data.offerte &&
                data.offerte.length > 0 &&
                !datasetSupportaRadar(data.offerte) && (
                  <p className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
                    Le offerte dal server non includono ancora{" "}
                    <span className="font-mono">ghash</span> e coordinate: non
                    è possibile applicare il filtro radar. Controlla il deploy
                    Apps Script (<span className="font-mono">api_miniapp</span>).
                  </p>
                )}

              {viewMode === "map" ? (
                <div className="h-[calc(100dvh-10.5rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] min-h-[240px]">
                  <Suspense
                    fallback={
                      <div className="flex h-full items-center justify-center rounded-2xl border border-border/40 bg-muted/20 text-sm text-muted-foreground">
                        Caricamento mappa…
                      </div>
                    }
                  >
                    <MapView
                      drops={radarDrops}
                      onSelectDrop={setSelectedDrop}
                    />
                  </Suspense>
                  {userPos && radarDrops.length === 0 && data?.ok && !isPending && (
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                      Nessuna offerta attiva nel raggio da te in questo momento.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mb-1 flex items-center gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                    <span className="text-xs text-muted-foreground">
                      {userPos
                        ? `${radarDrops.length} offerte attive nel tuo raggio`
                        : "Posizione richiesta per l'elenco radar"}
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

          {activeTab === "merchant" && (
            <motion.div
              key="merchant"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <MerchantDashboard />
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
