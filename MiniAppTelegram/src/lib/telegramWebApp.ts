/**
 * Integrazione Telegram Mini Apps (script caricato da index.html).
 * @see https://core.telegram.org/bots/webapps
 */

type TelegramWebApp = {
  ready: () => void;
  expand: () => void;
  initData: string;
  colorScheme?: "light" | "dark";
};

/** Stringa firmata da Telegram (`query_id=…&user=…&hash=…`). Vuota fuori da Telegram. */
export function getTelegramInitData(): string {
  return window.Telegram?.WebApp?.initData?.trim() ?? "";
}

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}

export function initTelegramWebApp(): void {
  const tw = window.Telegram?.WebApp;
  if (!tw) return;
  tw.ready();
  tw.expand();
  if (tw.colorScheme === "dark") {
    document.documentElement.classList.add("dark");
  }
}

export function isTelegramMiniApp(): boolean {
  return Boolean(window.Telegram?.WebApp?.initData);
}
