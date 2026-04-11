/**
 * @fileoverview Coda feedback su Firebase e aggiornamento foglio Prenotazioni.
 */

/**
 * @param {!Object} C
 */
function gestisciInvioFeedback(C) {
  const feedbackPendenti = leggiDaFirebase('feedback_pendenti') || {};
  const oraAttualeMs = new Date().getTime();
  const TRENTA_MINUTI_MS = 30 * 60 * 1000;

  const chiavi = Object.keys(feedbackPendenti);
  if (chiavi.length === 0) {
    return;
  }

  chiavi.forEach((idPre) => {
    if (idPre === 'placeholder') {
      return;
    }
    const dati = feedbackPendenti[idPre];
    if (!dati || typeof dati !== 'object' || !dati.chat_id) {
      return;
    }

    if (!dati.inviato &&
        (oraAttualeMs - dati.timestamp_scansione >= TRENTA_MINUTI_MS)) {
      const urlFeedback = urlWebAppFeedback_(C, idPre, dati.locale);
      const testoFeedback =
          `Speriamo che la box di *${dati.locale}* ti sia piaciuta! 🥯\n\n` +
          'Ti va di lasciarci una valutazione veloce?';
      const tastiera = {
        inline_keyboard: [[{text: '⭐ Valuta l\'esperienza', url: urlFeedback}]],
      };

      if (inviaMessaggioConBottoni(dati.chat_id, testoFeedback, tastiera)) {
        try {
          segnaFeedbackInviatoSuSheets(idPre, C);
        } catch (e) {
          console.warn(`⚠️ Errore GSH per ${idPre}: ${e.message}`);
        }

        eliminaDaFirebase(`feedback_pendenti/${idPre}`);
        console.log(`✅ Feedback inviato per ${idPre} (ChatID: ${dati.chat_id})`);
      }
    }
  });
}

/**
 * @param {string} idPre
 * @param {!Object} C
 */
function segnaFeedbackInviatoSuSheets(idPre, C) {
  segnaFeedbackInviatoRuntimeEFoglio_(C, idPre);
}
