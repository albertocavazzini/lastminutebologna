import { useCallback, useRef, type TouchEvent } from "react";

/**
 * Pull-to-refresh (solo elenco Offerte) in WebView Telegram.
 *
 * Linee guida / contesto:
 * - Telegram Mini Apps: https://core.telegram.org/bots/webapps — swipe verticali possono
 *   interagire col client (es. ridurre la mini app). Su iOS/Android il comportamento reale
 *   varia per versione; qui usiamo `preventDefault` sul pull verso il basso quando l’elenco
 *   è in cima, per non attivare il gesto nativo e lanciare il refetch.
 * - Alternativa documentata da Telegram: `WebApp.disableVerticalSwipes()` (Bot API 7.7+), da
 *   valutare se si vuole disabilitare globalmente la chiusura a swipe (trade-off UX).
 *
 * Riferimenti esterni utili: Apple HIG (gesture), Material motion, WCAG (non applicabile al solo
 * gesto ma al contenuto dopo refresh).
 */
const PULL_PREVENT_MIN_DELTA_Y = 12;
const PULL_TRIGGER_DELTA_Y = 80;

export function usePullToRefresh(
  enabled: boolean,
  onRefresh: () => void | Promise<unknown>,
) {
  const pullStartYRef = useRef<number | null>(null);
  const pullTriggeredRef = useRef(false);

  const onTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (!enabled) return;
    pullStartYRef.current = e.touches[0]?.clientY ?? null;
    pullTriggeredRef.current = false;
  }, [enabled]);

  const onTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (!enabled || pullTriggeredRef.current) return;
    const startY = pullStartYRef.current;
    if (startY == null) return;
    const currentY = e.touches[0]?.clientY ?? startY;
    const deltaY = currentY - startY;
    if (deltaY > PULL_PREVENT_MIN_DELTA_Y) {
      // Evita gesture nativo Telegram (swipe down -> mini app in icona).
      e.preventDefault();
    }
    if (deltaY < PULL_TRIGGER_DELTA_Y) return;
    pullTriggeredRef.current = true;
    void onRefresh();
  }, [enabled, onRefresh]);

  const onTouchEnd = useCallback(() => {
    pullStartYRef.current = null;
    pullTriggeredRef.current = false;
  }, []);

  return { onTouchStart, onTouchMove, onTouchEnd };
}
