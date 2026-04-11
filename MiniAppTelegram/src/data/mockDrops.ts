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
}

export const mockDrops: Drop[] = [
  {
    id: "1",
    title: "Pistachio Croissant",
    merchant: "Café Bellini",
    merchantLogo: "🥐",
    originalPrice: 3.00,
    discountedPrice: 1.00,
    discountPercent: 67,
    category: "Bakery",
    distance: 200,
    remainingSeconds: 942,
    quantityLeft: 3,
    quantityTotal: 8,
    isGolden: false,
    lat: 41.9028,
    lng: 12.4964,
    image:
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80&auto=format&fit=crop",
    description: "Freshly baked pistachio croissants, butter-rich and fragrant."
  },
  {
    id: "2",
    title: "Premium Sushi Box (12 pcs)",
    merchant: "Sakura Express",
    merchantLogo: "🍣",
    originalPrice: 22.00,
    discountedPrice: 2.20,
    discountPercent: 90,
    category: "Sushi",
    distance: 350,
    remainingSeconds: 480,
    quantityLeft: 1,
    quantityTotal: 5,
    isGolden: true,
    lat: 41.9035,
    lng: 12.4950,
    image:
      "https://images.unsplash.com/photo-1579583760338-5ac7e9b8909a?w=800&q=80&auto=format&fit=crop",
    description: "Chef's selection premium sushi — salmon, tuna, eel. Must go today."
  },
  {
    id: "3",
    title: "Table for 2 — Rooftop Bar",
    merchant: "Sky Lounge Roma",
    merchantLogo: "🍸",
    originalPrice: 40.00,
    discountedPrice: 12.00,
    discountPercent: 70,
    category: "Dining",
    distance: 120,
    remainingSeconds: 1200,
    quantityLeft: 2,
    quantityTotal: 4,
    isGolden: false,
    lat: 41.9020,
    lng: 12.4980,
    image:
      "https://images.unsplash.com/photo-1514362541409-696c57db93f4?w=800&q=80&auto=format&fit=crop",
    description: "Rooftop table with panoramic view. Includes 2 house cocktails."
  },
  {
    id: "4",
    title: "Express Haircut",
    merchant: "BarberX Underground",
    merchantLogo: "✂️",
    originalPrice: 25.00,
    discountedPrice: 8.00,
    discountPercent: 68,
    category: "Services",
    distance: 90,
    remainingSeconds: 300,
    quantityLeft: 1,
    quantityTotal: 3,
    isGolden: false,
    lat: 41.9015,
    lng: 12.4970,
    image:
      "https://images.unsplash.com/photo-1585747860715-2ba307ce755f?w=800&q=80&auto=format&fit=crop",
    description: "Quick fade or classic cut. Walk in now, no waiting."
  },
  {
    id: "5",
    title: "Organic Veggie Box",
    merchant: "Green Market Hub",
    merchantLogo: "🥬",
    originalPrice: 15.00,
    discountedPrice: 1.50,
    discountPercent: 90,
    category: "Grocery",
    distance: 450,
    remainingSeconds: 180,
    quantityLeft: 2,
    quantityTotal: 10,
    isGolden: true,
    lat: 41.9040,
    lng: 12.4940,
    image:
      "https://images.unsplash.com/photo-1540420773420-3365772f2999?w=800&q=80&auto=format&fit=crop",
    description: "Mixed seasonal vegetables — tomatoes, zucchini, peppers. Today only."
  },
  {
    id: "6",
    title: "Espresso + Cornetto",
    merchant: "Bar Trastevere",
    merchantLogo: "☕",
    originalPrice: 4.50,
    discountedPrice: 1.50,
    discountPercent: 67,
    category: "Coffee",
    distance: 180,
    remainingSeconds: 720,
    quantityLeft: 5,
    quantityTotal: 12,
    isGolden: false,
    lat: 41.9025,
    lng: 12.4955,
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80&auto=format&fit=crop",
    description: "Classic Italian breakfast combo at a fraction of the price."
  },
];

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
