import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, Users } from "lucide-react";
import type { Drop } from "@/data/mockDrops";

interface DropCardProps {
  drop: Drop;
  index: number;
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

const DropCard = ({ drop, index, onSelect }: DropCardProps) => {
  const [remaining, setRemaining] = useState(drop.remainingSeconds);
  const isUrgent = remaining < 300;
  const isExpiring = remaining < 180;
  const spotsComfortable = drop.quantityLeft > 2;

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
      {/* ~60% visivo: area immagine protagonista */}
      <div className="relative aspect-[5/3] w-full bg-muted">
        {drop.image ? (
          <img
            src={drop.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-muted to-muted/60 text-7xl">
            {drop.merchantLogo}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
        {drop.isGolden && (
          <span className="absolute left-3 top-3 rounded-full bg-accent/95 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-accent-foreground shadow-sm backdrop-blur-sm">
            ★ GOLDEN DROP
          </span>
        )}
        <div
          className={`absolute right-3 top-3 rounded-xl px-2.5 py-1 font-mono text-sm font-bold shadow-sm backdrop-blur-md ${
            drop.isGolden
              ? "bg-accent/90 text-accent-foreground"
              : "bg-primary/90 text-primary-foreground"
          }`}
        >
          -{drop.discountPercent}%
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-foreground">{drop.title}</h3>
          <p className="text-sm text-muted-foreground">{drop.merchant}</p>
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
            {drop.quantityLeft} left
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default DropCard;
