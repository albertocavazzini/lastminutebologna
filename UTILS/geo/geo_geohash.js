/**
 * @fileoverview Generazione stringa Geohash da coordinate.
 */

/**
 * @param {number} lat
 * @param {number} lng
 * @param {number} precisione
 * @return {string}
 */
function generaGeohash(lat, lng, precisione = 6) {
  const caratteri = '0123456789bcdefghjkmnpqrstuvwxyz';
  let hash = '';
  let minLat = -90;
  let maxLat = 90;
  let minLng = -180;
  let maxLng = 180;
  let bit = 0;
  let ch = 0;
  let even = true;

  while (hash.length < precisione) {
    let mid;
    if (even) {
      mid = (minLng + maxLng) / 2;
      if (lng > mid) {
        ch |= (1 << (4 - bit));
        minLng = mid;
      } else {
        maxLng = mid;
      }
    } else {
      mid = (minLat + maxLat) / 2;
      if (lat > mid) {
        ch |= (1 << (4 - bit));
        minLat = mid;
      } else {
        maxLat = mid;
      }
    }
    even = !even;
    if (bit < 4) {
      bit++;
    } else {
      hash += caratteri[ch];
      bit = 0;
      ch = 0;
    }
  }
  return hash;
}
