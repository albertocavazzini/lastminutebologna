import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MapPin,
  Clock,
  Users,
  QrCode,
  CheckCircle2,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Drop } from "@/data/mockDrops";

interface DropDetailProps {
  drop: Drop | null;
  onClose: () => void;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const DropDetail = ({ drop, onClose }: DropDetailProps) => {
  const [remaining, setRemaining] = useState(0);
  const [step, setStep] = useState<"detail" | "qr" | "confirmed">("detail");

  useEffect(() => {
    if (drop) {
      setRemaining(drop.remainingSeconds);
      setStep("detail");
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
              <div className="relative aspect-[16/10] w-full bg-muted">
                {drop.image ? (
                  <img
                    src={drop.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-7xl">
                    {drop.merchantLogo}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-3 top-3 rounded-full bg-card/90 p-2 text-foreground shadow-card backdrop-blur-sm border border-border/50"
                >
                  <X className="h-5 w-5" strokeWidth={1.25} />
                </button>
                {drop.isGolden && (
                  <span className="absolute left-3 top-3 rounded-full bg-accent/95 px-2.5 py-1 text-[10px] font-semibold text-accent-foreground shadow-sm">
                    ★ GOLDEN DROP
                  </span>
                )}
              </div>

              <div className="space-y-5 p-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {drop.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">{drop.merchant}</p>
                </div>

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
                    {drop.distance}m
                  </p>
                  <p className="text-xs text-muted-foreground">away</p>
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
                  <p className="text-xs text-muted-foreground">spots left</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl border-border text-foreground hover:bg-secondary"
                >
                  <Navigation className="w-4 h-4 mr-2" strokeWidth={1.25} />
                  Navigate
                </Button>
                <Button
                  onClick={handleBookAndPay}
                  className={`flex-1 rounded-xl font-bold ${
                    drop.isGolden
                      ? "bg-accent text-accent-foreground hover:bg-accent/90 glow-gold"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 glow-green"
                  }`}
                >
                  <QrCode className="w-4 h-4 mr-2" strokeWidth={1.25} />
                  Book & Pay
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
    </AnimatePresence>
  );
};

export default DropDetail;
