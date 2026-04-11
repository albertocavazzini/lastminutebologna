/**
 * @fileoverview Entry point web app: smista proprietario, feedback, validazione QR, recupero client.
 */

/**
 * @param {*} e
 * @return {!HtmlOutput}
 */
function doGet(e) {
  logRichiestaWebApp_(e);

  try {
    if (!e || !e.parameter) {
      console.warn('[Router] e o e.parameter assente.');
      return generaErroreAccesso('Nessun parametro fornito.');
    }

    const C = getConfigOttimizzato();
    const params = e.parameter;

    const {authQuery, authPath, auth} = risolviAuthProprietarioCompleto_(params, e.pathInfo);
    const mode = (params.mode || '').toLowerCase();
    const id = (params.id || '').trim();

    if (authPath && !authQuery) {
      console.log('[Router] Token proprietario da pathInfo (query assente o ignorata dal redirect).');
    }

    if (auth !== '') {
      console.log('[Router] Ramo: proprietario — token (prefix): ' + auth.substring(0, 8) + '…');
      const infoLocale = validaTokenProprietarioFDB(auth, C);

      if (infoLocale) {
        console.log('✅ [Router] Accesso autorizzato: ' + infoLocale.nome);
        return interfacciaProprietario(e, infoLocale);
      }
      console.warn('❌ [Router] Firebase ha rifiutato il token o nodo /locali/ assente.');
      return generaErroreAccesso(
          'Il token utilizzato non è presente su Firebase, i dati non hanno il campo nome, ' +
          'oppure FIREBASE_SECRET / URL non sono corretti nel CONFIG.');
    }

    if (mode === 'fb' && id) {
      console.log('[Router] Ramo: feedback — id presente.');
      return interfacciaFeedback(e);
    }
    if (id !== '') {
      console.log('[Router] Ramo: validazione QR — id presente.');
      return interfacciaValidazioneQR(e);
    }

    if (mode === 'fb') {
      return generaErroreAccesso(
          'Parametri non validi per il feedback: serve anche id= (ID prenotazione).');
    }

    console.warn(
        '⚠️ [Router] Nessun param lato server (redirect Google). Avvio recupero client getLocation/hash. mode=' +
        JSON.stringify(mode) +
        ' pathInfoVuoto=' +
        (!e.pathInfo || String(e.pathInfo).trim() === ''));
    return paginaRecuperoParametriClient_();
  } catch (err) {
    console.error(
        '❌ ERRORE CRITICO: ' + err.message + (err.stack ? ' | ' + err.stack : ''));
    return generaErroreAccesso(
        'Errore interno. Controlla i log di esecuzione per il dettaglio tecnico.');
  }
}
