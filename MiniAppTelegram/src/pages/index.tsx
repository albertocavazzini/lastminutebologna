import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import type { Drop } from "@/data/mockDrops";
import {
  fetchMiniappPrenotazioniJsonp,
  MINIAPP_PRENOTAZIONI_STALE_MS,
} from "@/api/miniappPrenotazioni";
import { projectEnv } from "@/config/projectEnv";
import { getTelegramInitData } from "@/lib/telegramWebApp";
import { usePullToRefresh } from "@/features/radar/hooks/usePullToRefresh";
import { useRadarOfferte } from "@/features/radar/hooks/useRadarOfferte";
import { useRadarLocation } from "@/features/radar/hooks/useRadarLocation";
import { useVisibilityPrenotazioniRefresh } from "@/features/radar/hooks/useVisibilityPrenotazioniRefresh";
import BottomNav from "@/components/BottomNav";
import DropDetail from "@/components/DropDetail";
import ProfileView from "@/components/ProfileView";
import PrenotazioniView, {
  type PrenotazioniSubView,
} from "@/components/PrenotazioniView";
import MainTopBar from "@/features/radar/components/MainTopBar";
import RadarTabContent from "@/features/radar/components/RadarTabContent";

const Index = () => {
  const MAP_ZOOM_FULL_SCOPE_THRESHOLD = 14.5;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("radar");
  const [viewMode, setViewMode] = useState<"map" | "list">("list");
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [isMapZoomedOut, setIsMapZoomedOut] = useState(false);
  const [compactMapView, setCompactMapView] = useState<{
    centerLat: number;
    centerLng: number;
    zoom: number;
  } | null>(null);
  const [prenotazioniSubView, setPrenotazioniSubView] =
    useState<PrenotazioniSubView>("lista");
  const [selectedDrop, setSelectedDrop] = useState<Drop | null>(null);
  const {
    userPos,
    geoDone,
    geoDenied,
    geoLoading,
    requestLocation,
    handleViewModeChange,
  } = useRadarLocation();

  const webAppBase = projectEnv.appsScriptWebAppBase?.trim() ?? "";
  const initData = getTelegramInitData();

  useEffect(() => {
    handleViewModeChange(activeTab, viewMode);
  }, [activeTab, viewMode, handleViewModeChange]);

  useEffect(() => {
    if (activeTab !== "radar" || viewMode !== "map") {
      setIsMapFullscreen(false);
      setIsMapZoomedOut(false);
    }
  }, [activeTab, viewMode]);

  useVisibilityPrenotazioniRefresh(queryClient);

  const {
    data,
    radarDrops,
    allDrops,
    radarRangeKm,
    dataUpdatedAtMs,
    isPending,
    isError,
    error,
    refetch: refetchOfferte,
  } = useRadarOfferte({
    webAppBase,
    activeTab,
    userPos,
    viewMode,
    isMapFullscreen,
    isMapZoomedOut,
  });

  const { data: prenotazioniData } = useQuery({
    queryKey: ["miniapp-prenotazioni", webAppBase, initData.slice(0, 80)],
    queryFn: () => fetchMiniappPrenotazioniJsonp(webAppBase, initData),
    enabled: Boolean(webAppBase && initData),
    staleTime: MINIAPP_PRENOTAZIONI_STALE_MS,
    refetchOnWindowFocus: false,
  });

  /** Solo prenotazioni con QR ancora da usare: dopo validazione si può riprenotare. */
  const idsOfferteConPrenotazione = useMemo(() => {
    const s = new Set<string>();
    if (!prenotazioniData?.ok || !prenotazioniData.prenotazioni) return s;
    for (const p of prenotazioniData.prenotazioni) {
      if (p.validata) continue;
      const id = String(p.id_offerta || "").trim();
      if (id) s.add(id);
    }
    return s;
  }, [prenotazioniData]);

  const apiErrorMessage =
    isError && error instanceof Error
      ? error.message
      : data && !data.ok
        ? (data.error ?? "Risposta non valida")
        : null;

  const isPullRefreshEnabled = activeTab === "radar" && viewMode === "list" && Boolean(webAppBase);
  const {
    onTouchStart: onRadarTouchStart,
    onTouchMove: onRadarTouchMove,
    onTouchEnd: onRadarTouchEnd,
  } = usePullToRefresh(isPullRefreshEnabled, refetchOfferte);

  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-md bg-background">
      <MainTopBar
        activeTab={activeTab}
        viewMode={viewMode}
        prenotazioniSubView={prenotazioniSubView}
        onChangeViewMode={setViewMode}
        onChangePrenotazioniSubView={setPrenotazioniSubView}
      />

      <main className="lmb-main-scroll-pb px-4 pt-3">
        <AnimatePresence mode="wait">
          {activeTab === "radar" && (
            <RadarTabContent
              webAppBase={webAppBase}
              isPending={isPending}
              apiErrorMessage={apiErrorMessage}
              geoDone={geoDone}
              geoDenied={geoDenied}
              geoLoading={geoLoading}
              userPos={userPos}
              data={data}
              radarDrops={radarDrops}
              allDrops={allDrops}
              radarRangeKm={radarRangeKm}
              dataUpdatedAtMs={dataUpdatedAtMs}
              viewMode={viewMode}
              onRequestLocation={requestLocation}
              onSelectDrop={setSelectedDrop}
              onRadarTouchStart={onRadarTouchStart}
              onRadarTouchMove={onRadarTouchMove}
              onRadarTouchEnd={onRadarTouchEnd}
              isMapFullscreen={isMapFullscreen}
              onMapFullscreenChange={setIsMapFullscreen}
              onCompactMapZoomLevelChange={(zoom) =>
                setIsMapZoomedOut(zoom <= MAP_ZOOM_FULL_SCOPE_THRESHOLD)
              }
              onCompactMapViewChange={setCompactMapView}
              compactMapView={compactMapView}
            />
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

      <DropDetail
        drop={selectedDrop}
        onClose={() => setSelectedDrop(null)}
        idsOfferteConPrenotazione={idsOfferteConPrenotazione}
      />

      <BottomNav active={activeTab} onNavigate={setActiveTab} />
    </div>
  );
};

export default Index;
