import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, Store, Users } from "lucide-react";
import type { Drop } from "@/data/mockDrops";

interface DropCardProps {
  drop: Drop;
  index: number;
  /** Timestamp (ms) di ultimo aggiornamento dataset offerte da React Query. */
  dataUpdatedAtMs: number;
  onSelect: (drop: Drop) => void;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

function formatDistanceMeters(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return "—";
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

const iconThin = { strokeWidth: 1.25 } as const;

const DropCard = ({ drop, index, dataUpdatedAtMs, onSelect }: DropCardProps) => {
  const computeRemaining = () => {
    const base = Number.isFinite(drop.remainingSeconds) ? drop.remainingSeconds : 0;
    const ageSec = Math.max(0, Math.floor((Date.now() - dataUpdatedAtMs) / 1000));
    return Math.max(0, base - ageSec);
  };
  const [remaining, setRemaining] = useState(computeRemaining);
  const isUrgent = remaining < 300;
  const isExpiring = remaining < 180;
  const spotsComfortable = drop.quantityLeft > 2;

  useEffect(() => {
    setRemaining(computeRemaining());
    // Riesegue quando cambia card o nuovo dataset dal server.
  }, [drop.id, drop.remainingSeconds, dataUpdatedAtMs]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [drop.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      onClick={() => onSelect(drop)}
      className={`group cursor-pointer rounded-2xl overflow-hidden bg-card text-card-foreground shadow-card border border-border/60 transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 ${
        drop.isGolden ? "ring-1 ring-accent/35" : ""
      } ${isExpiring ? "animate-pulse-urgent" : ""}`}
    >
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            {drop.isGolden ? (
              <span className="inline-block rounded-full bg-accent/95 px-2.5 py-1 text-lmb-label font-semibold tracking-wide text-accent-foreground shadow-sm">
                ★ GOLDEN DROP
              </span>
            ) : null}
            <h3 className="truncate font-semibold text-foreground">{drop.title}</h3>
            <p className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
              <Store className="h-3.5 w-3.5 shrink-0" {...iconThin} />
              <span className="truncate">{drop.merchant}</span>
            </p>
          </div>
          <div
            className={`shrink-0 rounded-xl px-2.5 py-1 font-mono text-sm font-bold shadow-sm backdrop-blur-md ${
              drop.isGolden
                ? "bg-accent/90 text-accent-foreground"
                : "bg-primary/90 text-primary-foreground"
            }`}
          >
            -{drop.discountPercent}%
          </div>
        </div>

        <div className="flex items-end gap-2">
          <span className="text-sm text-muted-foreground line-through">
            €{drop.originalPrice.toFixed(2)}
          </span>
          <span
            className={`text-xl font-bold ${
              drop.isGolden ? "text-accent" : "text-primary"
            }`}
          >
            €{drop.discountedPrice.toFixed(2)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" {...iconThin} />
            {formatDistanceMeters(drop.distance)}
          </span>
          <span
            className={`flex items-center gap-1 font-mono font-medium ${
              isUrgent ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            <Clock className="h-3.5 w-3.5 shrink-0" {...iconThin} />
            {formatTime(remaining)}
          </span>
          <span
            className={`flex items-center gap-1 font-medium ${
              spotsComfortable
                ? "text-success"
                : drop.quantityLeft <= 2
                  ? "text-destructive"
                  : ""
            }`}
          >
            <Users className="h-3.5 w-3.5 shrink-0" {...iconThin} />
            {drop.quantityLeft} prodotti rimanenti
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default DropCard;
