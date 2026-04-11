export interface Drop {
  id: string;
  title: string;
  merchant: string;
  merchantLogo: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercent: number;
  category: string;
  distance: number; // meters
  remainingSeconds: number;
  quantityLeft: number;
  quantityTotal: number;
  isGolden: boolean;
  lat: number;
  lng: number;
  image: string;
  description: string;
  /** Da Apps Script (t.me/...?start=id) */
  linkPrenota?: string;
  urlMaps?: string;
}

/** Non usato per il radar: le offerte arrivano solo dalla web app (`api_miniapp`). */
export const mockDrops: Drop[] = [];

export const userProfile = {
  name: "Marco R.",
  level: 7,
  karmaPoints: 2450,
  reliabilityScore: 94,
  totalSaved: 187.50,
  dropsGrabbed: 34,
  isPremium: true,
  preferences: ["Sushi", "Coffee", "Bakery", "Dining"],
  badges: [
    { name: "Early Bird", icon: "🌅", description: "Grabbed 5 drops before 8am" },
    { name: "Golden Hunter", icon: "🏆", description: "Claimed 3 GoldenDrops" },
    { name: "Neighborhood Hero", icon: "🦸", description: "100% reliability score for 30 days" },
    { name: "Speed Runner", icon: "⚡", description: "Arrived in under 3 minutes" },
  ],
};
