import { Map, User, Rocket, Bell } from "lucide-react";

interface BottomNavProps {
  active: string;
  onNavigate: (tab: string) => void;
}

const tabs = [
  { id: "radar", icon: Map, label: "Mappa" },
  { id: "alerts", icon: Bell, label: "Alerts" },
  { id: "merchant", icon: Rocket, label: "Locale" },
  { id: "profile", icon: User, label: "Profile" },
];

const BottomNav = ({ active, onNavigate }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-border/30 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNavigate(tab.id)}
              className={`relative flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon
                className="w-5 h-5"
                strokeWidth={isActive ? 2 : 1.25}
              />
              <span className="text-[10px] font-medium">{tab.label}</span>
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
