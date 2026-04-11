/**
 * @fileoverview Validazione token proprietario su Firebase /locali/{token}.
 */

/**
 * @param {string} token
 * @param {!Object} C Config (firma stabile; lettura via getConfigOttimizzato in core).
 * @return {?{nome: string, token: string, lat: *, lng: *}}
 */
function validaTokenProprietarioFDB(token, C) {
  if (!token) {
    return null;
  }
  const data = leggiDaFirebase('locali/' + token);
  if (!data || typeof data !== 'object' || !data.nome) {
    return null;
  }
  return {
    nome: data.nome,
    token: token,
    lat: data.lat,
    lng: data.lng,
  };
}
