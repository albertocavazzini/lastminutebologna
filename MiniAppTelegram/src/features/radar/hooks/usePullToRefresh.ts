import { useCallback, useRef, type TouchEvent } from "react";

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
