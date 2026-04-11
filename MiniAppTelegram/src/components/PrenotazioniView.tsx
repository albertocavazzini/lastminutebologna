import { useQuery } from "@tanstack/react-query";
import { Calendar, CheckCircle2, QrCode, Store } from "lucide-react";
import { fetchMiniappPrenotazioniJsonp } from "@/api/miniappPrenotazioni";
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
    staleTime: 20_000,
  });

  if (!webAppBase) {
    return (
      <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-sm text-amber-900 dark:text-amber-100">
        Configura l&apos;URL della web app (runtime-config o variabili d&apos;ambiente)
        per caricare le prenotazioni.
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
          del bot o pulsante con link alla web app): solo così il sistema riconosce
          il tuo account e può mostrare le prenotazioni e il QR.
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

  const list = data?.ok ? data.prenotazioni ?? [] : [];

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-foreground">
          Le tue prenotazioni
        </h2>
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
          Non hai ancora prenotazioni. Prenota un&apos;offerta dal bot: qui
          compariranno il QR da mostrare al locale e lo stato di validazione.
        </p>
      )}

      <ul className="space-y-4">
        {list.map((p) => (
          <li
            key={p.stato_id}
            className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card"
          >
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
              <div className="mx-auto shrink-0 rounded-xl border border-border/40 bg-white p-2 sm:mx-0">
                <img
                  src={p.qr_url}
                  alt={`QR prenotazione ${p.stato_id}`}
                  width={160}
                  height={160}
                  className="h-36 w-36 object-contain"
                  loading="lazy"
                />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {p.stato_id}
                  </span>
                  {p.validata ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
                      <CheckCircle2 className="h-3 w-3" strokeWidth={1.25} />
                      Validata
                    </span>
                  ) : (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      Da mostrare al locale
                    </span>
                  )}
                </div>
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Store className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.25} />
                  {p.locale || "Locale"}
                </p>
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 shrink-0" strokeWidth={1.25} />
                  {formatData(p.timestamp)}
                </p>
                {p.url_validazione ? (
                  <a
                    href={p.url_validazione}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs font-medium text-primary underline-offset-2 hover:underline"
                  >
                    Apri link validazione
                  </a>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PrenotazioniView;
