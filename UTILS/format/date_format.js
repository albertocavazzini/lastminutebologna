/**
 * @fileoverview Formattazione date e orari (Italia / Europa/Rome).
 */

/**
 * @param {!Date} data
 * @return {string}
 */
function formattaDataItaliana(data) {
  return Utilities.formatDate(data, 'GMT+1', 'dd/MM/yyyy HH:mm');
}

/**
 * @param {Date=} optData Default now.
 * @return {string} HH:mm in Europe/Rome
 */
function formatOraEuropeRomeHHmm_(optData) {
  return Utilities.formatDate(optData || new Date(), 'Europe/Rome', 'HH:mm');
}

/**
 * Converte stringhe tipo "14:30" o valore cella display in minuti da mezzanotte.
 * @param {*} hhmm
 * @return {?number} null se non parseabile
 */
function minutiDaMezzanotteDaStringaHHmm_(hhmm) {
  const s = hhmm != null ? hhmm.toString() : '';
  if (!s.includes(':')) {
    return null;
  }
  const parti = s.split(':');
  if (parti.length < 2) {
    return null;
  }
  const h = parseInt(parti[0], 10);
  const m = parseInt(parti[1], 10);
  if (isNaN(h) || isNaN(m)) {
    return null;
  }
  return h * 60 + m;
}
