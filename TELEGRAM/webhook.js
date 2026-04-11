/**
 * @fileoverview Webhook Telegram (doPost): messaggi, posizioni, deep link prenotazione.
 */

/**
 * Telegram ritenta l’update se la risposta HTTP non è 200 o è lenta: senza body JSON
 * e senza dedup su `update_id`, /start può essere elaborato due volte.
 * @return {!GoogleAppsScript.Content.TextOutput}
 */
function rispostaWebhookTelegramOk_() {
  return ContentService.createTextOutput('{"ok":true}')
      .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Normalizza /start, /start@BotName, /start payload, /start@BotName payload.
 * @param {string} text
 * @return {?{payload: string}}
 */
function parseTelegramStartCommand_(text) {
  const raw = String(text || '').trim();
  if (!raw.toLowerCase().startsWith('/start')) {
    return null;
  }
  let rest = raw.slice(6).trim();
  if (rest.startsWith('@')) {
    const sp = rest.search(/\s/);
    if (sp === -1) {
      rest = '';
    } else {
      rest = rest.slice(sp + 1).trim();
    }
  }
  return {payload: rest};
}

/**
 * Un solo ScriptLock per `update_id` + debounce /start: con due lock distinti, due POST
 * paralleli di Telegram (stesso tap) potevano entrambi vedere cache vuota e elaborare due volte.
 * @param {!Object} contents body webhook già parsato (deve avere .message)
 * @return {boolean} true = non elaborare oltre (retry o /start duplicato)
 */
function webhookMessaggioPrecheckESkip_(contents) {
  const msg = contents.message;
  const updateId = contents.update_id;
  const lock = LockService.getScriptLock();
  let lockAcquired = false;
  try {
    lock.waitLock(20000);
    lockAcquired = true;
  } catch (e) {
    console.warn('[Webhook] Lock non acquisito: ' + e.message);
    return false;
  }

  try {
    const cache = CacheService.getScriptCache();

    if (updateId != null) {
      const ku = 'tgupd_' + updateId;
      if (cache.get(ku)) {
        return true;
      }
      cache.put(ku, '1', 3600);
    }

    const text = msg.text != null ? String(msg.text).trim() : '';
    const st = parseTelegramStartCommand_(text);
    if (st) {
      const pay = String(st.payload || '').trim() || '_plain';
      const kd = 'tgst_' + msg.chat.id + '_' + pay;
      if (kd.length > 240) {
        return false;
      }
      if (cache.get(kd)) {
        return true;
      }
      cache.put(kd, '1', 20);
    }

    return false;
  } finally {
    if (lockAcquired) {
      lock.releaseLock();
    }
  }
}

/**
 * @param {*} e
 * @return {!GoogleAppsScript.Content.TextOutput}
 */
function doPost(e) {
  try {
    if (!e || !e.postData) {
      return rispostaWebhookTelegramOk_();
    }

    let contents;
    try {
      contents = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      console.error('[Webhook] JSON non valido: ', parseErr);
      return rispostaWebhookTelegramOk_();
    }

    const msg = contents.message;
    if (!msg) {
      return rispostaWebhookTelegramOk_();
    }

    if (webhookMessaggioPrecheckESkip_(contents)) {
      return rispostaWebhookTelegramOk_();
    }

    const chatId = msg.chat.id;
    const nomeUtente = msg.from.first_name || 'Utente';
    const usernameTelegram = msg.from.username || 'N/A';

    if (msg.location) {
      const lat = msg.location.latitude;
      const lng = msg.location.longitude;

      salvaPosizioneUtente(chatId, nomeUtente, lat, lng);

      const conferma =
          `✅ *Radar Attivato, ${nomeUtente}!*\n\n` +
          'La tua posizione è stata aggiornata. Riceverai una notifica non appena un ' +
          'locale vicino a te pubblicherà un\'offerta Last Minute! 🥯📍';

      inviaMessaggio(chatId, conferma);
      return rispostaWebhookTelegramOk_();
    }

    const text = (msg.text || '').trim();
    const startParsed = parseTelegramStartCommand_(text);

    if (startParsed) {
      if (startParsed.payload) {
        const offertaId = startParsed.payload.split(/\s+/)[0];
        console.log(
            `🚀 [Webhook] Avvio prenotazione per: ${offertaId} da ChatID: ${chatId}`);

        try {
          processaPrenotazione(chatId, offertaId, nomeUtente, usernameTelegram);
        } catch (err) {
          console.error('❌ Errore in processaPrenotazione:', err.message);
          inviaMessaggio(
              chatId,
              '⚠️ *Ops!* C\'è stato un problema tecnico durante la prenotazione.\n\n' +
              'Riprova tra un istante o contatta l\'assistenza.');
        }
      } else {
        const benvenuto =
            `Ciao ${nomeUtente}! Benvenuto su *LastMinuteBologna*! 🥯\n\n` +
            'Per avvisarti quando ci sono box invendute vicino a te, clicca il tasto qui ' +
            'sotto per attivare il radar. 👇';

        chiediPosizione(chatId, benvenuto);
      }
      return rispostaWebhookTelegramOk_();
    }

    return rispostaWebhookTelegramOk_();
  } catch (error) {
    console.error('🔥 Errore critico nel doPost: ', error);
    return rispostaWebhookTelegramOk_();
  }
}
