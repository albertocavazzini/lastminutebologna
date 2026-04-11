/**
 * @fileoverview Offerte attive su Firebase (+ conversioni e fallback foglio legacy).
 */

const PATH_OFFERTE_ATTIVE_ = 'offerte_attive';

/**
 * @param {*} cell
 * @return {boolean}
 */
function isStatoOffertaInviatoSuFoglio_(cell) {
  return String(cell || '').toUpperCase().trim() === 'INVIATO';
}

/**
 * @param {!Object} dati payload web app
 * @param {!Object} infoLocale da recuperaInfoLocale
 * @param {string} idOfferta
 * @param {string} prezzoF
 * @param {string} oraInizio
 * @param {string} oraScadenza
 * @param {string} statoInvio
 * @return {!Object}
 */
function costruisciOffertaFb_(
    dati, infoLocale, idOfferta, prezzoF, oraInizio, oraScadenza, statoInvio) {
  const numPezzi = parseInt(dati.numPezzi, 10) || 1;
  return {
    id_offerta: idOfferta,
    nome_locale: dati.locale,
    indirizzo: infoLocale.indirizzo || '',
    descrizione: dati.desc || '',
    prezzo_finale: prezzoF,
    prezzo_iniziale: dati.prezzoO ? String(parseFloat(dati.prezzoO).toFixed(2)) : '',
    posti_totali: numPezzi,
    posti_rimasti: numPezzi,
    scadenza_offerta: oraScadenza,
    inizio_offerta: oraInizio,
    stato_invio: statoInvio,
    url_maps: infoLocale.urlMaps || '',
    latitudine: Number(infoLocale.lat) || 0,
    longitudine: Number(infoLocale.lng) || 0,
    ghash: infoLocale.ghash || '',
  };
}

/**
 * @param {!Object} o
 * @param {!Object} colO COLUMNS_OFFERTE
 * @return {!Array<*>}
 */
function offertaFbToRowArray_(o, colO) {
  const r = new Array(15).fill('');
  r[colO.ID_OFFERTA] = o.id_offerta || '';
  r[colO.NOME_LOCALE] = o.nome_locale || '';
  r[colO.INDIRIZZO] = o.indirizzo || '';
  r[colO.DESCRIZIONE] = o.descrizione || '';
  r[colO.PREZZO_FINALE] = o.prezzo_finale != null ? String(o.prezzo_finale) : '';
  r[colO.PREZZO_INIZIALE] = o.prezzo_iniziale != null ? String(o.prezzo_iniziale) : '';
  r[colO.POSTI_TOTALI] = Number(o.posti_totali) || 0;
  r[colO.POSTI_RIMASTI] = Number(o.posti_rimasti) || 0;
  r[colO.SCADENZA_OFFERTA] = o.scadenza_offerta || '';
  r[colO.INIZIO_OFFERTA] = o.inizio_offerta || '';
  r[colO.STATO_INVIO] = o.stato_invio || '';
  r[colO.URL_MAPS] = o.url_maps || '';
  r[colO.LATITUDINE] = Number(o.latitudine) || 0;
  r[colO.LONGITUDINE] = Number(o.longitudine) || 0;
  r[colO.GHASH] = o.ghash || '';
  return r;
}

/**
 * @param {!Object} o offerta Firebase
 * @return {!Object}
 */
function messaggioPrenotazioneDaOffertaFb_(o) {
  return {
    locale: o.nome_locale,
    descrizione: o.descrizione,
    prezzo: o.prezzo_finale,
    scadenza: o.scadenza_offerta,
    urlMaps: o.url_maps || '',
    postiRimasti: Number(o.posti_rimasti) || 0,
  };
}

/**
 * @param {string} idOfferta
 * @return {?Object}
 */
function leggiOffertaAttivaFirebase_(idOfferta) {
  const o = leggiDaFirebase(PATH_OFFERTE_ATTIVE_ + '/' + idOfferta);
  return !o || typeof o !== 'object' ? null : o;
}

/**
 * @param {!Array<*>} row displayValues
 * @param {!Object} colO
 * @return {!Object}
 */
function offertaFoglioRowToFb_(row, colO) {
  return {
    id_offerta: row[colO.ID_OFFERTA],
    nome_locale: row[colO.NOME_LOCALE],
    indirizzo: row[colO.INDIRIZZO] || '',
    descrizione: row[colO.DESCRIZIONE] || '',
    prezzo_finale: row[colO.PREZZO_FINALE] != null ? String(row[colO.PREZZO_FINALE]) : '',
    prezzo_iniziale: row[colO.PREZZO_INIZIALE] != null ? String(row[colO.PREZZO_INIZIALE]) : '',
    posti_totali: parseInt(row[colO.POSTI_TOTALI], 10) || 0,
    posti_rimasti: parseInt(row[colO.POSTI_RIMASTI], 10) || 0,
    scadenza_offerta: row[colO.SCADENZA_OFFERTA] || '',
    inizio_offerta: row[colO.INIZIO_OFFERTA] || '',
    stato_invio: row[colO.STATO_INVIO] || '',
    url_maps: row[colO.URL_MAPS] || '',
    latitudine: parseFloat(row[colO.LATITUDINE]) || 0,
    longitudine: parseFloat(row[colO.LONGITUDINE]) || 0,
    ghash: row[colO.GHASH] || '',
  };
}

/**
 * @param {string} idOfferta
 * @param {!Object} o
 */
function scriviOffertaAttivaFirebase_(idOfferta, o) {
  scriviSuFirebase(PATH_OFFERTE_ATTIVE_ + '/' + idOfferta, o);
}

/**
 * @return {!Object<string, !Object>}
 */
function leggiMappaOfferteAttiveFirebase_() {
  const raw = leggiDaFirebase(PATH_OFFERTE_ATTIVE_);
  const out = Object.create(null);
  if (!raw || typeof raw !== 'object') {
    return out;
  }
  for (const k of Object.keys(raw)) {
    if (k === 'placeholder') {
      continue;
    }
    const v = raw[k];
    if (v && typeof v === 'object') {
      out[k] = v;
    }
  }
  return out;
}

/**
 * @param {string} idOfferta
 * @param {!Object} C
 * @return {?Object}
 */
function leggiOffertaAttivaConFallbackFoglio_(idOfferta, C) {
  let o = leggiOffertaAttivaFirebase_(idOfferta);
  if (o && o.id_offerta) {
    return o;
  }
  try {
    const sh = spreadsheetPerMirror_(C).getSheetByName(C.SHEET_OFFERTE);
    if (!sh) {
      return null;
    }
    const colO = C.COLUMNS_OFFERTE;
    const trovato = trovaRigaOffertaPerId_(sh.getDataRange().getDisplayValues(), idOfferta, colO);
    if (!trovato) {
      return null;
    }
    const row = trovato.row;
    if (isStatoOffertaInviatoSuFoglio_(row[colO.STATO_INVIO])) {
      return null;
    }
    o = offertaFoglioRowToFb_(row, colO);
    scriviOffertaAttivaFirebase_(idOfferta, o);
    return o;
  } catch (e) {
    console.warn('leggiOffertaAttivaConFallbackFoglio_: ' + e.message);
    return null;
  }
}

/**
 * @param {!Object=} COpt
 */
function migraOfferteAttiveDaFoglioAFirebase(COpt) {
  const C = COpt || getConfigOttimizzato();
  const sh = spreadsheetPerMirror_(C).getSheetByName(C.SHEET_OFFERTE);
  if (!sh || sh.getLastRow() < 2) {
    console.log('migraOfferteAttiveDaFoglioAFirebase: nessuna riga da migrare.');
    return;
  }
  const colO = C.COLUMNS_OFFERTE;
  const dati = sh.getDataRange().getDisplayValues();
  let n = 0;
  for (let i = 1; i < dati.length; i++) {
    const row = dati[i];
    const id = row[colO.ID_OFFERTA];
    if (!id || isStatoOffertaInviatoSuFoglio_(row[colO.STATO_INVIO])) {
      continue;
    }
    if (leggiOffertaAttivaFirebase_(id)) {
      continue;
    }
    scriviOffertaAttivaFirebase_(id, offertaFoglioRowToFb_(row, colO));
    n++;
  }
  console.log(`✅ migraOfferteAttiveDaFoglioAFirebase: importate ${n} offerte.`);
}
