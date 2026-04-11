/**
 * @fileoverview Mirror su Google Sheets (analisi): apertura spreadsheet e aggiornamenti celle.
 * I const qui sono valutati una volta al caricamento del progetto, non a ogni run.
 */

/**
 * @param {!Object} C
 * @return {!GoogleAppsScript.Spreadsheet.Spreadsheet}
 */
function spreadsheetPerMirror_(C) {
  if (C.SS_ID) {
    try {
      return SpreadsheetApp.openById(String(C.SS_ID).trim());
    } catch (e) {
      console.warn('spreadsheetPerMirror_: openById fallito, uso active. ' + e.message);
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * @param {!Object} C
 * @param {string} idOfferta
 * @return {number} 1-based o -1
 */
function trovaRigaOffertaPerIdSheet_(C, idOfferta) {
  try {
    const sh = spreadsheetPerMirror_(C).getSheetByName(C.SHEET_OFFERTE);
    if (!sh) {
      return -1;
    }
    const colO = C.COLUMNS_OFFERTE;
    const dati = sh.getDataRange().getDisplayValues();
    for (let i = 1; i < dati.length; i++) {
      if (dati[i][colO.ID_OFFERTA] === idOfferta) {
        return i + 1;
      }
    }
  } catch (e) {
    console.warn('trovaRigaOffertaPerIdSheet_: ' + e.message);
  }
  return -1;
}

/**
 * @param {!Object} C
 * @param {string} idOfferta
 * @param {number} col0 indice colonna 0-based (come COLUMNS_OFFERTE)
 * @param {*} value
 */
function mirrorPatchCellaOffertaFoglio_(C, idOfferta, col0, value) {
  try {
    const r = trovaRigaOffertaPerIdSheet_(C, idOfferta);
    if (r < 1) {
      return;
    }
    const sh = spreadsheetPerMirror_(C).getSheetByName(C.SHEET_OFFERTE);
    if (sh) {
      sh.getRange(r, col0 + 1).setValue(value);
    }
  } catch (e) {
    console.warn('⚠️ Mirror Offerte (cella): ' + e.message);
  }
}

/**
 * @param {!Object} C
 * @param {!Array<*>} riga
 */
function mirrorAppendOffertaRow_(C, riga) {
  try {
    const sh = spreadsheetPerMirror_(C).getSheetByName(C.SHEET_OFFERTE);
    if (sh) {
      sh.appendRow(riga);
    }
  } catch (e) {
    console.warn('⚠️ Mirror Offerte (append): ' + e.message);
  }
}

/**
 * @param {!Object} C
 * @param {string} idOfferta
 * @param {string} stato
 */
function mirrorUpdateOffertaStatoInvioSheet_(C, idOfferta, stato) {
  mirrorPatchCellaOffertaFoglio_(C, idOfferta, C.COLUMNS_OFFERTE.STATO_INVIO, stato);
}

/**
 * @param {!Object} C
 * @param {string} idOfferta
 * @param {number} postiRimasti
 */
function mirrorUpdateOffertaPostiRimastiSheet_(C, idOfferta, postiRimasti) {
  mirrorPatchCellaOffertaFoglio_(C, idOfferta, C.COLUMNS_OFFERTE.POSTI_RIMASTI, postiRimasti);
}

/**
 * Riscrive il foglio Offerte (dalla riga 2) da Firebase attive.
 * @param {!Object} C
 */
function sincronizzaFoglioOfferteDaFirebase_(C) {
  try {
    const mappa = leggiMappaOfferteAttiveFirebase_();
    const sh = spreadsheetPerMirror_(C).getSheetByName(C.SHEET_OFFERTE);
    if (!sh) {
      return;
    }
    const colO = C.COLUMNS_OFFERTE;
    const last = sh.getLastRow();
    if (last > 1) {
      sh.getRange(2, 1, last, 15).clearContent();
    }
    const ids = Object.keys(mappa);
    if (ids.length === 0) {
      return;
    }
    const rows = ids.map((id) => offertaFbToRowArray_(mappa[id], colO));
    sh.getRange(2, 1, rows.length + 1, 15).setValues(rows);
  } catch (e) {
    console.warn('⚠️ sincronizzaFoglioOfferteDaFirebase_: ' + e.message);
  }
}

/**
 * @param {!Object} C
 * @param {string} idPre
 * @return {number} 1-based o -1
 */
function trovaRigaPrenotazionePerStatoIdSheet_(C, idPre) {
  try {
    const sh = spreadsheetPerMirror_(C).getSheetByName(C.SHEET_PRENOTAZIONI);
    if (!sh) {
      return -1;
    }
    const colP = C.COLUMNS_PRENOTAZIONI;
    const dati = sh.getDataRange().getDisplayValues();
    const idNorm = String(idPre).trim();
    for (let i = 1; i < dati.length; i++) {
      if (dati[i][colP.STATO_ID].toString().trim() === idNorm) {
        return i + 1;
      }
    }
  } catch (e) {
    console.warn('trovaRigaPrenotazionePerStatoIdSheet_: ' + e.message);
  }
  return -1;
}

/**
 * @param {!Object} C
 * @param {!Object} p record Firebase prenotazione
 */
function mirrorAppendPrenotazioneDaFb_(C, p) {
  try {
    const sh = spreadsheetPerMirror_(C).getSheetByName(C.SHEET_PRENOTAZIONI);
    if (!sh) {
      return;
    }
    const colP = C.COLUMNS_PRENOTAZIONI;
    const r = new Array(10).fill('');
    r[colP.TIMESTAMP] = p.timestamp ? new Date(p.timestamp) : new Date();
    r[colP.ID_OFFERTA] = p.id_offerta || '';
    r[colP.NOME_UTENTE] = p.nome_utente || '';
    r[colP.USERNAME_TELEGRAM] = p.username_telegram || '';
    r[colP.STATO_ID] = p.stato_id || '';
    r[colP.SHOW] = p.show === true || p.show === 'TRUE';
    r[colP.LOCALE] = p.locale || '';
    r[colP.ORA_SCANSIONE] = p.ora_scansione ? new Date(p.ora_scansione) : '';
    r[colP.FEEDBACK_INVIATO] = p.feedback_inviato || '';
    r[colP.CHAT_ID] = p.chat_id != null ? String(p.chat_id) : '';
    sh.appendRow(r);
  } catch (e) {
    console.warn('⚠️ Mirror Prenotazioni (append): ' + e.message);
  }
}

/**
 * @param {!Object} C
 * @param {string} idPre
 * @param {boolean} show
 * @param {!Date} quando
 */
function mirrorPrenotazioneValidazioneSheet_(C, idPre, show, quando) {
  try {
    const r = trovaRigaPrenotazionePerStatoIdSheet_(C, idPre);
    if (r < 1) {
      return;
    }
    const sh = spreadsheetPerMirror_(C).getSheetByName(C.SHEET_PRENOTAZIONI);
    const colP = C.COLUMNS_PRENOTAZIONI;
    sh.getRange(r, colP.SHOW + 1).setValue(show);
    sh.getRange(r, colP.ORA_SCANSIONE + 1).setValue(quando);
  } catch (e) {
    console.warn('⚠️ Mirror Prenotazioni (validazione): ' + e.message);
  }
}

/**
 * @param {!Object} C
 * @param {string} idPre
 */
function mirrorPrenotazioneFeedbackInviatoSheet_(C, idPre) {
  try {
    const r = trovaRigaPrenotazionePerStatoIdSheet_(C, idPre);
    if (r < 1) {
      return;
    }
    const sh = spreadsheetPerMirror_(C).getSheetByName(C.SHEET_PRENOTAZIONI);
    sh.getRange(r, C.COLUMNS_PRENOTAZIONI.FEEDBACK_INVIATO + 1).setValue('INVIATO');
  } catch (e) {
    console.warn('⚠️ Mirror Prenotazioni (feedback flag): ' + e.message);
  }
}
