/**
 * @fileoverview Distanza Haversine tra due punti GPS.
 */

/**
 * @param {?number} lat1
 * @param {?number} lon1
 * @param {?number} lat2
 * @param {?number} lon2
 * @return {number} km; valore molto alto se mancano coordinate.
 */
function getDistanzaGps(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return 999999;
  }

  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
