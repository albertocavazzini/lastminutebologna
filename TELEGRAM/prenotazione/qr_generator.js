/**
 * @fileoverview Invio QR prenotazione via Telegram (flusso alternativo a booking inline).
 */

/**
 * @param {string} chatId
 * @param {string} idPrenotazione
 * @param {!Object} info
 */
function generaEInviaQR(chatId, idPrenotazione, info) {
  const C = getConfigOttimizzato();

  const nomeLocale = info.locale || info.nome;
  const urlValidazione = urlValidazionePrenotazione_(C, idPrenotazione, nomeLocale);
  const qrUrl = urlImmagineQrDaValidazione_(urlValidazione);
  const didascalia = markdownConfermaPrenotazione_(info);

  try {
    inviaFotoConFallbackLinkQr_(chatId, qrUrl, didascalia);
  } catch (e) {
    console.error('❌ Errore in generaEInviaQR: ' + e.message);
  }
}
