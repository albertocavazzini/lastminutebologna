/**
 * @fileoverview Invio notifiche radar (geohash + distanza) tramite Telegram batch.
 */

/**
 * @param {*} val
 * @return {number}
 */
function parseKmDaFoglioCredenziali_(val) {
  if (typeof val === 'number' && isFinite(val)) {
    return val;
  }
  const s = String(val == null ? '' : val).replace(/,/g, '.').trim();
  const x = parseFloat(s);
  return isFinite(x) ? x : NaN;
}

/**
 * Distanza massima utente–locale: RAGGIO_NOTIFICA_KM + buffer opzionale.
 * Il buffer (default ~120 m) compensa geocoding dell’indirizzo del locale vs GPS del telefono.
 * Sul foglio credenziali: RAGGIO_GPS_BUFFER_KM = 0 per disattivare.
 * @param {!Object} C
 * @return {number}
 */
function raggioNotificaRadarKm_(C) {
  let base = parseKmDaFoglioCredenziali_(C.RAGGIO_NOTIFICA_KM);
  if (!isFinite(base) || base <= 0) {
    base = 5;
  }
  let buf = parseKmDaFoglioCredenziali_(C.RAGGIO_GPS_BUFFER_KM);
  if (!isFinite(buf) || buf < 0) {
    buf = 0.12;
  }
  return base + buf;
}

/**
 * @param {!Object} infoLocale
 * @param {!Object} C
 * @param {string} idOfferta
 * @return {string}
 */
function markdownNotificaOffertaVicina_(infoLocale, C, idOfferta) {
  return (
      `📍 *OFFERTA VICINA!* 🥯\n` +
      `*${infoLocale.nome}* ha una nuova box!\n\n` +
      `🔥 ${infoLocale.descrizione}\n` +
      `💰 Prezzo: *€${infoLocale.prezzo}*\n` +
      `⏰ Ritira entro: *${infoLocale.scadenza}*\n\n` +
      `👉 [PRENOTA ORA](https://t.me/${C.NOME_BOT_TELEGRAM}?start=${idOfferta})`);
}

/**
 * @param {string} idOfferta
 * @param {!Object} infoLocale
 * @param {!Object} C
 * @return {number}
 */
function inviaNotificheRadar(idOfferta, infoLocale, C) {
  const ghashCercato = infoLocale.ghash;
  if (!ghashCercato) {
    console.error('❌ Radar fallito: Geohash locale mancante.');
    return 0;
  }

  const queryGeo = firebaseRestQueryOrderByEqualToString_('ghash', ghashCercato);
  const raggioKm = raggioNotificaRadarKm_(C);
  console.log(
      `🔍 Radar: ghash "${ghashCercato}", distanza max ${raggioKm} km (notifica + buffer GPS)`);

  const utentiInZona = leggiDaFirebase('utenti', queryGeo) || {};
  const chiaviUtenti = Object.keys(utentiInZona);

  if (chiaviUtenti.length === 0) {
    console.log('ℹ️ Nessun utente trovato in questa zona.');
    return 0;
  }

  const limiteAttivita = new Date(Date.now() - 24 * 60 * 60 * 1000).getTime();
  const utentiTarget = [];

  chiaviUtenti.forEach((key) => {
    const u = utentiInZona[key];

    if (!u.lat || !u.lng || !u.chat_id) {
      return;
    }
    if (u.ultima_notifica === idOfferta) {
      return;
    }

    const ultimaAttivita =
        u.ultimo_aggiornamento ? new Date(u.ultimo_aggiornamento).getTime() : 0;

    const d = getDistanzaGps(
        infoLocale.lat, infoLocale.lng, parseFloat(u.lat), parseFloat(u.lng));

    console.log(`Verifica utente ${u.nome || key}:`);
    console.log(`- Distanza calcolata: ${d} km (soglia ${raggioKm} km)`);
    console.log(`- Attivo: ${ultimaAttivita >= limiteAttivita ? 'SI' : 'NO'}`);

    if (ultimaAttivita < limiteAttivita) {
      return;
    }

    if (d <= raggioKm) {
      utentiTarget.push(u.chat_id);
    } else {
      console.log(`- Fuori soglia: ${d} km > ${raggioKm} km`);
    }
  });

  console.log(`🎯 Utenti nel raggio d'azione: ${utentiTarget.length}`);
  if (utentiTarget.length === 0) {
    return 0;
  }

  const SIZE = 25;
  let inviiTotali = 0;

  for (let i = 0; i < utentiTarget.length; i += SIZE) {
    const chunk = utentiTarget.slice(i, i + SIZE);
    const richieste = chunk.map((chatId) => {
      const msg = markdownNotificaOffertaVicina_(infoLocale, C, idOfferta);
      return preparaRichiestaTelegram(chatId, msg, {}, C);
    });

    const risposte = UrlFetchApp.fetchAll(richieste);

    risposte.forEach((res, index) => {
      if (res.getResponseCode() === 200) {
        inviiTotali++;
        const cId = chunk[index];
        scriviSuFirebase(`utenti/${cId}/ultima_notifica`, idOfferta);
      } else {
        console.warn(`⚠️ Errore invio a ${chunk[index]}: ${res.getContentText()}`);
      }
    });

    if (i + SIZE < utentiTarget.length) {
      Utilities.sleep(1000);
    }
  }
  return inviiTotali;
}
