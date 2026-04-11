/**
 * @fileoverview Prenotazione: lock su Firebase + mirror foglio Prenotazioni/Offerte.
 */

/**
 * @param {string|number} chatId
 * @param {string} offertaId
 * @param {string} nome
 * @param {string} username
 */
function processaPrenotazione(chatId, offertaId, nome, username) {
  const C = getConfigOttimizzato();

  const iniziale = leggiOffertaAttivaConFallbackFoglio_(offertaId, C);
  if (!iniziale || !iniziale.id_offerta) {
    return inviaMessaggio(
        chatId, '❌ Scusa, questa offerta non è più disponibile o è scaduta.');
  }

  const offertaDati = messaggioPrenotazioneDaOffertaFb_(iniziale);

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    const fresh = leggiOffertaAttivaConFallbackFoglio_(offertaId, C);
    if (!fresh) {
      return inviaMessaggio(
          chatId, '❌ Scusa, questa offerta non è più disponibile o è scaduta.');
    }

    const postiAttuali = Number(fresh.posti_rimasti) || 0;

    if (postiAttuali > 0) {
      fresh.posti_rimasti = postiAttuali - 1;
      scriviOffertaAttivaFirebase_(offertaId, fresh);
      mirrorUpdateOffertaPostiRimastiSheet_(C, offertaId, fresh.posti_rimasti);

      const oraAttuale = new Date();
      const idPrenotazione = `PRE-${oraAttuale.getTime()}`;

      const pren = {
        timestamp: oraAttuale.toISOString(),
        id_offerta: offertaId,
        nome_utente: nome,
        username_telegram: username ? '@' + username : 'N/A',
        stato_id: idPrenotazione,
        show: false,
        locale: offertaDati.locale,
        ora_scansione: '',
        feedback_inviato: '',
        chat_id: String(chatId),
      };

      scriviPrenotazioneRuntimeFirebase_(idPrenotazione, pren);
      mirrorAppendPrenotazioneDaFb_(C, pren);

      lock.releaseLock();

      const urlValidazione =
          urlValidazionePrenotazione_(C, idPrenotazione, offertaDati.locale);
      const qrUrl = urlImmagineQrDaValidazione_(urlValidazione);
      const msgConferma = markdownConfermaPrenotazione_(offertaDati);

      inviaFotoConFallbackLinkQr_(chatId, qrUrl, msgConferma);
    } else {
      inviaMessaggio(
          chatId,
          '😔 Mi dispiace, i posti per questa offerta sono finiti proprio ora!');
    }
  } catch (e) {
    console.error('Errore critico Booking: ' + e.toString());
    inviaMessaggio(
        chatId,
        '⚠️ Errore tecnico durante la prenotazione. Riprova tra pochi istanti.');
  } finally {
    if (lock.hasLock()) {
      lock.releaseLock();
    }
  }
}
