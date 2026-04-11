/**
 * @fileoverview Ricerche su righe foglio (Offerte, Prenotazioni).
 */

/**
 * @param {*} showCell
 * @return {boolean}
 */
function isCellaShowGiaValidata_(showCell) {
  const statoShow = showCell == null ? '' : showCell.toString().toUpperCase().trim();
  return statoShow === 'TRUE' || statoShow === 'VERO' || statoShow === 'CHECKED';
}

/**
 * @param {!Array<!Array<*>>} datiVisibili
 * @param {string} offertaId
 * @param {!Object} colO COLUMNS_OFFERTE
 * @return {?{riga1Based: number, row: !Array<*>}}
 */
function trovaRigaOffertaPerId_(datiVisibili, offertaId, colO) {
  for (let i = 1; i < datiVisibili.length; i++) {
    if (datiVisibili[i][colO.ID_OFFERTA] === offertaId) {
      return {riga1Based: i + 1, row: datiVisibili[i]};
    }
  }
  return null;
}

/**
 * @param {!Array<*>} row
 * @param {!Object} colO
 * @return {!Object}
 */
function datiMessaggioPrenotazioneDaRigaOfferta_(row, colO) {
  return {
    locale: row[colO.NOME_LOCALE],
    descrizione: row[colO.DESCRIZIONE],
    prezzo: row[colO.PREZZO_FINALE],
    scadenza: row[colO.SCADENZA_OFFERTA],
    urlMaps: row[colO.URL_MAPS],
    postiRimasti: row[colO.POSTI_RIMASTI],
  };
}

/**
 * @param {!Array<!Array<*>>} dati
 * @param {string} idPrenotazione
 * @param {!Object} colP COLUMNS_PRENOTAZIONI
 * @return {?{row1Based: number, nomeCliente: string, chatIdCliente: string, giaValidato: boolean}}
 */
function trovaDatiPrenotazionePerStatoId_(dati, idPrenotazione, colP) {
  const idNorm = String(idPrenotazione).trim();
  for (let i = 1; i < dati.length; i++) {
    if (dati[i][colP.STATO_ID].toString().trim() !== idNorm) {
      continue;
    }
    return {
      row1Based: i + 1,
      nomeCliente: dati[i][colP.NOME_UTENTE] || 'Cliente',
      chatIdCliente: String(dati[i][colP.CHAT_ID] || '').trim(),
      giaValidato: isCellaShowGiaValidata_(dati[i][colP.SHOW]),
    };
  }
  return null;
}

/**
 * @param {!Array<!Array<*>>} dati
 * @param {string} idPre
 * @param {!Object} colP
 * @return {number} 1-based row o -1
 */
function trovaRigaPrenotazionePerStatoId_(dati, idPre, colP) {
  const hit = trovaDatiPrenotazionePerStatoId_(dati, idPre, colP);
  return hit ? hit.row1Based : -1;
}
