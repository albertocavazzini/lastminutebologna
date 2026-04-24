import { useEffect, useRef } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { MINIAPP_PRENOTAZIONI_QUERY_ROOT } from "@/api/miniappPrenotazioni";

const VISIBILITY_PRENOTAZIONI_COOLDOWN_MS = 10 * 60_000;
const VISIBILITY_MIN_HIDDEN_MS = 30_000;
const PRENOTAZIONI_PENDING_SYNC_KEY = "lmb-prenotazioni-pending-sync-v1";

export function useVisibilityPrenotazioniRefresh(queryClient: QueryClient) {
  const hiddenAtRef = useRef<number | null>(null);
  const lastVisibilityPrenotazioniRef = useRef(0);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
        return;
      }
      const t = hiddenAtRef.current;
      hiddenAtRef.current = null;
      if (t == null) return;
      if (Date.now() - t < VISIBILITY_MIN_HIDDEN_MS) return;
      const now = Date.now();
      if (now - lastVisibilityPrenotazioniRef.current < VISIBILITY_PRENOTAZIONI_COOLDOWN_MS) {
        return;
      }
      // Aggiorna prenotazioni in automatico solo se c'è un evento locale noto
      // (es. utente ha appena prenotato) registrato in cache.
      let hasPendingSync = false;
      try {
        hasPendingSync = Boolean(window.localStorage.getItem(PRENOTAZIONI_PENDING_SYNC_KEY));
      } catch {
        hasPendingSync = false;
      }
      if (!hasPendingSync) return;
      lastVisibilityPrenotazioniRef.current = now;
      void queryClient.invalidateQueries({
        queryKey: [MINIAPP_PRENOTAZIONI_QUERY_ROOT],
      });
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [queryClient]);
}
