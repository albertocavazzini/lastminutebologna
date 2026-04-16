import { getTelegramWebAppUser } from "@/lib/telegramWebApp";

const GA_MEASUREMENT_ID = "G-HYQ5QKWRP7";

type GtagCommand = "js" | "config" | "event";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (
      command: GtagCommand,
      targetIdOrEvent: string | Date,
      params?: Record<string, unknown>,
    ) => void;
  }
}

function isDebugHost(): boolean {
  return (
    location.hostname === "localhost" || location.hostname === "127.0.0.1"
  );
}

function ensureGtagBootstrap(): void {
  window.dataLayer = window.dataLayer || [];
  // Deve fare push di `arguments`, non di un array da rest: altrimenti gtag.js
  // non interpreta la coda e non parte nessuna richiesta `collect`.
  if (!window.gtag) {
    window.gtag = function gtagShim() {
      // gtag.js richiede esattamente `push(arguments)`, non un array da `...args`
      // eslint-disable-next-line prefer-rest-params -- formato ufficiale Google Tag
      window.dataLayer!.push(arguments);
    } as Window["gtag"];
  }
  window.gtag!("js", new Date());
}

function getTelegramContext() {
  const tg = window.Telegram?.WebApp;
  const user = getTelegramWebAppUser();
  return {
    tg,
    user,
  };
}

export function initGa4(): void {
  ensureGtagBootstrap();
  const debugMode = isDebugHost();
  const { tg, user } = getTelegramContext();

  window.gtag?.("config", GA_MEASUREMENT_ID, { send_page_view: false });

  if (user?.id) {
    window.gtag?.("config", GA_MEASUREMENT_ID, {
      user_id: String(user.id),
      user_properties: {
        tg_platform: tg?.platform || "unknown",
      },
      debug_mode: debugMode,
    });
  }
}

export function trackMiniAppLaunch(): void {
  const debugMode = isDebugHost();
  const { tg } = getTelegramContext();
  window.gtag?.("event", "miniapp_launch", {
    tg_version: tg?.version || "unknown",
    tg_platform: tg?.platform || "unknown",
    debug_mode: debugMode,
  });
}

export function trackPageView(pagePath: string): void {
  window.gtag?.("config", GA_MEASUREMENT_ID, {
    page_path: pagePath,
  });
}
