import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MapPin,
  Clock,
  Users,
  QrCode,
  CheckCircle2,
  Navigation,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Drop } from "@/data/mockDrops";
import { MINIAPP_OFFERTE_QUERY_ROOT } from "@/api/miniappOfferte";
import { MINIAPP_PRENOTAZIONI_QUERY_ROOT } from "@/api/miniappPrenotazioni";

interface DropDetailProps {
  drop: Drop | null;
  onClose: () => void;
  /** Id offerta (`drop.id`) per cui l'utente ha già una prenotazione (da `prenotazioni_mie`). */
  idsOfferteConPrenotazione?: ReadonlySet<string>;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const DropDetail = ({
  drop,
  onClose,
  idsOfferteConPrenotazione = new Set(),
}: DropDetailProps) => {
  const queryClient = useQueryClient();
  const [remaining, setRemaining] = useState(0);
  const [step, setStep] = useState<"detail" | "qr" | "confirmed">("detail");
  const [limitePrenotaOpen, setLimitePrenotaOpen] = useState(false);

  useEffect(() => {
    if (drop) {
      setRemaining(drop.remainingSeconds);
      setStep("detail");
      setLimitePrenotaOpen(false);
    }
  }, [drop]);

  useEffect(() => {
    if (!drop) return;
    const interval = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [drop]);

  const handleBookAndPay = () => setStep("qr");
  const handleConfirm = () => setStep("confirmed");

  if (!drop) return null;

  const openTelegramPrenota = () => {
    const url = drop.linkPrenota;
    if (!url) return;
    const tw = window.Telegram?.WebApp;
    if (tw && typeof tw.openTelegramLink === "function") {
      tw.openTelegramLink(url);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    void queryClient.invalidateQueries({ queryKey: [MINIAPP_PRENOTAZIONI_QUERY_ROOT] });
    void queryClient.invalidateQueries({ queryKey: [MINIAPP_OFFERTE_QUERY_ROOT] });
    onClose();
  };

  const onPrenotaClick = () => {
    if (!drop.linkPrenota) {
      handleBookAndPay();
      return;
    }
    if (idsOfferteConPrenotazione.has(drop.id)) {
      setLimitePrenotaOpen(true);
      return;
    }
    openTelegramPrenota();
  };

  const openMapsUrl = () => {
    if (drop.urlMaps) {
      window.open(drop.urlMaps, "_blank", "noopener,noreferrer");
    }
  };

  const isUrgent = remaining < 300;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md glass-strong rounded-t-3xl sm:rounded-3xl overflow-hidden"
        >
          {step === "detail" && (
            <div>
              <div className="border-b border-border/50 px-5 pt-4 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    {drop.isGolden ? (
                      <span className="inline-block rounded-full bg-accent/95 px-2.5 py-1 text-[10px] font-semibold text-accent-foreground shadow-sm">
                        ★ GOLDEN DROP
                      </span>
                    ) : null}
                    <h2 className="text-xl font-bold text-foreground">{drop.title}</h2>
                    <p className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                      <Store className="h-4 w-4 shrink-0" strokeWidth={1.25} />
                      <span className="truncate">{drop.merchant}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="shrink-0 rounded-full bg-card/90 p-2 text-foreground shadow-card backdrop-blur-sm border border-border/50"
                  >
                    <X className="h-5 w-5" strokeWidth={1.25} />
                  </button>
                </div>
              </div>

              <div className="space-y-5 p-6">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {drop.description}
                </p>

              {/* Price */}
              <div className="flex items-end gap-3">
                <span className="text-3xl font-bold text-primary">
                  €{drop.discountedPrice.toFixed(2)}
                </span>
                <span className="text-lg text-muted-foreground line-through">
                  €{drop.originalPrice.toFixed(2)}
                </span>
                <span
                  className={`ml-auto px-3 py-1 rounded-lg font-mono font-bold ${
                    drop.isGolden
                      ? "bg-accent/20 text-accent"
                      : "bg-primary/15 text-primary"
                  }`}
                >
                  -{drop.discountPercent}%
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-border/60 bg-secondary/40 p-3 text-center">
                  <MapPin className="w-4 h-4 mx-auto mb-1 text-muted-foreground" strokeWidth={1.25} />
                  <p className="text-sm font-semibold text-foreground">
                    {drop.distance >= 1000
                      ? `${(drop.distance / 1000).toFixed(1)} km`
                      : `${Math.round(drop.distance)} m`}
                  </p>
                  <p className="text-xs text-muted-foreground">circa</p>
                </div>
                <div
                  className={`rounded-2xl border border-border/60 bg-secondary/40 p-3 text-center ${isUrgent ? "ring-1 ring-destructive/30" : ""}`}
                >
                  <Clock
                    className={`w-4 h-4 mx-auto mb-1 ${isUrgent ? "text-destructive" : "text-muted-foreground"}`}
                    strokeWidth={1.25}
                  />
                  <p
                    className={`text-sm font-mono font-semibold ${isUrgent ? "text-destructive" : "text-foreground"}`}
                  >
                    {formatTime(remaining)}
                  </p>
                  <p className="text-xs text-muted-foreground">left</p>
                </div>
                <div
                  className={`rounded-2xl border border-border/60 bg-secondary/40 p-3 text-center ${drop.quantityLeft <= 2 ? "ring-1 ring-destructive/30" : "ring-1 ring-success/20"}`}
                >
                  <Users
                    className={`w-4 h-4 mx-auto mb-1 ${drop.quantityLeft > 2 ? "text-success" : "text-muted-foreground"}`}
                    strokeWidth={1.25}
                  />
                  <p
                    className={`text-sm font-semibold ${drop.quantityLeft > 2 ? "text-success" : "text-foreground"}`}
                  >
                    {drop.quantityLeft}/{drop.quantityTotal}
                  </p>
                  <p className="text-xs text-muted-foreground">prodotti rimanenti</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-xl border-border text-foreground hover:bg-secondary"
                  disabled={!drop.urlMaps}
                  onClick={openMapsUrl}
                >
                  <Navigation className="w-4 h-4 mr-2" strokeWidth={1.25} />
                  Mappa
                </Button>
                <Button
                  type="button"
                  onClick={onPrenotaClick}
                  className={`flex-1 rounded-xl font-bold ${
                    drop.isGolden
                      ? "bg-accent text-accent-foreground hover:bg-accent/90 glow-gold"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 glow-green"
                  }`}
                >
                  <QrCode className="w-4 h-4 mr-2" strokeWidth={1.25} />
                  {drop.linkPrenota ? "Prenota nel bot" : "Book & Pay"}
                </Button>
              </div>
              </div>
            </div>
          )}

          {step === "qr" && (
            <div className="p-6 text-center space-y-5">
              <h2 className="text-xl font-bold text-foreground">
                Scan QR at Counter
              </h2>
              <p className="text-sm text-muted-foreground">
                Show this to the merchant or scan their QR code
              </p>

              {/* Simulated QR */}
              <div className="mx-auto w-48 h-48 bg-foreground rounded-xl p-4 relative">
                <div className="w-full h-full bg-background rounded-lg grid grid-cols-8 grid-rows-8 gap-0.5 p-2">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-[1px] ${
                        Math.random() > 0.4 ? "bg-foreground" : "bg-background"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-secondary/40 p-3">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-primary">
                  €{drop.discountedPrice.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  via saved card •••• 4242
                </p>
              </div>

              <Button
                onClick={handleConfirm}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-green"
              >
                Simulate Payment Confirmed
              </Button>
            </div>
          )}

          {step === "confirmed" && (
            <div className="p-6 text-center space-y-5">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 10 }}
              >
                <CheckCircle2 className="w-20 h-20 mx-auto text-success" strokeWidth={1.25} />
              </motion.div>
              <h2 className="text-xl font-bold text-foreground">
                Payment confirmed
              </h2>
              <p className="text-sm text-success font-medium">
                You&apos;re all set — show your order at {drop.merchant}
              </p>
              <p className="text-sm text-muted-foreground">
                Enjoy your {drop.title}
              </p>
              <div className="rounded-2xl border border-success/25 bg-success/5 p-3">
                <p className="text-xs text-muted-foreground">You saved</p>
                <p className="text-2xl font-bold text-primary">
                  €{(drop.originalPrice - drop.discountedPrice).toFixed(2)}
                </p>
                <p className="text-xs font-medium text-success mt-1">
                  +15 Karma Points earned!
                </p>
              </div>
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full rounded-xl border-border text-foreground"
              >
                Done
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>

      <AlertDialog open={limitePrenotaOpen} onOpenChange={setLimitePrenotaOpen}>
        <AlertDialogContent className="max-w-[min(100vw-2rem,24rem)] rounded-2xl border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Prenotazione già presente</AlertDialogTitle>
            <AlertDialogDescription>
              Hai già una prenotazione per questa offerta. Puoi ordinarne al
              massimo una alla volta. Controlla la sezione Prenotazioni per il
              tuo QR.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              type="button"
              className="rounded-xl"
              onClick={() => setLimitePrenotaOpen(false)}
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AnimatePresence>
  );
};

export default DropDetail;
