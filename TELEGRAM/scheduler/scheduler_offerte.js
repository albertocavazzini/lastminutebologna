/**
 * @fileoverview Invio offerte IN_ATTESA quando l'orario di inizio è raggiunto (Firebase).
 */

/**
 * @param {!Object} C
 */
function controllaEInviaOfferte(C) {
  const mappa = leggiMappaOfferteAttiveFirebase_();
  const minutiAttuali = minutiDaMezzanotteDaStringaHHmm_(formatOraEuropeRomeHHmm_());
  if (minutiAttuali == null) {
    return;
  }

  for (const idKey of Object.keys(mappa)) {
    const o = mappa[idKey];
    const idOfferta = o.id_offerta || idKey;

    if (o.stato_invio === 'INVIATO' || !idOfferta) {
      continue;
    }

    const minutiInizio = minutiDaMezzanotteDaStringaHHmm_(o.inizio_offerta);
    if (minutiInizio == null) {
      continue;
    }

    if (minutiAttuali >= minutiInizio) {
      const infoPerRadar = payloadRadarDaOggettoOffertaFb_(o);

      const esito = inviaNotificheRadar(idOfferta, infoPerRadar, C);
      if (esito > 0) {
        o.stato_invio = 'INVIATO';
        scriviOffertaAttivaFirebase_(idOfferta, o);
        mirrorUpdateOffertaStatoInvioSheet_(C, idOfferta, 'INVIATO');
        console.log(`🚀 Offerta ${idOfferta} inviata a ${esito} utenti.`);
      } else {
        console.log(
            `ℹ️ Offerta ${idOfferta}: radar 0 invii (ghash/raggio/attività). ` +
            'Riprovo finché non risulta INVIATO.');
      }
    }
  }
}
