/**
 * @fileoverview Posizione utente su Firebase con geohash e ottimizzazione scritture.
 */

/**
 * @param {string|number} chatId
 * @param {string} nome
 * @param {number} lat
 * @param {number} lng
 */
function salvaPosizioneUtente(chatId, nome, lat, lng) {
  const C = getConfigOttimizzato();
  const percorsoUtente = `utenti/${chatId}`;

  const vecchioDato = leggiDaFirebase(percorsoUtente) || null;

  const vecchiaLat = vecchioDato ? vecchioDato.lat : 0;
  const vecchiaLng = vecchioDato ? vecchioDato.lng : 0;
  const vecchioHash = vecchioDato ? vecchioDato.ghash : '';
  const ultimaNotifica = vecchioDato ? vecchioDato.ultima_notifica : '';

  const nuovoHash = generaGeohash(lat, lng, 6);

  if (vecchioDato) {
    const spostamentoKm = getDistanzaGps(lat, lng, vecchiaLat, vecchiaLng);
    const spostamentoMetri = spostamentoKm * 1000;

    const cambiatoCella = nuovoHash !== vecchioHash;
    const minSpostamento = C.MIN_SPOSTAMENTO_METRI || 50;

    if (spostamentoMetri < minSpostamento && !cambiatoCella) {
      console.log(
          `[Radar-FB] ${nome} fermo (${Math.round(spostamentoMetri)}m) nella stessa zona. Ignoro.`);
      return;
    }

    if (cambiatoCella) {
      console.log(`[Radar-FB] ${nome} è entrato in una nuova zona: ${nuovoHash}`);
    }
  }

  const oraItaliana = Utilities.formatDate(
      new Date(), 'Europe/Rome', 'yyyy-MM-dd\'T\'HH:mm:ssXXX');
  const nuoviDati = {
    chat_id: chatId.toString(),
    nome: nome || 'Utente',
    lat: lat,
    lng: lng,
    ghash: nuovoHash,
    ultimo_aggiornamento: oraItaliana,
    ultima_notifica: ultimaNotifica,
  };

  try {
    scriviSuFirebase(percorsoUtente, nuoviDati);
    console.log(`✅ [Firebase] Posizione salvata per ${nome} (Hash: ${nuovoHash})`);
  } catch (e) {
    console.error(`❌ Errore scrittura Firebase per ${chatId}:`, e);
  }
}
