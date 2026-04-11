/**
 * Posizione utente per mappa e radar (con incertezza GPS se disponibile).
 */
export type UserMapPosition = {
  lat: number;
  lng: number;
  /** Metri (Geolocation API `coords.accuracy`), null se assente o inaffidabile */
  accuracyM: number | null;
};

export function userMapPositionFromGeolocation(
  pos: GeolocationPosition,
): UserMapPosition {
  const c = pos.coords;
  let accuracyM: number | null = null;
  if (
    c.accuracy != null &&
    Number.isFinite(c.accuracy) &&
    c.accuracy > 0 &&
    c.accuracy < 50_000
  ) {
    accuracyM = Math.round(c.accuracy);
  }
  return {
    lat: c.latitude,
    lng: c.longitude,
    accuracyM,
  };
}
