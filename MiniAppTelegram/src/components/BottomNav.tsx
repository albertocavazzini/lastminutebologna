import { Tag, User, Ticket } from "lucide-react";

interface BottomNavProps {
  active: string;
  onNavigate: (tab: string) => void;
}

const tabs = [
  { id: "radar", icon: Tag, label: "Offerte" },
  { id: "prenotazioni", icon: Ticket, label: "Prenotazioni" },
  { id: "profile", icon: User, label: "Profilo" },
];

const BottomNav = ({ active, onNavigate }: BottomNavProps) => {
  return (
    <nav className="lmb-nav-safe-pb fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-border/30">
      <div className="mx-auto flex min-h-16 max-w-md items-center justify-around px-1 pt-0">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNavigate(tab.id)}
              className={`relative flex min-h-touch-comfort min-w-touch-comfort flex-col items-center justify-center gap-0.5 px-2 py-1 transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.25} />
              <span className="text-lmb-label font-medium">{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0.5 h-1 w-6 rounded-full bg-primary/90" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
