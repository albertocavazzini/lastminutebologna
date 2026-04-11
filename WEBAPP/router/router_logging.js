/**
 * @fileoverview Log diagnostici richieste web app (doGet).
 */

/**
 * @param {*} e Evento doGet Apps Script.
 */
function logRichiestaWebApp_(e) {
  const q = e && e.queryString != null ? String(e.queryString) : '';
  const param = e && e.parameter ? e.parameter : {};
  const keys = Object.keys(param);
  const pathInfo = e && e.pathInfo != null ? String(e.pathInfo) : '';
  console.log('--- NUOVA RICHIESTA GWA ---');
  console.log('[Router] pathInfo (dopo /exec/): ' + (pathInfo ? pathInfo : '(vuoto)'));
  console.log('[Router] queryString (grezzo): ' + (q ? q : '(vuoto)'));
  console.log('[Router] Chiavi e.parameter: ' + JSON.stringify(keys));
  console.log('[Router] e.parameter: ' + JSON.stringify(param));
  if (q && keys.length === 0) {
    console.warn(
        '[Router] Anomalia: queryString presente ma e.parameter vuoto — controlla encoding o duplicati.');
  }
}
