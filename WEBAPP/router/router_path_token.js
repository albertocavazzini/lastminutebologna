/**
 * @fileoverview Estrazione token UUID da pathInfo (.../exec/<uuid>).
 */

/**
 * @param {string} pathInfo
 * @return {string}
 */
function tokenProprietarioDaPathInfo_(pathInfo) {
  if (!pathInfo) {
    return '';
  }
  const segment = pathInfo.split('/')[0].trim();
  if (!segment) {
    return '';
  }
  const dec = decodeURIComponent(segment);
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRe.test(dec) ? dec : '';
}
