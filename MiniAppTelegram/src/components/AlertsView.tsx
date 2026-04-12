import { Bell, MapPin, Radio, Sparkles } from "lucide-react";

/**
 * Finché non c’è API per il centro avvisi: contenuto informativo su radar e posizione.
 * In futuro: elenco notifiche/offerte segnalate dal backend.
 */
const AlertsView = () => {
  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-primary" strokeWidth={1.25} />
        <h2 className="text-lg font-bold text-foreground">Avvisi</h2>
      </div>

      <div className="space-y-4 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-card">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15">
            <Radio className="h-4 w-4 text-primary" strokeWidth={1.25} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Come funziona il radar
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Le offerte che vedi in elenco e sulla mappa sono quelle{" "}
              <strong className="text-foreground">attive adesso</strong> nel
              raggio impostato dal servizio, filtrate come sul bot (geohash +
              distanza). L’elenco si aggiorna periodicamente mentre resti sulla
              sezione Mappa.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15">
            <MapPin className="h-4 w-4 text-primary" strokeWidth={1.25} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Perché chiediamo la posizione
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Serve solo per mostrarti le offerte{" "}
              <strong className="text-foreground">vicino a te</strong>. La
              richiesta passa dal browser/Telegram: non memorizziamo la
              posizione lato mini app oltre a quanto serve al radar in
              sessione. Se rifiuti il permesso, puoi comunque usare il bot in
              chat per le offerte.
            </p>
          </div>
        </div>

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
              <strong className="text-foreground">
                notifiche già inviate
              </strong>{" "}
              o le offerte segnalate (locale, orario, link), utile se hai
              silenziato la chat del bot. Quando collegheremo il backend,
              comparirà l’elenco in questa sezione.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsView;
