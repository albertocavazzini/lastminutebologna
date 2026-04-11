/**
 * @fileoverview Coda feedback_pendenti su Firebase (dopo scansione QR).
 */

/**
 * @param {string} idPrenotazione
 * @param {string} chatId
 * @param {string} localeLabel
 */
function scriviFeedbackPendenteSuFirebase_(idPrenotazione, chatId, localeLabel) {
  const adesso = new Date();
  scriviSuFirebase(`feedback_pendenti/${idPrenotazione}`, {
    chat_id: chatId,
    locale: localeLabel,
    timestamp_scansione: adesso.getTime(),
    inviato: false,
  });
}
