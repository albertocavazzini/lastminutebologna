/**
 * @fileoverview Sincronizzazione anagrafica locali verso Firebase.
 */

/**
 * Valore URL colonna Maps: valore cella o URL estratto da formula HYPERLINK.
 * @param {!GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {number} row1Based
 * @param {number} col0ZeroBased
 * @return {string}
 */
function valoreUrlMapsAnagraficaDaCella_(sheet, row1Based, col0ZeroBased) {
  const cell = sheet.getRange(row1Based, col0ZeroBased + 1);
  const raw = cell.getValue();
  if (raw != null && String(raw).trim() !== '') {
    const s = String(raw).trim();
    if (/^https?:\/\//i.test(s)) {
      return s;
    }
  }
  const f = String(cell.getFormula() || '');
  if (f.indexOf('HYPERLINK') !== -1) {
    const m1 = f.match(/HYPERLINK\s*\(\s*"([^"]+)"/i);
    if (m1) {
      return m1[1].trim();
    }
    const m2 = f.match(/HYPERLINK\s*\(\s*([^;,)\s]+)\s*;/i);
    if (m2) {
      return m2[1].replace(/^"+|"+$/g, '').trim();
    }
  }
  return raw != null ? String(raw).trim() : '';
}

/**
 * Oggetto locale per Firebase: tutti i campi anagrafica utili + link pannello e ghash calcolato.
 * @param {!Array<*>} row
 * @param {!Object} colA
 * @param {string} nomeLocale
 * @param {number} lat
 * @param {number} lng
 * @param {string} ghash
 * @param {string} linkPannello
 * @param {!GoogleAppsScript.Spreadsheet.Sheet} sheetAnagrafica
 * @param {number} row1Based
 * @return {!Object}
 */
function oggettoLocaleFirebaseDaRigaAnagrafica_(
    row, colA, nomeLocale, lat, lng, ghash, linkPannello, sheetAnagrafica, row1Based) {
  const urlMaps = valoreUrlMapsAnagraficaDaCella_(sheetAnagrafica, row1Based, colA.URL_MAPS);
  const indirizzo = row[colA.INDIRIZZO] != null ? String(row[colA.INDIRIZZO]).trim() : '';
  const lngN = parseNumeroDaCellaFoglio_(row[colA.LONGITUDINE]);
  const latN = parseNumeroDaCellaFoglio_(row[colA.LATITUDINE]);

  const out = {
    nome: nomeLocale,
    indirizzo: indirizzo,
    urlMaps: urlMaps,
    lat: lat,
    lng: lng,
    latitudine: latN,
    longitudine: lngN,
    ghash: ghash,
    link_locale: linkPannello,
    last_update: new Date().toISOString(),
  };

  return out;
}

/**
 * Sincronizza anagrafica locali su Firebase; compila Geohash, token e link nel foglio.
 * URL base web app dalla cella B9 del foglio CONFIG FD.
 * Campi Firebase per mirror Offerte: url Maps, indirizzo, coordinate, ecc.
 */
function sincronizzaLocaliAFirebase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const C = getConfigOttimizzato();
  const sheetAnagrafica = ss.getSheetByName(C.SHEET_ANAGRAFICA);

  if (!sheetAnagrafica) {
    SpreadsheetApp.getUi().alert('Errore: Foglio Anagrafica non trovato!');
    return;
  }

  const ID_FOGLIO_CONFIG = '1jUAlJXDnk_DWgw4RZyjNMZlnAQD5qFFLQAvJuLzk2hE';
  let webAppUrl = '';

  try {
    const configSS = SpreadsheetApp.openById(ID_FOGLIO_CONFIG);
    const configSheet = configSS.getSheets()[0];
    webAppUrl = configSheet.getRange('B9').getValue().toString().trim();
  } catch (err) {
    SpreadsheetApp.getUi().alert('❌ Errore critico: Impossibile leggere il foglio CONFIG FD.');
    return;
  }

  if (!webAppUrl || !webAppUrl.includes('macros/s/')) {
    SpreadsheetApp.getUi().alert('⚠️ URL in B9 non valido.');
    return;
  }

  const webAppBase = webAppUrl.split('/exec')[0] + '/exec';

  const range = sheetAnagrafica.getDataRange();
  const data = range.getValues();
  const colA = C.COLUMNS_ANAGRAFICA;

  const localiUnificati = {};
  let contatoreToken = 0;
  let contatoreLink = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const nomeLocale = row[colA.NOME_LOCALE];

    const lat = parseNumeroDaCellaFoglio_(row[colA.LATITUDINE]);
    const lng = parseNumeroDaCellaFoglio_(row[colA.LONGITUDINE]);

    if (nomeLocale && lat !== 0 && lng !== 0) {
      let tokenSicurezza =
          row[colA.TOKEN_ACCESSO] ? row[colA.TOKEN_ACCESSO].toString().trim() : '';

      if (!tokenSicurezza) {
        tokenSicurezza = Utilities.getUuid();
        sheetAnagrafica.getRange(i + 1, colA.TOKEN_ACCESSO + 1).setValue(tokenSicurezza);
        contatoreToken++;
      }

      const linkPannello = costruisciUrlWebAppProprietario(webAppBase, tokenSicurezza);
      if (row[colA.LINK_LOCALE] !== linkPannello) {
        sheetAnagrafica.getRange(i + 1, colA.LINK_LOCALE + 1).setValue(linkPannello);
        contatoreLink++;
      }

      const ghash = generaGeohash(lat, lng, 6);
      if (row[colA.GHASH] !== ghash) {
        sheetAnagrafica.getRange(i + 1, colA.GHASH + 1).setValue(ghash);
      }

      localiUnificati[tokenSicurezza] = oggettoLocaleFirebaseDaRigaAnagrafica_(
          row, colA, nomeLocale, lat, lng, ghash, linkPannello, sheetAnagrafica, i + 1);
    }
  }

  try {
    if (Object.keys(localiUnificati).length > 0) {
      scriviSuFirebase('locali', localiUnificati);
      try {
        flushAnagraficaCache();
      } catch (ignore) {
      }

      const messaggio =
          `🚀 SINCRONIZZAZIONE OK!\n\n` +
          `• Link aggiornati (Colonna H): ${contatoreLink}\n` +
          `• URL Base: ${webAppBase}\n` +
          `• Locali totali: ${Object.keys(localiUnificati).length}\n` +
          `• Cache anagrafica svuotata (Firebase aggiornato).`;

      SpreadsheetApp.getUi().alert(messaggio);
    }
  } catch (e) {
    SpreadsheetApp.getUi().alert('Errore FDB: ' + e.message);
  }
}
