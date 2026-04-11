import { Bell } from "lucide-react";

/**
 * Placeholder: niente dati finti. In futuro: alert da backend / preferenze utente.
 */
const AlertsView = () => {
  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Bell className="h-5 w-5 text-primary" strokeWidth={1.25} />
          Alert
        </h2>
      </div>
      <p className="rounded-2xl border border-border/50 bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
        Qui potrai vedere notifiche e suggerimenti personalizzati quando
        collegheremo questa sezione al backend.
      </p>
    </div>
  );
};

export default AlertsView;
