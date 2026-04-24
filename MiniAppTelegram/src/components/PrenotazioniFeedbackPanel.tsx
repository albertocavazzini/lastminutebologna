import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, MessageSquare, RefreshCw, Star, Store } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  fetchMiniappFeedbackDaLasciareJsonp,
  inviaMiniappFeedbackJsonp,
} from "@/api/miniappFeedback";
import { projectEnv } from "@/config/projectEnv";
import { getTelegramInitData } from "@/lib/telegramWebApp";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const FEEDBACK_DELAY_MS = 0;
const FEEDBACK_UNLOCK_CACHE_KEY = "lmb-feedback-unlock-v1";
const FEEDBACK_LIST_STALE_MS = 5 * 60_000;

function readFeedbackUnlockCache(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(FEEDBACK_UNLOCK_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const clean: Record<string, number> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "number" && Number.isFinite(v)) clean[k] = v;
    }
    return clean;
  } catch {
    return {};
  }
}

function writeFeedbackUnlockCache(next: Record<string, number>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FEEDBACK_UNLOCK_CACHE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota/security storage errors
  }
}

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

type CardProps = {
  webAppBase: string;
  initData: string;
  idPrenotazione: string;
  locale: string;
  oraScansione: string;
};

function FeedbackCard({
  webAppBase,
  initData,
  idPrenotazione,
  locale,
  oraScansione,
}: CardProps) {
  const queryClient = useQueryClient();
  const [stars, setStars] = useState(0);
  const [commento, setCommento] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      inviaMiniappFeedbackJsonp(
        webAppBase,
        initData,
        idPrenotazione,
        stars,
        commento.trim(),
      ),
    onSuccess: (res) => {
      if (res.ok) {
        void queryClient.invalidateQueries({
          queryKey: ["miniapp-feedback-richieste"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["miniapp-prenotazioni"],
        });
      }
    },
  });

  const err =
    mutation.isError && mutation.error instanceof Error
      ? mutation.error.message
      : mutation.data && !mutation.data.ok
        ? (mutation.data.error ?? "Errore")
        : null;

  return (
    <li className="space-y-3 rounded-2xl border border-border/60 bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Store className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.25} />
            {locale}
          </p>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" strokeWidth={1.25} />
            QR validato il {formatData(oraScansione)}
          </p>
          <p className="font-mono text-lmb-label text-muted-foreground">
            {idPrenotazione}
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Puoi lasciare la valutazione subito dopo la conferma del QR al locale.
      </p>

      <div className="flex justify-center gap-1.5 py-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setStars(n)}
            className={`inline-flex min-h-touch min-w-touch items-center justify-center rounded-md p-2 transition-colors ${
              n <= stars ? "text-amber-400" : "text-muted-foreground/35"
            }`}
            aria-label={`${n} stelle`}
          >
            <Star
              className="h-8 w-8"
              strokeWidth={1.25}
              fill={n <= stars ? "currentColor" : "none"}
            />
          </button>
        ))}
      </div>

      <Textarea
        value={commento}
        onChange={(e) => setCommento(e.target.value.slice(0, 500))}
        placeholder="Commento (opzionale)"
        rows={3}
        className="resize-none text-sm"
      />

      {err ? (
        <p className="text-xs text-destructive">{err}</p>
      ) : null}

      {mutation.isSuccess && mutation.data?.ok ? (
        <p className="text-center text-sm font-medium text-success">
          Grazie! Feedback registrato.
        </p>
      ) : (
        <Button
          type="button"
          className="w-full"
          disabled={stars < 1 || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? "Invio…" : "Pubblica valutazione"}
        </Button>
      )}
    </li>
  );
}

type PrenotazioniFeedbackPanelProps = {
  webAppBase: string;
  initData: string;
};

const PrenotazioniFeedbackPanel = ({
  webAppBase,
  initData,
}: PrenotazioniFeedbackPanelProps) => {
  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["miniapp-feedback-richieste", webAppBase, initData.slice(0, 80)],
    queryFn: () => fetchMiniappFeedbackDaLasciareJsonp(webAppBase, initData),
    enabled: Boolean(webAppBase && initData),
    staleTime: FEEDBACK_LIST_STALE_MS,
    refetchOnWindowFocus: false,
  });

  const apiErr =
    isError && error instanceof Error
      ? error.message
      : data && !data.ok
        ? (data.error ?? "Errore")
        : null;

  const list = data?.ok ? data.feedback_richieste ?? [] : [];
  const [unlockCache, setUnlockCache] = useState<Record<string, number>>({});

  useEffect(() => {
    setUnlockCache(readFeedbackUnlockCache());
  }, []);

  useEffect(() => {
    if (!data?.ok) return;
    const now = Date.now();
    const next = { ...unlockCache };
    let changed = false;
    for (const r of list) {
      const parsed = new Date(r.ora_scansione).getTime();
      const computedUnlockAt = Number.isFinite(parsed) ? parsed + FEEDBACK_DELAY_MS : now;
      const prevUnlockAt = next[r.id_prenotazione] ?? 0;
      const finalUnlockAt = Math.max(prevUnlockAt, computedUnlockAt);
      if (finalUnlockAt !== prevUnlockAt) {
        next[r.id_prenotazione] = finalUnlockAt;
        changed = true;
      }
    }
    if (changed) {
      setUnlockCache(next);
      writeFeedbackUnlockCache(next);
    }
  }, [data, list, unlockCache]);

  const visibleList = useMemo(() => {
    const now = Date.now();
    return list.filter((r) => {
      const unlockAt = unlockCache[r.id_prenotazione];
      return !unlockAt || unlockAt <= now;
    });
  }, [list, unlockCache]);

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lmb-title font-bold text-foreground">
          Valuta l&apos;esperienza
        </h2>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0 rounded-lg"
          disabled={isFetching}
          onClick={() => refetch()}
          aria-label={
            isFetching ? "Aggiornamento in corso" : "Aggiorna richieste feedback"
          }
        >
          <RefreshCw
            className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"}
            strokeWidth={1.25}
            aria-hidden
          />
        </Button>
      </div>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <MessageSquare
          className="mt-0.5 h-4 w-4 shrink-0"
          strokeWidth={1.25}
        />
        Qui puoi lasciare un feedback ai locali dove hai prenotato. Per noi è
        molto utile, aiutaci a migliorarci!
      </p>

      {isPending && (
        <p className="text-sm text-muted-foreground">Caricamento…</p>
      )}

      {apiErr && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {apiErr}
        </p>
      )}

      {!isPending && data?.ok && visibleList.length === 0 && (
        <p className="rounded-xl border border-border/50 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
          Nessun feedback in sospeso.
        </p>
      )}

      <ul className="space-y-4">
        {visibleList.map((r) => (
          <FeedbackCard
            key={r.id_prenotazione}
            webAppBase={webAppBase}
            initData={initData}
            idPrenotazione={r.id_prenotazione}
            locale={r.locale}
            oraScansione={r.ora_scansione}
          />
        ))}
      </ul>
    </div>
  );
};

export default PrenotazioniFeedbackPanel;
