/**
 * Integrazione Telegram Mini Apps (script caricato da index.html).
 * @see https://core.telegram.org/bots/webapps
 */

type ThemeParams = {
  bg_color?: string;
  secondary_bg_color?: string;
  header_bg_color?: string;
};

type TelegramWebApp = {
  ready: () => void;
  expand: () => void;
  initData: string;
  colorScheme?: "light" | "dark";
  themeParams?: ThemeParams;
  /** `#RRGGBB` oppure chiavi tema: `bg_color`, `secondary_bg_color` */
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  setBottomBarColor?: (color: string) => void;
  isVersionAtLeast?: (version: string) => boolean;
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

/**
 * Chrome Telegram più discreto: espansione + header/sfondo allineati al tema.
 * Trasparenza vera dell’header non è esposta dall’API; `bg_color` unifica barra e area web.
 */
export function initTelegramWebApp(): void {
  const tw = window.Telegram?.WebApp;
  if (!tw) return;
  tw.ready();
  tw.expand();

  try {
    if (typeof tw.setHeaderColor === "function") {
      tw.setHeaderColor("bg_color");
    }
    if (typeof tw.setBackgroundColor === "function") {
      tw.setBackgroundColor("bg_color");
    }
    if (
      typeof tw.isVersionAtLeast === "function" &&
      tw.isVersionAtLeast("7.10") &&
      typeof tw.setBottomBarColor === "function"
    ) {
      tw.setBottomBarColor("bg_color");
    }
  } catch {
    /* client vecchio o tema non disponibile */
  }

  if (tw.colorScheme === "dark") {
    document.documentElement.classList.add("dark");
  }
}

export function isTelegramMiniApp(): boolean {
  return Boolean(window.Telegram?.WebApp?.initData);
}
