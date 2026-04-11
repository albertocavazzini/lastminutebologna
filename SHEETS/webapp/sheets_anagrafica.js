/**
 * @fileoverview API pubblica Anagrafica (dettagli in sheets_anagrafica_lettura.js).
 */

/**
 * Svuota le cache Anagrafica (Firebase e foglio). Dopo sync o edit manuali.
 */
function flushAnagraficaCache() {
  const c = CacheService.getScriptCache();
  c.remove(ANAGRAFICA_CACHE_KEY_);
  c.remove(ANAGRAFICA_FDB_CACHE_KEY_);
  c.remove(ANAGRAFICA_FDB_EMPTY_KEY_);
  console.log('🧹 Cache Anagrafica svuotata (foglio + Firebase).');
}

/**
 * @param {string} nome
 * @return {!Object}
 */
function recuperaInfoLocale(nome) {
  const nomeCercato = normalizzaNomeLocaleAnagrafica_(nome);
  const daFdb = recuperaInfoLocaleDaFirebase_(nomeCercato);
  if (daFdb) {
    return daFdb;
  }
  return recuperaInfoLocaleDaFoglio_(nomeCercato);
}
