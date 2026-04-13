import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ExternalLink, MessageCircle, User } from "lucide-react";
import {
  fetchMiniappOfferteJsonp,
  parseTelegramBotUsernameFromTMeLink,
} from "@/api/miniappOfferte";
import { Button } from "@/components/ui/button";
import { projectEnv } from "@/config/projectEnv";
import {
  formatTelegramDisplayName,
  getTelegramWebAppUser,
} from "@/lib/telegramWebApp";

const FAQ_SUPPORT = [
  {
    q: "Come prenoto un’offerta?",
    a: "Dal radar apri il dettaglio e tocca «Prenota nel bot»: si apre la chat con il bot Telegram dove completi la prenotazione e ricevi il QR.",
  },
  {
    q: "Come funziona il radar",
    a: "Le offerte che vedi in elenco e sulla mappa sono quelle attive adesso nel raggio impostato dal servizio, filtrate come sul bot (geohash + distanza). L’elenco si aggiorna periodicamente mentre resti sulla sezione Mappa.",
  },
  {
    q: "Perché chiediamo la posizione?",
    a: "Serve solo per mostrarti le offerte vicino a te. La richiesta passa dal browser/Telegram: non memorizziamo la posizione lato mini app oltre a quanto serve al radar in sessione. Se rifiuti il permesso, puoi comunque usare il bot in chat per le offerte.",
  },
  {
    q: "Supporto",
    a: "Per dubbi o problemi scrivi nella chat del bot: è il canale principale di assistenza per LastMinuteBologna.",
  },
] as const;

const ProfileView = () => {
  const webAppBase = projectEnv.appsScriptWebAppBase?.trim() ?? "";
  const { data: offerteData } = useQuery({
    queryKey: ["miniapp-offerte", webAppBase],
    queryFn: () => fetchMiniappOfferteJsonp(webAppBase),
    enabled: Boolean(webAppBase),
    staleTime: 60_000,
  });

  const tgUser = getTelegramWebAppUser();
  const displayName = tgUser ? formatTelegramDisplayName(tgUser) : null;
  const username = tgUser?.username?.replace(/^@/, "").trim();

  const botUser = useMemo(() => {
    const configured = projectEnv.telegramBotUsername;
    if (configured) return configured;
    const list = offerteData?.ok ? (offerteData.offerte ?? []) : [];
    for (const o of list) {
      const u = parseTelegramBotUsernameFromTMeLink(o.link_prenota);
      if (u) return u;
    }
    return "";
  }, [offerteData]);

  const botUrl = botUser ? `https://t.me/${botUser}` : "";
  const tw = typeof window !== "undefined" ? window.Telegram?.WebApp : undefined;
  const canOpenBot = Boolean(botUrl);

  const openBotChat = () => {
    if (!botUrl) return;
    if (tw && typeof tw.openTelegramLink === "function") {
      tw.openTelegramLink(botUrl);
    } else {
      window.open(botUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="space-y-5 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-5 shadow-card"
      >
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
          <User className="h-4 w-4 text-primary" strokeWidth={1.25} />
          Chi sei
        </div>

        {tgUser ? (
          <div className="space-y-2">
            <p className="text-lg font-bold text-foreground">{displayName}</p>
            {username ? (
              <p className="text-sm text-muted-foreground">
                @{username}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Nessuno username pubblico su Telegram: va bene lo stesso per
                prenotazioni e QR.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Apri questa pagina come{" "}
            <strong className="text-foreground">mini app da Telegram</strong>{" "}
            (dal menu del bot o dal pulsante con link alla web app): così
            vediamo nome e username per personalizzare l’esperienza. Fuori da
            Telegram i dati utente non sono disponibili.
          </p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="space-y-3"
      >
        <p className="text-sm font-semibold text-foreground">Azioni rapide</p>
        <Button
          type="button"
          className="w-full rounded-xl font-semibold"
          disabled={!canOpenBot}
          onClick={() => openBotChat()}
        >
          <MessageCircle className="mr-2 h-4 w-4" strokeWidth={1.25} />
          Apri chat con il bot
        </Button>
        {!canOpenBot ? (
          <p className="text-xs text-amber-800 dark:text-amber-200">
            Non risulta il link al bot: configura{" "}
            <span className="font-mono">VITE_TELEGRAM_BOT_USERNAME</span> o{" "}
            <span className="font-mono">telegramBotUsername</span> in{" "}
            <span className="font-mono">runtime-config.json</span>, oppure
            assicurati che le offerte da API includano{" "}
            <span className="font-mono">link_prenota</span> (t.me/…).
          </p>
        ) : null}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-5 shadow-card"
      >
        <p className="mb-3 text-sm font-semibold text-foreground">
          FAQ breve
        </p>
        <ul className="space-y-4">
          {FAQ_SUPPORT.map((item) => (
            <li key={item.q} className="border-b border-border/40 pb-3 last:border-0 last:pb-0">
              <p className="text-xs font-semibold text-foreground">{item.q}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </li>
          ))}
        </ul>
        <a
          href="https://telegram.org/tour#how-do-i-use-apps"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
        >
          Mini app Telegram — come funziona
          <ExternalLink className="h-3 w-3" strokeWidth={1.25} />
        </a>
      </motion.div>
    </div>
  );
};

export default ProfileView;
