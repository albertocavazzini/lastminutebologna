/**
 * @fileoverview Estrazione token proprietario da query string e pathInfo.
 */

/**
 * @param {!Object} params e.parameter
 * @return {string}
 */
function estraiAuthProprietarioDaQuery_(params) {
  return (
      params.auth ||
      params.AUTH ||
      params.t ||
      params.T ||
      params.token ||
      params.TOKEN ||
      ''
  )
      .toString()
      .trim();
}

/**
 * @param {!Object} params
 * @param {string} pathInfo
 * @return {{authQuery: string, authPath: string, auth: string}}
 */
function risolviAuthProprietarioCompleto_(params, pathInfo) {
  const authQuery = estraiAuthProprietarioDaQuery_(params);
  const authPath = tokenProprietarioDaPathInfo_(pathInfo || '');
  return {
    authQuery: authQuery,
    authPath: authPath,
    auth: authQuery || authPath,
  };
}
