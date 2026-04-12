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
