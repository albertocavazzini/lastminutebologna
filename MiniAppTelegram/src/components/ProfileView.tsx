import { motion } from "framer-motion";
import { Star, Shield, Zap, TrendingUp, Crown } from "lucide-react";
import { userProfile } from "@/data/mockDrops";

const ProfileView = () => {
  const {
    name,
    level,
    karmaPoints,
    reliabilityScore,
    totalSaved,
    dropsGrabbed,
    isPremium,
    badges,
  } = userProfile;

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-5 text-center shadow-card"
      >
        <div className="relative inline-block mb-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10 text-3xl shadow-sm">
            🦊
          </div>
          {isPremium && (
            <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent shadow-card">
              <Crown className="h-4 w-4 text-accent-foreground" strokeWidth={1.25} />
            </div>
          )}
        </div>
        <h2 className="text-xl font-bold text-foreground">{name}</h2>
        <p className="text-sm font-medium text-primary">
          Level {level} • Premium Hunter
        </p>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="glass rounded-2xl p-4 text-center shadow-sm">
          <Star className="w-5 h-5 mx-auto mb-1 text-accent" strokeWidth={1.25} />
          <p className="text-2xl font-bold font-mono text-foreground">
            {karmaPoints.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">Karma Points</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <Shield className="w-5 h-5 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold font-mono text-foreground">
            {reliabilityScore}%
          </p>
          <p className="text-xs text-muted-foreground">Reliability</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center shadow-sm">
          <TrendingUp className="w-5 h-5 mx-auto mb-1 text-primary" strokeWidth={1.25} />
          <p className="text-2xl font-bold font-mono text-primary">
            €{totalSaved.toFixed(0)}
          </p>
          <p className="text-xs text-muted-foreground">Total Saved</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center shadow-sm">
          <Zap className="w-5 h-5 mx-auto mb-1 text-accent" strokeWidth={1.25} />
          <p className="text-2xl font-bold font-mono text-foreground">
            {dropsGrabbed}
          </p>
          <p className="text-xs text-muted-foreground">Drops Grabbed</p>
        </div>
      </motion.div>

      {/* Badges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-5 shadow-sm"
      >
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Achievements
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {badges.map((badge, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-xl bg-secondary/50 p-2.5"
            >
              <span className="text-xl">{badge.icon}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {badge.name}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {badge.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* XP Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl p-5 shadow-sm"
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Level {level}</span>
          <span className="text-xs text-muted-foreground">
            Level {level + 1}
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "65%" }}
            transition={{ delay: 0.5, duration: 1 }}
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          350 XP to next level
        </p>
      </motion.div>
    </div>
  );
};

export default ProfileView;
