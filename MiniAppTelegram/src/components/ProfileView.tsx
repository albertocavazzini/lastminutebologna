import { motion } from "framer-motion";
import { ExternalLink, MessageCircle, User } from "lucide-react";
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
    q: "Perché chiediamo la posizione?",
    a: "Per mostrarti le offerte last minute nel raggio corretto (come sul bot), usando geohash e distanza. Senza GPS l’elenco radar non è disponibile.",
  },
  {
    q: "Supporto",
    a: "Per dubbi o problemi scrivi nella chat del bot: è il canale principale di assistenza per LastMinuteBologna.",
  },
] as const;

const ProfileView = () => {
  const tgUser = getTelegramWebAppUser();
  const displayName = tgUser ? formatTelegramDisplayName(tgUser) : null;
  const username = tgUser?.username?.replace(/^@/, "").trim();
  const botUser = projectEnv.telegramBotUsername;
  const botUrl = botUser ? `https://t.me/${botUser}` : "";

  const openBotChat = () => {
    if (!botUrl) return;
    const tw = window.Telegram?.WebApp;
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
          disabled={!botUrl}
          onClick={() => openBotChat()}
        >
          <MessageCircle className="mr-2 h-4 w-4" strokeWidth={1.25} />
          Apri chat con il bot
        </Button>
        {!botUrl ? (
          <p className="text-xs text-amber-800 dark:text-amber-200">
            Configura il nome utente del bot senza @ in{" "}
            <span className="font-mono">VITE_TELEGRAM_BOT_USERNAME</span> o in{" "}
            <span className="font-mono">runtime-config.json</span> (
            <span className="font-mono">telegramBotUsername</span>) per
            abilitare il pulsante.
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
