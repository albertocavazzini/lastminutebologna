/**
 * @fileoverview Scrittura offerte: Firebase operativo, foglio Offerte come mirror analitico.
 */

/**
 * @param {!Object} dati
 * @return {boolean}
 */
function salvaDati(dati) {
  const C = getConfigOttimizzato();
  try {
    const colO = C.COLUMNS_OFFERTE;

    const infoLocale = recuperaInfoLocale(dati.locale);
    const idOfferta = 'OFF-' + Date.now();

    const prezzoF = parseFloat(dati.prezzoF).toFixed(2);
    const adesso = new Date();
    const oraInizio = formatOraEuropeRomeHHmm_(adesso);
    const durataMs = (parseInt(dati.durataMinuti, 10) || 15) * 60000;
    const oraScadenza = formatOraEuropeRomeHHmm_(new Date(adesso.getTime() + durataMs));

    let statoInvioEffettivo = 'IN_ATTESA';

    if (infoLocale.lat === 0 || infoLocale.lng === 0 || infoLocale.ghash === '') {
      console.warn(
          `⚠️ Dati geografici mancanti per ${dati.locale}. L'offerta non potrà essere inviata.`);
      statoInvioEffettivo = 'ERRORE_DATI';
    }

    const offertaFb = costruisciOffertaFb_(
        dati, infoLocale, idOfferta, prezzoF, oraInizio, oraScadenza, statoInvioEffettivo);

    scriviOffertaAttivaFirebase_(idOfferta, offertaFb);
    mirrorAppendOffertaRow_(C, offertaFbToRowArray_(offertaFb, colO));

    if (statoInvioEffettivo === 'IN_ATTESA') {
      try {
        const infoPerRadar = payloadRadarDaOggettoOffertaFb_(offertaFb);

        const notificati = inviaNotificheRadar(idOfferta, infoPerRadar, C);

        if (notificati > 0) {
          offertaFb.stato_invio = 'INVIATO';
          scriviOffertaAttivaFirebase_(idOfferta, offertaFb);
          mirrorUpdateOffertaStatoInvioSheet_(C, idOfferta, 'INVIATO');
          console.log(`🚀 [Radar Istantaneo] Notificati ${notificati} utenti.`);
        } else {
          console.log(
              'ℹ️ [Radar Istantaneo] Nessun invio (0 utenti in ghash+raggio o query vuota). ' +
              'Resta IN_ATTESA per lo scheduler.');
        }
      } catch (e) {
        console.warn(
            '⚠️ Radar istantaneo fallito o timeout. L\'invio verrà gestito dallo scheduler: ' +
            e.message);
      }
    }

    return true;
  } catch (err) {
    console.error('❌ Errore critico in salvaDati: ' + err.message);
    throw new Error('Errore durante il salvataggio: ' + err.message);
  }
}

/**
 * Inizializza nodi placeholder su Firebase (esecuzione una tantum).
 */
function inizializzaFirebaseDefault() {
  const segnaposto = {status: 'ready', last_sync: new Date().toISOString()};

  try {
    scriviSuFirebase('offerte_attive/placeholder', segnaposto);
    scriviSuFirebase('prenotazioni/placeholder', segnaposto);
    scriviSuFirebase('feedback_pendenti/placeholder', segnaposto);
    scriviSuFirebase('feedback_ricevuti/placeholder', segnaposto);
    console.log('✅ Nodi Firebase inizializzati con successo.');
  } catch (e) {
    console.error('❌ Impossibile inizializzare Firebase: ' + e.message);
  }
}
