/**
 * @fileoverview URL web app validazione / feedback e link immagine QR (api.qrserver.com).
 */

/**
 * @param {!Object} C Config con URL_WEB_APP_VALIDATORE.
 * @param {string} idPrenotazione
 * @param {string} nomeLocale
 * @return {string}
 */
function urlValidazionePrenotazione_(C, idPrenotazione, nomeLocale) {
  return (
      `${C.URL_WEB_APP_VALIDATORE}?id=${encodeURIComponent(idPrenotazione)}` +
      `&loc=${encodeURIComponent(nomeLocale)}`);
}

/**
 * @param {string} urlValidazione URL completo da codificare nel QR.
 * @return {string}
 */
function urlImmagineQrDaValidazione_(urlValidazione) {
  return (
      'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' +
      `${encodeURIComponent(urlValidazione)}&ecc=M`);
}

/**
 * @param {!Object} C
 * @param {string} idPrenotazione
 * @param {string} nomeLocale
 * @return {string}
 */
function urlWebAppFeedback_(C, idPrenotazione, nomeLocale) {
  return (
      `${C.URL_WEB_APP_VALIDATORE}?mode=fb&id=${encodeURIComponent(idPrenotazione)}` +
      `&loc=${encodeURIComponent(nomeLocale)}`);
}
