/**
 * Allineato a UTILS/geo/geo_geohash.js e MiniAppTelegram/app.js (precisione 6 nel radar).
 */
export function encodeGeohash(lat: number, lng: number, precision: number): string {
  const chars = "0123456789bcdefghjkmnpqrstuvwxyz";
  let hash = "";
  let minLat = -90;
  let maxLat = 90;
  let minLng = -180;
  let maxLng = 180;
  let bit = 0;
  let ch = 0;
  let even = true;

  while (hash.length < precision) {
    let mid: number;
    if (even) {
      mid = (minLng + maxLng) / 2;
      if (lng > mid) {
        ch |= 1 << (4 - bit);
        minLng = mid;
      } else {
        maxLng = mid;
      }
    } else {
      mid = (minLat + maxLat) / 2;
      if (lat > mid) {
        ch |= 1 << (4 - bit);
        minLat = mid;
      } else {
        maxLat = mid;
      }
    }
    even = !even;
    if (bit < 4) {
      bit += 1;
    } else {
      hash += chars[ch];
      bit = 0;
      ch = 0;
    }
  }
  return hash;
}
