import { Map, List, MessageSquare, Ticket, Zap } from "lucide-react";
import { motion } from "framer-motion";
import type { PrenotazioniSubView } from "@/components/PrenotazioniView";
import { cn } from "@/lib/utils";

const toggleSpring = { type: "spring" as const, stiffness: 420, damping: 34 };

type MainTopBarProps = {
  activeTab: string;
  viewMode: "map" | "list";
  prenotazioniSubView: PrenotazioniSubView;
  onChangeViewMode: (next: "map" | "list") => void;
  onChangePrenotazioniSubView: (next: PrenotazioniSubView) => void;
};

const MainTopBar = ({
  activeTab,
  viewMode,
  prenotazioniSubView,
  onChangeViewMode,
  onChangePrenotazioniSubView,
}: MainTopBarProps) => {
  return (
    <header className="lmb-header-safe-pt sticky top-0 z-30 glass-strong px-4 pb-3">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Zap className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.25} />
          <h1 className="truncate text-lg font-bold tracking-tight text-foreground">
            LastMinute<span className="text-primary">Bologna</span>
          </h1>
        </div>

        {activeTab === "radar" && (
          <div
            className="relative flex shrink-0 gap-0.5 rounded-full border border-border/50 bg-muted/50 p-0.5 shadow-inner"
            role="group"
            aria-label="Vista offerte"
          >
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-y-0.5 w-9 rounded-full bg-primary shadow-sm"
              initial={false}
              animate={{
                left:
                  viewMode === "list"
                    ? "0.125rem"
                    : "calc(0.125rem + 2.25rem + 0.125rem)",
              }}
              transition={toggleSpring}
            />
            <button
              type="button"
              onClick={() => onChangeViewMode("list")}
              className={cn(
                "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
                viewMode === "list"
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label="Elenco offerte"
              aria-pressed={viewMode === "list"}
            >
              <List className="h-4 w-4" strokeWidth={1.25} />
            </button>
            <button
              type="button"
              onClick={() => onChangeViewMode("map")}
              className={cn(
                "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
                viewMode === "map"
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label="Mappa offerte"
              aria-pressed={viewMode === "map"}
            >
              <Map className="h-4 w-4" strokeWidth={1.25} />
            </button>
          </div>
        )}

        {activeTab === "prenotazioni" && (
          <div
            className="relative flex shrink-0 items-center gap-0.5 rounded-full border border-border/50 bg-muted/50 p-0.5 shadow-inner"
            role="group"
            aria-label="Sezione prenotazioni"
          >
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-y-0.5 w-9 rounded-full bg-primary shadow-sm"
              initial={false}
              animate={{
                left:
                  prenotazioniSubView === "lista"
                    ? "0.125rem"
                    : "calc(0.125rem + 2.25rem + 0.125rem)",
              }}
              transition={toggleSpring}
            />
            <button
              type="button"
              onClick={() => onChangePrenotazioniSubView("lista")}
              className={cn(
                "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
                prenotazioniSubView === "lista"
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label="Prenotazioni e QR"
              aria-pressed={prenotazioniSubView === "lista"}
            >
              <Ticket className="h-4 w-4" strokeWidth={1.25} />
            </button>
            <button
              type="button"
              onClick={() => onChangePrenotazioniSubView("feedback")}
              className={cn(
                "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
                prenotazioniSubView === "feedback"
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label="Feedback"
              aria-pressed={prenotazioniSubView === "feedback"}
            >
              <MessageSquare className="h-4 w-4" strokeWidth={1.25} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default MainTopBar;
