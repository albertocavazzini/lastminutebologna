/**
 * @fileoverview Mappa Anagrafica: cache Script, Firebase `locali`, fallback foglio.
 * Costanti top-level: valutate al caricamento del progetto, non a ogni run.
 */

const ANAGRAFICA_CACHE_KEY_ = 'ANA_LOC_MAP';
const ANAGRAFICA_FDB_CACHE_KEY_ = 'ANA_FDB_MAP';
const ANAGRAFICA_FDB_EMPTY_KEY_ = 'ANA_FDB_EMPTY';
const ANAGRAFICA_FDB_EMPTY_TTL_SEC_ = 120;
const ANAGRAFICA_CACHE_TTL_SEC_ = 600;

/**
 * @param {string} nome
 * @return {string}
 */
function normalizzaNomeLocaleAnagrafica_(nome) {
  return nome.toString().replace(/_/g, ' ').trim().toLowerCase();
}

/**
 * @return {!Object}
 */
function infoLocaleVuota_() {
  return {
    indirizzo: 'Non trovato',
    urlMaps: '',
    lat: 0,
    lng: 0,
    ghash: '',
  };
}

/**
 * @param {*} raw Risposta GET su `locali.json`
 * @return {!Object<string, !{indirizzo: string, urlMaps: string, lat: number, lng: number, ghash: string}>}
 */
function buildMappaAnagraficaDaFirebase_(raw) {
  const map = Object.create(null);
  if (!raw || typeof raw !== 'object') {
    return map;
  }
  for (const token of Object.keys(raw)) {
    const L = raw[token];
    if (!L || typeof L !== 'object' || L.nome == null || L.nome === '') {
      continue;
    }
    const key = normalizzaNomeLocaleAnagrafica_(L.nome);
    if (!key) {
      continue;
    }
    const indRaw = L.indirizzo != null ? String(L.indirizzo).trim() : '';
    const urlDaFb =
        L.urlMaps != null && String(L.urlMaps).trim() !== '' ?
        String(L.urlMaps).trim() :
        (L.url_maps != null ? String(L.url_maps).trim() : '');
    map[key] = {
      indirizzo: indRaw || 'Indirizzo non presente',
      urlMaps: urlDaFb,
      lat: parseNumeroDaCellaFoglio_(L.lat != null ? L.lat : L.latitudine),
      lng: parseNumeroDaCellaFoglio_(L.lng != null ? L.lng : L.longitudine),
      ghash: L.ghash != null ? String(L.ghash) : '',
    };
  }
  return map;
}

/**
 * @param {string} nomeCercato normalizzato
 * @return {?{indirizzo: string, urlMaps: string, lat: number, lng: number, ghash: string}}
 */
function recuperaInfoLocaleDaFirebase_(nomeCercato) {
  const cache = CacheService.getScriptCache();

  if (cache.get(ANAGRAFICA_FDB_EMPTY_KEY_)) {
    return null;
  }

  const cached = cache.get(ANAGRAFICA_FDB_CACHE_KEY_);
  let map = null;
  if (cached) {
    try {
      map = /** @type {!Object<string, *>} */ (JSON.parse(cached));
    } catch (err) {
      map = null;
    }
  }

  if (map && Object.keys(map).length > 0) {
    if (Object.prototype.hasOwnProperty.call(map, nomeCercato)) {
      return map[nomeCercato];
    }
    return null;
  }

  const raw = leggiDaFirebase('locali');
  map = buildMappaAnagraficaDaFirebase_(raw);
  if (Object.keys(map).length > 0) {
    cache.put(ANAGRAFICA_FDB_CACHE_KEY_, JSON.stringify(map), ANAGRAFICA_CACHE_TTL_SEC_);
    if (Object.prototype.hasOwnProperty.call(map, nomeCercato)) {
      return map[nomeCercato];
    }
    return null;
  }

  cache.put(ANAGRAFICA_FDB_EMPTY_KEY_, '1', ANAGRAFICA_FDB_EMPTY_TTL_SEC_);
  return null;
}

/**
 * @param {!GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {!Object} colA COLUMNS_ANAGRAFICA
 * @return {!Object<string, !{indirizzo: string, urlMaps: string, lat: number, lng: number, ghash: string}>}
 */
function buildMappaAnagrafica_(sheet, colA) {
  const dati = sheet.getDataRange().getValues();
  const map = Object.create(null);
  for (let i = 1; i < dati.length; i++) {
    const nomeInFoglio = normalizzaNomeLocaleAnagrafica_(dati[i][colA.NOME_LOCALE]);
    if (!nomeInFoglio) {
      continue;
    }
    const lat = parseNumeroDaCellaFoglio_(dati[i][colA.LATITUDINE]);
    const lng = parseNumeroDaCellaFoglio_(dati[i][colA.LONGITUDINE]);
    map[nomeInFoglio] = {
      indirizzo: dati[i][colA.INDIRIZZO] || 'Indirizzo non presente',
      urlMaps: dati[i][colA.URL_MAPS] || '',
      lat: lat || 0,
      lng: lng || 0,
      ghash: dati[i][colA.GHASH] || '',
    };
  }
  return map;
}

/**
 * @param {string} nomeCercato normalizzato
 * @return {!Object}
 */
function recuperaInfoLocaleDaFoglio_(nomeCercato) {
  const C = getConfigOttimizzato();
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(C.SHEET_ANAGRAFICA);

    if (!sheet) {
      console.error('❌ Foglio Anagrafica non trovato!');
      return infoLocaleVuota_();
    }

    const cache = CacheService.getScriptCache();
    const cached = cache.get(ANAGRAFICA_CACHE_KEY_);
    let map = null;
    if (cached) {
      try {
        map = /** @type {!Object<string, *>} */ (JSON.parse(cached));
      } catch (err) {
        map = null;
      }
    }

    if (map && Object.prototype.hasOwnProperty.call(map, nomeCercato)) {
      return map[nomeCercato];
    }

    const colA = C.COLUMNS_ANAGRAFICA;
    map = buildMappaAnagrafica_(sheet, colA);
    cache.put(ANAGRAFICA_CACHE_KEY_, JSON.stringify(map), ANAGRAFICA_CACHE_TTL_SEC_);

    if (Object.prototype.hasOwnProperty.call(map, nomeCercato)) {
      return map[nomeCercato];
    }

    console.warn(`⚠️ Locale non trovato in Anagrafica: "${nomeCercato}"`);
  } catch (e) {
    console.error('❌ Errore in recuperaInfoLocaleDaFoglio_: ', e);
  }
  return infoLocaleVuota_();
}
