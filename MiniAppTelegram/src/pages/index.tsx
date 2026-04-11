import { lazy, Suspense, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Map, List } from "lucide-react";
import { mockDrops } from "@/data/mockDrops";
import type { Drop } from "@/data/mockDrops";
import DropCard from "@/components/DropCard";

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

  const sortedDrops = [...mockDrops].sort((a, b) => a.distance - b.distance);

  return (
    <div className="relative mx-auto min-h-screen min-h-[100dvh] max-w-md bg-background">
      {/* Header — sotto status bar / Dynamic Island (safe area) */}
      <header className="sticky top-0 z-30 glass-strong px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" strokeWidth={1.25} />
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              Flash<span className="text-primary">Drop</span>
            </h1>
          </div>

          {activeTab === "radar" && (
            <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                <List className="w-4 h-4" strokeWidth={1.25} />
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "map"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                <Map className="w-4 h-4" strokeWidth={1.25} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="px-4 pt-3 pb-[calc(5rem+env(safe-area-inset-bottom,0px))]">
        <AnimatePresence mode="wait">
          {activeTab === "radar" && (
            <motion.div
              key="radar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
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
                      drops={sortedDrops}
                      onSelectDrop={setSelectedDrop}
                    />
                  </Suspense>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs text-muted-foreground">
                      {sortedDrops.length} active drops nearby
                    </span>
                  </div>
                  {sortedDrops.map((drop, i) => (
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

      {/* Drop Detail Modal */}
      <DropDetail drop={selectedDrop} onClose={() => setSelectedDrop(null)} />

      {/* Bottom Nav */}
      <BottomNav active={activeTab} onNavigate={setActiveTab} />
    </div>
  );
};

export default Index;
