/**
 * @fileoverview Web app validazione QR: Firebase prenotazioni + mirror foglio.
 */

/**
 * @param {*} e
 * @return {!HtmlOutput}
 */
function interfacciaValidazioneQR(e) {
  const C = getConfigOttimizzato();
  const idRaw = e.parameter.id;
  const localeScansionato = e.parameter.loc || 'Locale';

  if (!idRaw) {
    return generaErroreAccesso('ID Prenotazione mancante o non leggibile.');
  }

  const id = idRaw.trim();

  const p = leggiPrenotazioneConFallbackFoglio_(id, C);

  let successo = false;
  let giaValidato = false;
  let nomeCliente = 'Cliente';

  if (p && p.stato_id) {
    successo = true;
    nomeCliente = p.nome_utente || 'Cliente';
    giaValidato = isCellaShowGiaValidata_(p.show);

    if (!giaValidato) {
      aggiornaPrenotazioneDopoValidazioneQr_(C, id, p.chat_id, localeScansionato);
      console.log(`✅ Validato e accodato per feedback: ${id}`);
    }
  }

  const ui = {
    bg: successo ? (giaValidato ? '#f39c12' : '#27ae60') : '#e74c3c',
    icona: successo ? (giaValidato ? '⚠️' : '✅') : '❌',
    titolo: successo ? (giaValidato ? 'GIÀ USATO' : 'VALIDATO!') : 'NON TROVATO',
    msg: successo ?
        (giaValidato ?
            `Attenzione: questa box risulta già ritirata da <b>${nomeCliente}</b>.` :
            `Ottimo! Puoi consegnare la box a <b>${nomeCliente}</b>.`) :
        'Il codice scansionato non è presente nel sistema.',
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
        <style>
          body { 
            font-family: -apple-system, sans-serif; 
            margin: 0; background: ${ui.bg}; color: white; 
            display: flex; align-items: center; justify-content: center; 
            height: 100vh; text-align: center; overflow: hidden;
          }
          .card { 
            background: rgba(255,255,255,0.15); 
            padding: 40px 20px; border-radius: 40px; 
            backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
            width: 85%; max-width: 350px; border: 1px solid rgba(255,255,255,0.3);
            box-shadow: 0 20px 50px rgba(0,0,0,0.2);
          }
          .icon { font-size: 80px; margin-bottom: 10px; }
          h1 { font-size: 38px; margin: 0; font-weight: 900; }
          .locale-tag { 
            display: inline-block; background: rgba(0,0,0,0.2); 
            padding: 4px 12px; border-radius: 15px; font-size: 12px; 
            margin: 15px 0; font-weight: bold; text-transform: uppercase;
          }
          p { font-size: 18px; line-height: 1.4; margin: 10px 0; }
          .btn-close { 
            margin-top: 30px; background: white; color: ${ui.bg}; 
            border: none; padding: 12px 35px; border-radius: 50px; 
            font-weight: bold; cursor: pointer; font-size: 16px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">${ui.icona}</div>
          <h1>${ui.titolo}</h1>
          <div class="locale-tag">${localeScansionato}</div>
          <p>${ui.msg}</p>
          <button class="btn-close" onclick="window.close()">CHIUDI</button>
        </div>
      </body>
    </html>
  `;

  return HtmlService.createHtmlOutput(html)
      .setTitle('Validazione QR')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
