import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, QrCode, Store } from "lucide-react";
import {
  fetchMiniappPrenotazioniJsonp,
  MINIAPP_PRENOTAZIONI_STALE_MS,
} from "@/api/miniappPrenotazioni";
import { projectEnv } from "@/config/projectEnv";
import { getTelegramInitData } from "@/lib/telegramWebApp";
import { Button } from "@/components/ui/button";
import PrenotazioniFeedbackPanel from "@/components/PrenotazioniFeedbackPanel";

function formatData(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type PrenotazioniSubView = "lista" | "feedback";

type PrenotazioniViewProps = {
  subView: PrenotazioniSubView;
};

const PrenotazioniView = ({ subView }: PrenotazioniViewProps) => {
  const webAppBase = projectEnv.appsScriptWebAppBase?.trim() ?? "";
  const initData = getTelegramInitData();

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["miniapp-prenotazioni", webAppBase, initData.slice(0, 80)],
    queryFn: () => fetchMiniappPrenotazioniJsonp(webAppBase, initData),
    enabled: Boolean(webAppBase && initData),
    staleTime: MINIAPP_PRENOTAZIONI_STALE_MS,
    refetchOnWindowFocus: false,
  });

  const list = useMemo(
    () => (data?.ok ? (data.prenotazioni ?? []) : []),
    [data],
  );

  /** Solo prenotazioni non ancora validate al locale (QR ancora da usare). Una alla volta: la più recente. */
  const qrAttivo = useMemo(() => {
    const pendenti = list.filter((p) => !p.validata);
    pendenti.sort((a, b) => {
      const ta = new Date(a.timestamp).getTime();
      const tb = new Date(b.timestamp).getTime();
      const na = Number.isFinite(ta) ? ta : 0;
      const nb = Number.isFinite(tb) ? tb : 0;
      return nb - na;
    });
    return pendenti[0] ?? null;
  }, [list]);

  if (!webAppBase) {
    return (
      <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-sm text-amber-900 dark:text-amber-100">
        Configura l&apos;URL della web app (runtime-config o variabili
        d&apos;ambiente) per caricare le prenotazioni.
      </p>
    );
  }

  if (!initData) {
    return (
      <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-6 text-center">
        <QrCode
          className="mx-auto h-10 w-10 text-muted-foreground"
          strokeWidth={1.25}
        />
        <p className="text-sm text-muted-foreground">
          Apri questa pagina come{" "}
          <strong className="text-foreground">mini app Telegram</strong> (menu
          del bot o pulsante con link alla web app): solo così il sistema
          riconosce il tuo account e può mostrare le prenotazioni e il QR.
        </p>
      </div>
    );
  }

  if (subView === "feedback") {
    return (
      <PrenotazioniFeedbackPanel webAppBase={webAppBase} initData={initData} />
    );
  }

  const apiErr =
    isError && error instanceof Error
      ? error.message
      : data && !data.ok
        ? (data.error ?? "Errore")
        : null;

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-foreground">Il tuo QR</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg text-xs"
          disabled={isFetching}
          onClick={() => refetch()}
        >
          {isFetching ? "Aggiorno…" : "Aggiorna"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Qui compare solo la prenotazione da confermare al locale.
      </p>

      {isPending && (
        <p className="text-sm text-muted-foreground">Caricamento…</p>
      )}

      {apiErr && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {apiErr}
        </p>
      )}

      {!isPending && data?.ok && list.length === 0 && (
        <p className="rounded-xl border border-border/50 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
          Non hai prenotazioni attive. Prenota un&apos;offerta dalla sezione Offerte:
          quando confermata, il QR apparirà qui fino alla scansione al locale.
        </p>
      )}

      {!isPending && data?.ok && list.length > 0 && !qrAttivo && (
        <p className="rounded-xl border border-border/50 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
          Nessun QR da mostrare: non hai prenotazioni in attesa di scansione al
          locale. Puoi prenotare una nuova offerta dalla sezione Offerte o dal bot.
        </p>
      )}

      {qrAttivo ? (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
            <div className="mx-auto shrink-0 rounded-xl border border-border/40 bg-white p-2 sm:mx-0">
              <img
                src={qrAttivo.qr_url}
                alt={`QR prenotazione ${qrAttivo.stato_id}`}
                width={200}
                height={200}
                className="h-44 w-44 object-contain sm:h-48 sm:w-48"
                loading="lazy"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <span className="inline-block rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                Da mostrare al locale
              </span>
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Store
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  strokeWidth={1.25}
                />
                {qrAttivo.locale || "Locale"}
              </p>
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" strokeWidth={1.25} />
                {formatData(qrAttivo.timestamp)}
              </p>
              {qrAttivo.url_validazione ? (
                <a
                  href={qrAttivo.url_validazione}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs font-medium text-primary underline-offset-2 hover:underline"
                >
                  Apri link validazione
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PrenotazioniView;
