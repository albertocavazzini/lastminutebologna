/**
 * @fileoverview Entry point trigger temporale (ciclo minuto).
 */

/**
 * Richiamata dal trigger temporale (es. ogni minuto).
 */
function eseguiCicloMinuto() {
  const C = getConfigOttimizzato();
  controllaEInviaOfferte(C);
  gestisciInvioFeedback(C);
}
