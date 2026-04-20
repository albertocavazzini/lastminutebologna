import { Map, List, MessageSquare, Ticket, Zap } from "lucide-react";
import type { PrenotazioniSubView } from "@/components/PrenotazioniView";
import { cn } from "@/lib/utils";

/** w-11 + gap-0.5: spostamento pill tra prima e seconda icona (44px touch) */
const TOGGLE_PILL_SHIFT = "calc(2.75rem + 0.125rem)";

const pillTransition = "transform 300ms cubic-bezier(0.22, 1, 0.36, 1)";

const pillClass =
  "pointer-events-none absolute inset-y-0.5 left-0.5 w-11 rounded-full bg-primary shadow-sm will-change-transform";

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
          <h1 className="truncate text-lmb-title-sm font-bold tracking-tight text-foreground">
            LastMinute<span className="text-primary">Bologna</span>
          </h1>
        </div>

        {activeTab === "radar" && (
          <div
            className="relative flex shrink-0 gap-0.5 rounded-full border border-border/50 bg-muted/50 p-0.5 shadow-inner"
            role="group"
            aria-label="Vista offerte"
          >
            <div
              aria-hidden
              className={pillClass}
              style={{
                transition: pillTransition,
                transform:
                  viewMode === "list" ? "translateX(0)" : `translateX(${TOGGLE_PILL_SHIFT})`,
              }}
            />
            <button
              type="button"
              onClick={() => onChangeViewMode("list")}
              className={cn(
                "relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
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
                "relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
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
            <div
              aria-hidden
              className={pillClass}
              style={{
                transition: pillTransition,
                transform:
                  prenotazioniSubView === "lista"
                    ? "translateX(0)"
                    : `translateX(${TOGGLE_PILL_SHIFT})`,
              }}
            />
            <button
              type="button"
              onClick={() => onChangePrenotazioniSubView("lista")}
              className={cn(
                "relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
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
                "relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
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
