/**
 * @fileoverview Parsing coordinate e numeri da celle foglio (virgola/punto).
 */

/**
 * @param {*} valore
 * @return {number}
 */
function parseNumeroDaCellaFoglio_(valore) {
  if (valore === null || valore === undefined || valore === '') {
    return 0;
  }
  const s = valore.toString().replace(/,/g, '.').trim();
  return parseFloat(s) || 0;
}
