/**
 * @fileoverview Salvataggio feedback: Firebase feedback_log + mirror foglio Feedback.
 */

/**
 * @param {!Object} dati
 * @return {boolean}
 */
function salvaFeedback(dati) {
  try {
    const C = getConfigOttimizzato();
    const idLog = 'FEED-' + Date.now();
    const payload = {
      timestamp: new Date().toISOString(),
      id_prenotazione: dati.idPre,
      locale: dati.loc,
      valutazione: dati.valutazione,
      commento: dati.commento || '',
    };
    scriviSuFirebase('feedback_log/' + idLog, payload);

    const ss = spreadsheetPerMirror_(C);
    const sheet = ss.getSheetByName(C.SHEET_FEEDBACK);

    if (!sheet) {
      console.warn('⚠️ Mirror Feedback: foglio non trovato.');
      return true;
    }

    const colF = C.COLUMNS_FEEDBACK;
    const ultimaRiga = sheet.getLastRow() + 1;

    sheet.getRange(ultimaRiga, colF.TIMESTAMP + 1).setValue(new Date());
    sheet.getRange(ultimaRiga, colF.ID_PRENOTAZIONE + 1).setValue(dati.idPre);
    sheet.getRange(ultimaRiga, colF.LOCALE + 1).setValue(dati.loc);
    sheet.getRange(ultimaRiga, colF.VALUTAZIONE + 1).setValue(dati.valutazione);
    sheet.getRange(ultimaRiga, colF.COMMENTO + 1).setValue(dati.commento);

    console.log(
        `✅ Feedback registrato per ID: ${dati.idPre} | Voto: ${dati.valutazione}`);
    return true;
  } catch (e) {
    console.error('❌ Errore in salvaFeedback: ', e);
    throw new Error('Impossibile salvare il feedback. Riprova più tardi.');
  }
}
