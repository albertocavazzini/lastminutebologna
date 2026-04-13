import { useState } from "react";
import { Bell, CircleHelp, Sparkles } from "lucide-react";

const AlertsView = () => {
  const [showCenterInfo, setShowCenterInfo] = useState(false);

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" strokeWidth={1.25} />
          <h2 className="text-lg font-bold text-foreground">Avvisi</h2>
        </div>
        <button
          type="button"
          onClick={() => setShowCenterInfo((v) => !v)}
          aria-label="Info centro avvisi"
          title="Apri info centro avvisi"
          className={`rounded-lg p-1.5 transition-colors ${
            showCenterInfo
              ? "border border-primary/50 bg-primary text-primary-foreground shadow-sm"
              : "border border-border/60 bg-secondary/50 text-muted-foreground hover:bg-secondary"
          }`}
        >
          <span className="flex items-center gap-1">
            <CircleHelp className="h-5 w-5" strokeWidth={1.5} />
            <span className="text-[11px] font-semibold">Info</span>
          </span>
        </button>
      </div>

      {showCenterInfo ? (
        <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-card">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/20">
              <Sparkles className="h-4 w-4 text-accent" strokeWidth={1.25} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Centro avvisi (in arrivo)
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Qui potrai ritrovare le{" "}
                <strong className="text-foreground">notifiche già inviate</strong>{" "}
                o le offerte segnalate (locale, orario, link), utile se hai
                silenziato la chat del bot. Quando collegheremo il backend,
                comparirà l’elenco in questa sezione.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-card">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15">
            <Bell className="h-4 w-4 text-primary" strokeWidth={1.25} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Nessun avviso recente
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Quando collegheremo il backend, qui vedrai lo storico delle
              notifiche e delle offerte segnalate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsView;
