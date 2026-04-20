import { Map, List, MessageSquare, Ticket, Zap } from "lucide-react";
import type { PrenotazioniSubView } from "@/components/PrenotazioniView";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

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
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(v) => {
              if (v === "list" || v === "map") onChangeViewMode(v);
            }}
            aria-label="Vista offerte"
            className="gap-1 rounded-xl border border-border/50 bg-muted/50 p-1 shadow-inner"
          >
            <ToggleGroupItem
              value="list"
              aria-label="Elenco offerte"
              className={cn(
                "h-12 min-w-[7.25rem] flex-1 gap-2 rounded-lg border-0 px-4 text-sm font-semibold shadow-none sm:min-w-[8rem]",
                "data-[state=on]:!bg-primary data-[state=on]:!text-primary-foreground data-[state=on]:hover:!bg-primary/90",
                "data-[state=off]:text-muted-foreground data-[state=off]:hover:bg-background/70",
              )}
            >
              <List className="h-5 w-5 shrink-0" strokeWidth={1.25} />
              Elenco
            </ToggleGroupItem>
            <ToggleGroupItem
              value="map"
              aria-label="Mappa offerte"
              className={cn(
                "h-12 min-w-[7.25rem] flex-1 gap-2 rounded-lg border-0 px-4 text-sm font-semibold shadow-none sm:min-w-[8rem]",
                "data-[state=on]:!bg-primary data-[state=on]:!text-primary-foreground data-[state=on]:hover:!bg-primary/90",
                "data-[state=off]:text-muted-foreground data-[state=off]:hover:bg-background/70",
              )}
            >
              <Map className="h-5 w-5 shrink-0" strokeWidth={1.25} />
              Mappa
            </ToggleGroupItem>
          </ToggleGroup>
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
