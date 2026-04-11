/**
 * @fileoverview URL web app proprietario (path /exec/TOKEN).
 */

/**
 * @param {string} urlBaseWebApp
 * @param {string} tokenAccesso
 * @return {string}
 */
function costruisciUrlWebAppProprietario(urlBaseWebApp, tokenAccesso) {
  let base = String(urlBaseWebApp || '').trim();
  const token = String(tokenAccesso || '').trim();
  if (!base) {
    return '';
  }
  if (!token) {
    return base;
  }
  const q = base.indexOf('?');
  if (q !== -1) {
    base = base.substring(0, q);
  }
  base = base.replace(/\/+$/, '');
  return base + '/' + encodeURIComponent(token);
}

/**
 * Funzione personalizzata per colonna H Anagrafica.
 * @param {string} urlBaseWebApp
 * @param {string} tokenAccesso
 * @return {string}
 */
function LINK_LOCALE_URL(urlBaseWebApp, tokenAccesso) {
  return costruisciUrlWebAppProprietario(urlBaseWebApp, tokenAccesso);
}
