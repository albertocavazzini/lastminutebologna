/**
 * @fileoverview Pagina HTML "Accesso negato" per la web app.
 */

/**
 * @param {string} dettaglio
 * @return {!HtmlOutput}
 */
function generaErroreAccesso(dettaglio) {
  const html = `
    <div style="font-family: -apple-system, sans-serif; text-align: center; padding-top: 50px; background: #f8f9fa; height: 100vh;">
      <div style="background: white; display: inline-block; padding: 40px; border-radius: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); max-width: 80%;">
        <h1 style="color: #e74c3c; font-size: 60px; margin: 0;">⚠️</h1>
        <h2 style="color: #2c3e50; margin-top: 10px; font-weight: 800;">Accesso Negato</h2>
        <p style="color: #7f8c8d; font-size: 16px;">${escapeHtmlUi_(dettaglio)}</p>
        <hr style="width: 40px; border: 1.5px solid #eee; margin: 25px auto;">
        <small style="color: #adb5bd; letter-spacing: 1px; font-weight: bold;">LAST MINUTE BOLOGNA</small>
      </div>
    </div>
  `;
  return HtmlService.createHtmlOutput(html)
      .setTitle('Accesso Negato')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
