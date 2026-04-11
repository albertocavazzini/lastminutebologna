/**
 * @fileoverview Testi Markdown e invio foto+QR con fallback testuale (Telegram).
 */

/**
 * @param {!Object} info locale|nome, descrizione, prezzo|prezzoFinale, scadenza, urlMaps
 * @return {string}
 */
function markdownConfermaPrenotazione_(info) {
  const locale = info.locale || info.nome || 'Locale';
  const prezzo =
      info.prezzoFinale != null && info.prezzoFinale !== '' ?
      info.prezzoFinale :
      info.prezzo;
  return (
      `✅ *PRENOTAZIONE REGISTRATA!*\n\n` +
      `📍 *${locale}*\n` +
      `🥯 ${info.descrizione}\n` +
      `💰 Prezzo: *${prezzo}*\n` +
      `🕒 Mostra questo QR al titolare entro le: *${info.scadenza}*\n\n` +
      `📍 [Indicazioni Maps](${info.urlMaps})`);
}

/**
 * Invia foto QR; se fallisce, messaggio testuale con link allo stesso QR.
 * @param {string} chatId
 * @param {string} qrUrl
 * @param {string} didascaliaMarkdown
 */
function inviaFotoConFallbackLinkQr_(chatId, qrUrl, didascaliaMarkdown) {
  if (inviaFotoUrl(chatId, qrUrl, didascaliaMarkdown)) {
    return;
  }
  console.warn(`⚠️ Invio foto QR fallito per ${chatId}, invio link testuale.`);
  inviaMessaggio(
      chatId,
      didascaliaMarkdown + `\n\n⚠️ [Apri il QR da qui](${qrUrl})`);
}
