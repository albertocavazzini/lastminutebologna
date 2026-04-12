/**
 * Integrazione Telegram Mini Apps (script caricato da index.html).
 * @see https://core.telegram.org/bots/webapps
 */

type SafeAreaInset = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

/** Utente dalla mini app (solo in contesto Telegram; non firmato come initData). */
export type TelegramWebAppUser = {
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

type TelegramWebApp = {
  ready: () => void;
  expand: () => void;
  initData: string;
  initDataUnsafe?: {
    user?: TelegramWebAppUser;
    [key: string]: unknown;
  };
  openTelegramLink?: (url: string) => void;
  colorScheme?: "light" | "dark";
  safeAreaInset?: SafeAreaInset;
  contentSafeAreaInset?: SafeAreaInset;
  onEvent?: (eventType: string, eventHandler: () => void) => void;
};

/** Stringa firmata da Telegram (`query_id=…&user=…&hash=…`). Vuota fuori da Telegram. */
export function getTelegramInitData(): string {
  return window.Telegram?.WebApp?.initData?.trim() ?? "";
}

/** Dati utente esposti dal client Telegram (profilo mini app). Null fuori da Telegram o se assenti. */
export function getTelegramWebAppUser(): TelegramWebAppUser | null {
  const u = window.Telegram?.WebApp?.initDataUnsafe?.user;
  if (!u || typeof u !== "object") return null;
  return u;
}

export function formatTelegramDisplayName(u: TelegramWebAppUser): string {
  const parts = [u.first_name, u.last_name].filter(
    (s) => typeof s === "string" && s.trim(),
  ) as string[];
  if (parts.length) return parts.join(" ").trim();
  if (u.username?.trim()) return `@${u.username.replace(/^@/, "")}`;
  return "Utente Telegram";
}

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}

/**
 * Telegram imposta spesso queste variabili CSS; se mancano, le copiamo da
 * `WebApp.safeAreaInset` / `contentSafeAreaInset` (Bot API 8+).
 */
export function syncTelegramInsetCssVars(): void {
  const tw = window.Telegram?.WebApp;
  if (!tw) return;
  const r = document.documentElement.style;
  const apply = (
    inset: SafeAreaInset | undefined,
    keys: Record<keyof SafeAreaInset, string>,
  ) => {
    if (!inset) return;
    for (const k of ["top", "bottom", "left", "right"] as const) {
      const v = inset[k];
      if (typeof v === "number" && Number.isFinite(v) && v >= 0) {
        r.setProperty(keys[k], `${v}px`);
      }
    }
  };
  apply(tw.safeAreaInset, {
    top: "--tg-safe-area-inset-top",
    bottom: "--tg-safe-area-inset-bottom",
    left: "--tg-safe-area-inset-left",
    right: "--tg-safe-area-inset-right",
  });
  apply(tw.contentSafeAreaInset, {
    top: "--tg-content-safe-area-inset-top",
    bottom: "--tg-content-safe-area-inset-bottom",
    left: "--tg-content-safe-area-inset-left",
    right: "--tg-content-safe-area-inset-right",
  });
}

export function initTelegramWebApp(): void {
  const tw = window.Telegram?.WebApp;
  if (!tw) return;
  tw.ready();
  tw.expand();
  syncTelegramInsetCssVars();
  if (typeof tw.onEvent === "function") {
    const sync = () => syncTelegramInsetCssVars();
    try {
      tw.onEvent("safeAreaChanged", sync);
      tw.onEvent("contentSafeAreaChanged", sync);
      tw.onEvent("viewportChanged", sync);
    } catch {
      /* client vecchio */
    }
  }
  if (tw.colorScheme === "dark") {
    document.documentElement.classList.add("dark");
  }
}

export function isTelegramMiniApp(): boolean {
  return Boolean(window.Telegram?.WebApp?.initData);
}
