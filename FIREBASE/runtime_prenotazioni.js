/**
 * @fileoverview Prenotazioni su Firebase, validazione QR e flag feedback (+ fallback foglio).
 */

const PATH_PRENOTAZIONI_ = 'prenotazioni';

/**
 * @param {string} idPre
 * @return {?Object}
 */
function leggiPrenotazioneRuntimeFirebase_(idPre) {
  const o = leggiDaFirebase(PATH_PRENOTAZIONI_ + '/' + idPre);
  return !o || typeof o !== 'object' ? null : o;
}

/**
 * @param {string} idPre
 * @param {!Object} p
 */
function scriviPrenotazioneRuntimeFirebase_(idPre, p) {
  scriviSuFirebase(PATH_PRENOTAZIONI_ + '/' + idPre, p);
}

/**
 * @param {string} idPre
 * @param {!Object} C
 * @return {?Object}
 */
function leggiPrenotazioneConFallbackFoglio_(idPre, C) {
  let p = leggiPrenotazioneRuntimeFirebase_(idPre);
  if (p && p.stato_id) {
    return p;
  }
  try {
    const r = trovaRigaPrenotazionePerStatoIdSheet_(C, idPre);
    if (r < 1) {
      return null;
    }
    const sh = spreadsheetPerMirror_(C).getSheetByName(C.SHEET_PRENOTAZIONI);
    if (!sh) {
      return null;
    }
    const colP = C.COLUMNS_PRENOTAZIONI;
    const vals = sh.getRange(r, 1, r, 10).getValues()[0];
    const ts = vals[colP.TIMESTAMP];
    p = {
      timestamp: ts instanceof Date ? ts.toISOString() : new Date().toISOString(),
      id_offerta: String(vals[colP.ID_OFFERTA] || ''),
      nome_utente: String(vals[colP.NOME_UTENTE] || ''),
      username_telegram: String(vals[colP.USERNAME_TELEGRAM] || ''),
      stato_id: idPre,
      show: vals[colP.SHOW] === true || String(vals[colP.SHOW]).toUpperCase() === 'TRUE',
      locale: String(vals[colP.LOCALE] || ''),
      ora_scansione: '',
      feedback_inviato: String(vals[colP.FEEDBACK_INVIATO] || ''),
      chat_id: String(vals[colP.CHAT_ID] || ''),
    };
    const osc = vals[colP.ORA_SCANSIONE];
    p.ora_scansione =
        osc instanceof Date ? osc.toISOString() : (osc ? String(osc) : '');
    scriviPrenotazioneRuntimeFirebase_(idPre, p);
    return p;
  } catch (e) {
    console.warn('leggiPrenotazioneConFallbackFoglio_: ' + e.message);
    return null;
  }
}

/**
 * @param {!Object} C
 * @param {string} idPre
 * @param {string} chatId
 * @param {string} localeLabel
 */
function aggiornaPrenotazioneDopoValidazioneQr_(C, idPre, chatId, localeLabel) {
  const p = leggiPrenotazioneConFallbackFoglio_(idPre, C);
  if (!p) {
    return;
  }
  const adesso = new Date();
  p.show = true;
  p.ora_scansione = adesso.toISOString();
  scriviPrenotazioneRuntimeFirebase_(idPre, p);
  mirrorPrenotazioneValidazioneSheet_(C, idPre, true, adesso);
  if (chatId) {
    scriviFeedbackPendenteSuFirebase_(idPre, chatId, localeLabel);
  }
}

/**
 * @param {!Object} C
 * @param {string} idPre
 */
function segnaFeedbackInviatoRuntimeEFoglio_(C, idPre) {
  let p = leggiPrenotazioneRuntimeFirebase_(idPre);
  if (!p) {
    p = leggiPrenotazioneConFallbackFoglio_(idPre, C);
  }
  if (p) {
    p.feedback_inviato = 'INVIATO';
    scriviPrenotazioneRuntimeFirebase_(idPre, p);
  }
  mirrorPrenotazioneFeedbackInviatoSheet_(C, idPre);
}

/**
 * @param {!Object=} COpt
 */
function allineaFoglioOfferteDaFirebase(COpt) {
  const C = COpt || getConfigOttimizzato();
  sincronizzaFoglioOfferteDaFirebase_(C);
  console.log('✅ Foglio Offerte allineato a Firebase offerte_attive.');
}
