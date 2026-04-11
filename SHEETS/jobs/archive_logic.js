/**
 * @fileoverview Archivia offerte INVIATO: Firebase + mirror foglio Archivio + allinea Offerte.
 */

/**
 * Sposta le offerte con stato INVIATO da Firebase nel foglio archivio e le rimuove dalle attive.
 */
function archiviaOfferteInviate() {
  const C = getConfigOttimizzato();
  const ss = SpreadsheetApp.openById(C.SS_ID);

  const mappa = leggiMappaOfferteAttiveFirebase_();
  const col = C.COLUMNS_OFFERTE;

  const toArchive = [];
  for (const id of Object.keys(mappa)) {
    if (mappa[id].stato_invio === 'INVIATO') {
      toArchive.push(mappa[id]);
    }
  }

  if (toArchive.length === 0) {
    console.log('🧹 Nessuna offerta da archiviare.');
    return;
  }

  let sheetDestinazione = ss.getSheetByName(C.SHEET_ARCHIVIO);
  const sheetOfferte = ss.getSheetByName(C.SHEET_OFFERTE);

  if (!sheetDestinazione) {
    sheetDestinazione = ss.insertSheet(C.SHEET_ARCHIVIO);
    if (sheetOfferte && sheetOfferte.getLastRow() >= 1) {
      sheetDestinazione.appendRow(
          sheetOfferte.getRange(1, 1, 1, 15).getValues()[0]);
    }
  }

  for (const o of toArchive) {
    sheetDestinazione.appendRow(offertaFbToRowArray_(o, col));
  }

  for (const o of toArchive) {
    const idDel = o.id_offerta || '';
    if (idDel) {
      eliminaDaFirebase('offerte_attive/' + idDel);
    }
  }

  sincronizzaFoglioOfferteDaFirebase_(C);

  console.log(
      `✅ Archiviate ${toArchive.length} offerte in ${C.SHEET_ARCHIVIO} (Firebase + fogli).`);
}
