/**
 * @fileoverview Chiamate alle API Telegram (messaggi, foto, tastiere).
 */

/**
 * @param {!Object} C
 * @param {string} method es. sendMessage, sendPhoto
 * @return {string}
 */
function telegramBotMethodUrl_(C, method) {
  return `https://api.telegram.org/bot${C.TOKEN}/${method}`;
}

/**
 * @param {string} chatId
 * @param {string} testo
 * @param {Object=} opzioni
 * @param {!Object} C Config con TOKEN.
 * @return {!Object}
 */
function preparaRichiestaTelegram(chatId, testo, opzioni = {}, C) {
  const payload = {
    chat_id: chatId,
    text: testo,
    parse_mode: 'Markdown',
    ...opzioni,
  };

  return {
    url: telegramBotMethodUrl_(C, 'sendMessage'),
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };
}

/**
 * @param {string} chatId
 * @param {string} testo
 * @return {boolean}
 */
function inviaMessaggio(chatId, testo) {
  const C = getConfigOttimizzato();
  const payload = {
    chat_id: chatId,
    text: testo,
    parse_mode: 'Markdown',
    disable_web_page_preview: false,
  };
  return chiamateTelegram(telegramBotMethodUrl_(C, 'sendMessage'), payload, 'inviaMessaggio');
}

/**
 * @param {string} chatId
 * @param {string} testo
 * @param {!Object} tastiera
 * @return {boolean}
 */
function inviaMessaggioConBottoni(chatId, testo, tastiera) {
  const C = getConfigOttimizzato();
  const payload = {
    chat_id: chatId,
    text: testo,
    parse_mode: 'Markdown',
    reply_markup: JSON.stringify(tastiera),
  };
  return chiamateTelegram(
      telegramBotMethodUrl_(C, 'sendMessage'), payload, 'inviaMessaggioConBottoni');
}

/**
 * @param {string} chatId
 * @param {string} testo
 * @return {boolean}
 */
function chiediPosizione(chatId, testo) {
  const C = getConfigOttimizzato();
  const tastieraPosizione = {
    keyboard: [[{text: '📍 Condividi Posizione', request_location: true}]],
    resize_keyboard: true,
    one_time_keyboard: true,
  };
  const payload = {
    chat_id: chatId,
    text: testo,
    parse_mode: 'Markdown',
    reply_markup: JSON.stringify(tastieraPosizione),
  };
  return chiamateTelegram(telegramBotMethodUrl_(C, 'sendMessage'), payload, 'chiediPosizione');
}

/**
 * @param {string} url
 * @param {!Object} payload
 * @param {string} nomeFunzione
 * @return {boolean}
 */
function chiamateTelegram(url, payload, nomeFunzione) {
  try {
    const res = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });
    const resCode = res.getResponseCode();
    if (resCode !== 200) {
      console.error(
          `❌ Errore API ${nomeFunzione} (${resCode}): ${res.getContentText()}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`❌ Errore rete ${nomeFunzione}: ${e}`);
    return false;
  }
}

/**
 * @param {string} chatId
 * @param {string} fotoUrl
 * @param {string} didascalia
 * @return {boolean}
 */
function inviaFotoUrl(chatId, fotoUrl, didascalia) {
  const C = getConfigOttimizzato();
  const payload = {
    chat_id: chatId,
    photo: fotoUrl,
    caption: didascalia,
    parse_mode: 'Markdown',
  };
  return chiamateTelegram(telegramBotMethodUrl_(C, 'sendPhoto'), payload, 'inviaFotoUrl');
}

/**
 * @param {string} chatId
 * @param {string} testo
 * @return {boolean}
 */
function rimuoviTastiera(chatId, testo) {
  const C = getConfigOttimizzato();
  const payload = {
    chat_id: chatId,
    text: testo,
    parse_mode: 'Markdown',
    reply_markup: JSON.stringify({remove_keyboard: true}),
  };
  return chiamateTelegram(telegramBotMethodUrl_(C, 'sendMessage'), payload, 'rimuoviTastiera');
}

/**
 * Invia un messaggio con pulsante inline che apre la mini app Telegram, se
 * URL_MINI_APP_TELEGRAM è valorizzato nel foglio credenziali; altrimenti
 * equivale a inviaMessaggio (nessun cambiamento per chi non imposta la chiave).
 * @param {string} chatId
 * @param {string} testo
 * @param {string=} etichettaBottone default "Apri app"
 * @return {boolean}
 */
function inviaMessaggioConBottoneMiniAppOpzionale(chatId, testo, etichettaBottone) {
  const C = getConfigOttimizzato();
  const url = C.URL_MINI_APP_TELEGRAM;
  const urlTrim = url != null && String(url).trim() !== '' ? String(url).trim() : '';
  if (!urlTrim) {
    return inviaMessaggio(chatId, testo);
  }
  const label = etichettaBottone && String(etichettaBottone).trim() !== '' ?
      String(etichettaBottone).trim() :
      'Apri app';
  const tastiera = {
    inline_keyboard: [[
      {text: label, web_app: {url: urlTrim}},
    ]],
  };
  return inviaMessaggioConBottoni(chatId, testo, tastiera);
}
