/**
 * @fileoverview Escape HTML per testo inserito in template UI.
 */

/**
 * @param {*} testo
 * @return {string}
 */
function escapeHtmlUi_(testo) {
  return String(testo)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
}
