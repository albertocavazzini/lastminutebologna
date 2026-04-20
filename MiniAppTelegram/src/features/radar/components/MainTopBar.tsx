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
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Zap className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.25} />
          <h1 className="truncate text-lg font-bold tracking-tight text-foreground">
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
            className="shrink-0 gap-0.5 rounded-full border border-border/50 bg-muted/50 p-0.5 shadow-inner"
          >
            <ToggleGroupItem
              value="list"
              aria-label="Elenco offerte"
              className={cn(
                "h-9 w-9 shrink-0 rounded-full border-0 p-0 shadow-none",
                "data-[state=on]:!bg-primary data-[state=on]:!text-primary-foreground data-[state=on]:hover:!bg-primary/90",
                "data-[state=off]:text-muted-foreground data-[state=off]:hover:bg-background/70",
              )}
            >
              <List className="h-4 w-4" strokeWidth={1.25} />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="map"
              aria-label="Mappa offerte"
              className={cn(
                "h-9 w-9 shrink-0 rounded-full border-0 p-0 shadow-none",
                "data-[state=on]:!bg-primary data-[state=on]:!text-primary-foreground data-[state=on]:hover:!bg-primary/90",
                "data-[state=off]:text-muted-foreground data-[state=off]:hover:bg-background/70",
              )}
            >
              <Map className="h-4 w-4" strokeWidth={1.25} />
            </ToggleGroupItem>
          </ToggleGroup>
        )}

        {activeTab === "prenotazioni" && (
          <div className="flex items-center gap-0.5 rounded-full border border-border/50 bg-muted/50 p-0.5 shadow-inner">
            <button
              type="button"
              onClick={() => onChangePrenotazioniSubView("lista")}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                prenotazioniSubView === "lista"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-background/70"
              }`}
              aria-label="Prenotazioni e QR"
            >
              <Ticket className="h-4 w-4" strokeWidth={1.25} />
            </button>
            <button
              type="button"
              onClick={() => onChangePrenotazioniSubView("feedback")}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                prenotazioniSubView === "feedback"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-background/70"
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
