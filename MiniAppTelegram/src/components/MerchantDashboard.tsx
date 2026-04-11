import { useState } from "react";
import { motion } from "framer-motion";
import {
  Rocket,
  TrendingUp,
  Eye,
  Users,
  Clock,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const MerchantDashboard = () => {
  const [launched, setLaunched] = useState(false);
  const [formData, setFormData] = useState({
    product: "Margherita Pizza Slice",
    originalPrice: "5.00",
    discount: "60",
    quantity: "8",
    duration: "15",
  });

  const handleLaunch = () => {
    setLaunched(true);
    setTimeout(() => setLaunched(false), 3000);
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-5 shadow-sm"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-xl">
            🍕
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Pizzeria Da Marco
            </h2>
            <p className="text-sm text-muted-foreground">Merchant Dashboard</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <Eye className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold font-mono text-foreground">247</p>
            <p className="text-[10px] text-muted-foreground">Views today</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <Users className="w-4 h-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold font-mono text-primary">18</p>
            <p className="text-[10px] text-muted-foreground">Arrivals</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <TrendingUp className="w-4 h-4 mx-auto mb-1 text-accent" />
            <p className="text-lg font-bold font-mono text-accent">73%</p>
            <p className="text-[10px] text-muted-foreground">Conversion</p>
          </div>
        </div>
      </motion.div>

      {/* Flash Launcher */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-5 shadow-sm"
      >
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
          <Rocket className="h-4 w-4 text-primary" strokeWidth={1.25} />
          Flash Launcher
        </h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Product Name
            </label>
            <input
              type="text"
              value={formData.product}
              onChange={(e) =>
                setFormData({ ...formData, product: e.target.value })
              }
              className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Original Price (€)
              </label>
              <input
                type="number"
                value={formData.originalPrice}
                onChange={(e) =>
                  setFormData({ ...formData, originalPrice: e.target.value })
                }
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Discount %
              </label>
              <input
                type="number"
                value={formData.discount}
                onChange={(e) =>
                  setFormData({ ...formData, discount: e.target.value })
                }
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Quantity
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Duration
              </label>
              <div className="flex gap-2">
                {["15", "30"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setFormData({ ...formData, duration: d })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.duration === d
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Clock className="w-3 h-3 inline mr-1" />
                    {d}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="glass rounded-lg p-3 mt-2">
            <p className="text-xs text-muted-foreground mb-1">Drop Preview</p>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">
                {formData.product}
              </span>
              <div className="text-right">
                <span className="text-sm text-muted-foreground line-through mr-2">
                  €{formData.originalPrice}
                </span>
                <span className="font-bold text-primary">
                  €
                  {(
                    parseFloat(formData.originalPrice || "0") *
                    (1 - parseInt(formData.discount || "0") / 100)
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleLaunch}
            disabled={launched}
            className="w-full rounded-xl bg-primary font-bold text-primary-foreground hover:bg-primary/90 glow-green"
          >
            {launched ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4 text-success" strokeWidth={1.25} />
                Drop Launched!
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Launch Flash Drop
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Heatmap simulation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-5 shadow-sm"
      >
        <h3 className="mb-3 text-sm font-bold text-foreground">
          Nearby User Heatmap
        </h3>
        <div className="relative h-32 bg-secondary/30 rounded-lg overflow-hidden">
          {/* Simulated heatmap dots */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-primary/40 blur-sm"
              style={{
                width: `${8 + Math.random() * 16}px`,
                height: `${8 + Math.random() * 16}px`,
                top: `${10 + Math.random() * 80}%`,
                left: `${5 + Math.random() * 90}%`,
                opacity: 0.3 + Math.random() * 0.5,
              }}
            />
          ))}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-accent rounded-full glow-gold" />
          <p className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">
            ~42 users within 500m
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default MerchantDashboard;
