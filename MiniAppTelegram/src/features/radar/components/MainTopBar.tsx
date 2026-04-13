import { Map, List, MessageSquare, Ticket, Zap } from "lucide-react";
import type { PrenotazioniSubView } from "@/components/PrenotazioniView";

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
              onClick={() => onChangeViewMode("list")}
              className={`rounded-md p-1.5 transition-colors ${
                viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
              aria-label="Elenco offerte"
            >
              <List className="h-4 w-4" strokeWidth={1.25} />
            </button>
            <button
              type="button"
              onClick={() => onChangeViewMode("map")}
              className={`rounded-md p-1.5 transition-colors ${
                viewMode === "map" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
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
              onClick={() => onChangePrenotazioniSubView("lista")}
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
              onClick={() => onChangePrenotazioniSubView("feedback")}
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
  );
};

export default MainTopBar;
