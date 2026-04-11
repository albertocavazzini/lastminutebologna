/**
 * @fileoverview Oggetto "info" per inviaNotificheRadar da foglio o da web app.
 */

/**
 * @param {!Array<*>} riga displayValues riga Offerte
 * @param {!Object} colO COLUMNS_OFFERTE
 * @return {!Object}
 */
function payloadRadarDaRigaFoglioOfferte_(riga, colO) {
  return {
    nome: riga[colO.NOME_LOCALE],
    descrizione: riga[colO.DESCRIZIONE],
    prezzo: riga[colO.PREZZO_FINALE],
    scadenza: riga[colO.SCADENZA_OFFERTA],
    lat: parseFloat(riga[colO.LATITUDINE]),
    lng: parseFloat(riga[colO.LONGITUDINE]),
    ghash: riga[colO.GHASH],
  };
}

/**
 * @param {!Object} dati payload salvaDati (desc, locale, …)
 * @param {!Object} infoLocale da recuperaInfoLocale
 * @param {string} prezzoF
 * @param {string} oraScadenza
 * @return {!Object}
 */
function payloadRadarDaSalvataggioWebApp_(dati, infoLocale, prezzoF, oraScadenza) {
  return {
    nome: dati.locale,
    descrizione: dati.desc,
    prezzo: prezzoF,
    scadenza: oraScadenza,
    urlMaps: infoLocale.urlMaps,
    lat: infoLocale.lat,
    lng: infoLocale.lng,
    ghash: infoLocale.ghash,
  };
}

/**
 * @param {!Object} o record Firebase offerte_attive
 * @return {!Object}
 */
function payloadRadarDaOggettoOffertaFb_(o) {
  return {
    nome: o.nome_locale,
    descrizione: o.descrizione,
    prezzo: String(o.prezzo_finale != null ? o.prezzo_finale : ''),
    scadenza: o.scadenza_offerta,
    urlMaps: o.url_maps || '',
    lat: parseFloat(o.latitudine),
    lng: parseFloat(o.longitudine),
    ghash: o.ghash,
  };
}
