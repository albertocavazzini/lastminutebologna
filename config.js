/**
 * @fileoverview Configurazione globale del progetto (costanti fogli e colonne).
 *
 * L'oggetto CONFIG è creato una sola volta quando il runtime carica lo script
 * (come ogni altro `const` / `function` a livello file in Apps Script), non a ogni
 * chiamata di funzione. Spostare costanti dentro le funzioni non accelera il runtime
 * e può peggiorarlo (ricreazione a ogni invocazione). getConfigOttimizzato()
 * serve invece a evitare di riaprire il foglio credenziali esterno a ogni
 * esecuzione, unendo CONFIG con le chiavi lette da lì e mettendo il risultato
 * in CacheService (TTL 30 min).
 */
const CONFIG = {
  // --- MINI APP TELEGRAM (opzionale, da foglio credenziali) ---
  // URL_MINI_APP_TELEGRAM: HTTPS della mini app (es. GitHub Pages). Se presente,
  // puoi usare inviaMessaggioConBottoneMiniAppOpzionale in TELEGRAM/messages.js
  // per un pulsante "Apri app". La mini app legge gli endpoint da .env (VITE_*).

  // --- NOMI FOGLI ---
  SHEET_ANAGRAFICA: 'Anagrafica',
  SHEET_OFFERTE: 'Offerte',
  SHEET_PRENOTAZIONI: 'Prenotazioni',
  SHEET_FEEDBACK: 'Feedback',
  SHEET_UTENTI: 'Utenti',
  SHEET_ARCHIVIO: 'Archivio_Offerte',

  // --- MAPPATURA COLONNE FOGLIO "ANAGRAFICA" (Base Zero) ---
  COLUMNS_ANAGRAFICA: {
    NOME_LOCALE: 0, // Colonna A
    INDIRIZZO: 1, // Colonna B
    URL_MAPS: 2, // Colonna C
    LONGITUDINE: 3, // Colonna D
    LATITUDINE: 4, // Colonna E
    GHASH: 5, // Colonna F
    TOKEN_ACCESSO: 6, // Colonna G
    LINK_LOCALE: 7, // Colonna H — link pannello proprietario (…/exec/TOKEN, non ?auth=)
  },

  // Anagrafica col. H: la formula deve usare "/" prima del token, MAI "?auth=".
  // Esempio (URL base …/exec in Config!B2, token in G2):
  //   =IF(G2="";""; HYPERLINK(Config!$B$2 & "/" & G2; "Apri"))
  // Oppure funzione personalizzata da UTILS.gs:
  //   =IF(G2="";""; HYPERLINK(LINK_LOCALE_URL(Config!$B$2; G2); "Apri"))

  // --- MAPPATURA COLONNE FOGLIO "OFFERTE" (Base Zero) ---
  COLUMNS_OFFERTE: {
    ID_OFFERTA: 0, // Colonna A
    NOME_LOCALE: 1, // Colonna B
    INDIRIZZO: 2, // Colonna C
    DESCRIZIONE: 3, // Colonna D
    PREZZO_FINALE: 4, // Colonna E
    PREZZO_INIZIALE: 5, // Colonna F
    POSTI_TOTALI: 6, // Colonna G
    POSTI_RIMASTI: 7, // Colonna H
    SCADENZA_OFFERTA: 8, // Colonna I
    INIZIO_OFFERTA: 9, // Colonna J
    STATO_INVIO: 10, // Colonna K
    URL_MAPS: 11, // Colonna L
    LATITUDINE: 12, // Colonna M
    LONGITUDINE: 13, // Colonna N
    GHASH: 14, // Colonna O
  },

  // --- MAPPATURA COLONNE FOGLIO "PRENOTAZIONI" (Base Zero) ---
  COLUMNS_PRENOTAZIONI: {
    TIMESTAMP: 0, // Colonna A
    ID_OFFERTA: 1, // Colonna B
    NOME_UTENTE: 2, // Colonna C
    USERNAME_TELEGRAM: 3, // Colonna D
    STATO_ID: 4, // Colonna E (ID Prenotazione)
    SHOW: 5, // Colonna F (Stato Validazione)
    LOCALE: 6, // Colonna G
    ORA_SCANSIONE: 7, // Colonna H
    FEEDBACK_INVIATO: 8, // Colonna I
    CHAT_ID: 9, // Colonna J
  },

  // --- MAPPATURA COLONNE FOGLIO "FEEDBACK" (Base Zero) ---
  COLUMNS_FEEDBACK: {
    TIMESTAMP: 0, // Colonna A
    ID_PRENOTAZIONE: 1, // Colonna B
    LOCALE: 2, // Colonna C
    USER_ID_TELEGRAM: 3, // Colonna D
    VALUTAZIONE: 4, // Colonna E
    COMMENTO: 5, // Colonna F
  },

  // --- MAPPATURA COLONNE FOGLIO "UTENTI" (Base Zero) ---
  COLUMNS_UTENTI: {
    CHAT_ID: 0, // Colonna A
    NOME: 1, // Colonna B
    LATITUDINE: 2, // Colonna C
    LONGITUDINE: 3, // Colonna D
    ULTIMO_AGGIORNAMENTO: 4, // Colonna E
    ULTIMA_NOTIFICA: 5, // Colonna F
  },
};

/**
 * Restituisce CONFIG arricchito con il foglio credenziali, usando Script Cache.
 * Il risparmio quota/tempo è sulla lettura dello spreadsheet esterno, non sul
 * parsing letterale di CONFIG (già in memoria dopo il primo load del progetto).
 * @return {!Object}
 */
function getConfigOttimizzato() {
  const cache = CacheService.getScriptCache();
  const cacheKey = 'PROJ_CONFIG_FULL';

  const cached = cache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  let finaleConfig = {...CONFIG};

  try {
    const ssCred = SpreadsheetApp.openByUrl(
        'https://docs.google.com/spreadsheets/d/1jUAlJXDnk_DWgw4RZyjNMZlnAQD5qFFLQAvJuLzk2hE/edit');
    const foglio = ssCred.getSheets()[0];
    const dati = foglio.getDataRange().getValues();

    dati.forEach((riga) => {
      const chiave = riga[0];
      const valore = riga[1];
      if (chiave) {
        finaleConfig[chiave] = valore;
      }
    });

    cache.put(cacheKey, JSON.stringify(finaleConfig), 1800);
    return finaleConfig;
  } catch (e) {
    console.error('❌ Errore nel recupero credenziali esterne: ' + e.message);
    return CONFIG;
  }
}

/**
 * Svuota la cache del config. Da invocare se modifichi il foglio credenziali o
 * vuoi forzare il re-merge immediato. Per la mappa Anagrafica in cache usare
 * flushAnagraficaCache (sheets_anagrafica.js).
 */
function flushConfigCache() {
  CacheService.getScriptCache().remove('PROJ_CONFIG_FULL');
  console.log('🧹 Cache del Config svuotata correttamente (chiave PROJ_CONFIG_FULL).');
}
