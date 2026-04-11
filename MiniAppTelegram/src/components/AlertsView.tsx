import { motion } from "framer-motion";
import { Bell, MapPin, Clock, Star, Filter } from "lucide-react";

const alerts = [
  {
    id: "1",
    title: "Pistachio Croissant at €1",
    merchant: "Café Bellini",
    emoji: "🥐",
    distance: "200m",
    time: "2 min ago",
    category: "Bakery",
    matched: true,
    isGolden: false,
  },
  {
    id: "2",
    title: "Premium Sushi Box 90% OFF",
    merchant: "Sakura Express",
    emoji: "🍣",
    distance: "350m",
    time: "5 min ago",
    category: "Sushi",
    matched: true,
    isGolden: true,
  },
  {
    id: "3",
    title: "Espresso + Cornetto €1.50",
    merchant: "Bar Trastevere",
    emoji: "☕",
    distance: "180m",
    time: "8 min ago",
    category: "Coffee",
    matched: true,
    isGolden: false,
  },
  {
    id: "4",
    title: "Express Haircut",
    merchant: "BarberX Underground",
    emoji: "✂️",
    distance: "90m",
    time: "12 min ago",
    category: "Services",
    matched: false,
    isGolden: false,
  },
];

const AlertsView = () => {
  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" strokeWidth={1.25} />
          Smart Alerts
        </h2>
        <button
          type="button"
          className="glass flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs text-muted-foreground"
        >
          <Filter className="h-3 w-3" strokeWidth={1.25} />
          AI Filtered
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Only showing alerts matching your preferences: Sushi, Coffee, Bakery,
        Dining
      </p>

      {alerts.map((alert, i) => (
        <motion.div
          key={alert.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className={`glass rounded-2xl border border-border/50 p-4 shadow-sm ${
            !alert.matched ? "opacity-40" : ""
          } ${alert.isGolden ? "ring-1 ring-accent/35" : ""}`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${
                alert.isGolden ? "bg-accent/20" : "bg-primary/10"
              }`}
            >
              {alert.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {alert.isGolden && (
                  <Star className="w-3 h-3 shrink-0 text-accent" strokeWidth={1.25} />
                )}
                <h3 className="text-sm font-semibold text-foreground truncate">
                  {alert.title}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">{alert.merchant}</p>
              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-2.5 h-2.5" strokeWidth={1.25} />
                  {alert.distance}
                </span>
                <span className="flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" strokeWidth={1.25} />
                  {alert.time}
                </span>
                {alert.matched ? (
                  <span className="text-primary">✓ Matches preferences</span>
                ) : (
                  <span className="text-muted-foreground">✗ Filtered out</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default AlertsView;
