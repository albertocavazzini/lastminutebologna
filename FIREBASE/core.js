/**
 * @fileoverview Lettura/scrittura/eliminazione Firebase Realtime Database via REST.
 */

/**
 * @param {!Object} C
 * @param {string} percorso Senza slash iniziale, es. locali/UUID
 * @return {string}
 */
function firebaseJsonUrl_(C, percorso) {
  let base = String(C.FIREBASE_URL || '');
  if (!base.endsWith('/')) {
    base += '/';
  }
  const p = String(percorso || '').replace(/^\/+/, '');
  return `${base}${p}.json?auth=${encodeURIComponent(String(C.FIREBASE_SECRET || ''))}`;
}

/**
 * Query REST Firebase orderBy + equalTo per un campo stringa.
 * Le virgolette richieste da Firebase ("chiave", "valore") vanno codificate: UrlFetchApp
 * rifiuta gli URL con " non escaped (Exception: Invalid argument).
 * @param {string} childKey es. ghash
 * @param {string} value es. srbj44
 * @return {string}
 */
function firebaseRestQueryOrderByEqualToString_(childKey, value) {
  const orderByVal = '"' + childKey + '"';
  const equalToVal = '"' + String(value) + '"';
  return (
      'orderBy=' + encodeURIComponent(orderByVal) + '&equalTo=' + encodeURIComponent(equalToVal));
}

/**
 * @param {string} percorso
 * @param {*} dati
 * @return {*}
 */
function scriviSuFirebase(percorso, dati) {
  const C = getConfigOttimizzato();
  const url = firebaseJsonUrl_(C, percorso);
  const opzioni = {
    method: 'put',
    contentType: 'application/json',
    payload: JSON.stringify(dati),
    muteHttpExceptions: true,
  };

  const risposta = UrlFetchApp.fetch(url, opzioni);
  const code = risposta.getResponseCode();

  if (code === 200) {
    return JSON.parse(risposta.getContentText());
  }
  throw new Error(
      'Errore Firebase Codice ' + code + ': ' + risposta.getContentText());
}

/**
 * POST (push) su RTDB: crea un figlio con chiave generata (lista).
 * @param {string} percorso es. telegram_hook/start_burst/12345
 * @param {*} dati
 * @return {?{name: string}} null se errore
 */
function spingiSuFirebase(percorso, dati) {
  const C = getConfigOttimizzato();
  const url = firebaseJsonUrl_(C, percorso);
  const opzioni = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(dati),
    muteHttpExceptions: true,
  };
  const risposta = UrlFetchApp.fetch(url, opzioni);
  const code = risposta.getResponseCode();
  const raw = risposta.getContentText();
  if (code !== 200) {
    console.error(`❌ spingiSuFirebase (${code}): ${raw}`);
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('❌ spingiSuFirebase parse: ' + e);
    return null;
  }
}

/**
 * @param {string} percorso
 * @param {string=} queryParams
 * @return {?Object|?Array|?string|number|boolean|null}
 */
function leggiDaFirebase(percorso, queryParams = '') {
  const C = getConfigOttimizzato();
  let url = firebaseJsonUrl_(C, percorso);

  if (queryParams) {
    // Firebase REST richiede parametri separati (orderBy="ghash"&equalTo="…").
    // encodeURI() sull'intera stringa codifica & e = → la query non viene riconosciuta.
    url += '&' + queryParams;
  }

  try {
    const risposta = UrlFetchApp.fetch(url, {
      method: 'get',
      muteHttpExceptions: true,
    });
    const code = risposta.getResponseCode();
    const content = risposta.getContentText();

    if (code !== 200) {
      console.error(`❌ Errore Firebase (${code}): ${content}`);
      return null;
    }

    return JSON.parse(content);
  } catch (e) {
    console.error('❌ Errore di rete/connessione: ' + e.toString());
    return null;
  }
}

/**
 * @param {string} percorso es. feedback_pendenti/ID
 * @return {boolean}
 */
function eliminaDaFirebase(percorso) {
  const C = getConfigOttimizzato();
  const url = firebaseJsonUrl_(C, percorso);
  try {
    const risposta = UrlFetchApp.fetch(url, {
      method: 'delete',
      muteHttpExceptions: true,
    });
    const code = risposta.getResponseCode();
    if (code !== 200) {
      console.error(
          `❌ eliminaDaFirebase (${code}): ${risposta.getContentText()}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error('❌ eliminaDaFirebase: ' + e.toString());
    return false;
  }
}
