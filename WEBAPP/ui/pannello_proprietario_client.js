/**
 * @fileoverview Recupero token lato client e pagina di fallback se i param GET mancano.
 */

/**
 * @param {string} tokenRaw
 * @return {{ok: boolean, html: string, title: string}}
 */
function recuperaHtmlPannelloProprietario(tokenRaw) {
  const token = String(tokenRaw || '').trim();
  console.log(
      '[Router] recuperaHtmlPannelloProprietario (da client) prefix: ' +
      (token ? token.substring(0, 8) + '…' : '(vuoto)'));
  if (!token) {
    return {
      ok: false,
      html: generaErroreAccesso('Token mancante.').getContent(),
      title: 'Accesso Negato',
    };
  }
  const C = getConfigOttimizzato();
  const info = validaTokenProprietarioFDB(token, C);
  if (!info) {
    return {
      ok: false,
      html: generaErroreAccesso(
          'Token non valido o assente su Firebase. Controlla TOKEN_ACCESSO e il nodo locali/.')
          .getContent(),
      title: 'Accesso Negato',
    };
  }
  const fakeE = {parameter: {auth: token}};
  const out = interfacciaProprietario(fakeE, info);
  return {ok: true, html: out.getContent(), title: out.getTitle() || 'Pannello'};
}

/**
 * @return {!HtmlOutput}
 */
function paginaRecuperoParametriClient_() {
  const hint =
      'In Fogli Google il cancelletto # viene spesso tagliato nei collegamenti: non usare #. ' +
      'Formula: =HYPERLINK(A1&"/"&B2;"Apri") con A1 = URL fino a …/exec e B2 = TOKEN_ACCESSO. ' +
      'Oppure apri da browser incollando …/exec/UUID oppure …/exec?t=UUID.';
  const hintJson = JSON.stringify(hint);
  const html = `<!DOCTYPE html><html><head><base target="_top">
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Caricamento…</title></head>
<body style="font-family:-apple-system,sans-serif;text-align:center;padding:40px;color:#555">
<p id="m">Caricamento pannello…</p>
<script>
(function(){
  const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const U=/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
  function showErr(t){
    document.getElementById('m').innerHTML='<b>Accesso negato</b><br>'+t+
        '<br><small>LAST MINUTE BOLOGNA</small>';
  }
  function tokenFromHref(s){
    if(!s)return'';
    let m=s.match(/\\/exec\\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    if(m)return m[1];
    m=s.match(/[?&#]t=([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    if(m)try{return decodeURIComponent(m[1]);}catch(e){return m[1];}
    m=s.match(/[?&#]auth=([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    if(m)try{return decodeURIComponent(m[1]);}catch(e){return m[1];}
    m=s.match(/#([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    return m?m[1]:'';
  }
  function primoUuidInOggetto(o){
    if(!o)return'';
    let k; let v; let x;
    for(k in o){
      if(!Object.prototype.hasOwnProperty.call(o,k))continue;
      v=o[k];
      if(v==null)continue;
      if(typeof v==='string'){x=v.trim();if(UUID.test(x))return x;}
      if(Object.prototype.toString.call(v)==='[object Array]'&&v.length){
        x=String(v[0]).trim();if(UUID.test(x))return x;
      }
    }
    return'';
  }
  function run(){
    if(typeof google==='undefined'||!google.script||!google.script.url){
      showErr('Apri il link in Chrome/Safari aggiornato.');
      return;
    }
    google.script.url.getLocation(function(loc){
      let t='';
      try{
        t=primoUuidInOggetto(loc.parameter);
        if(!t&&loc.parameters)t=primoUuidInOggetto(loc.parameters);
        if(!t&&loc.hash){
          const h=String(loc.hash).replace(/^#/,'').trim();
          if(UUID.test(h))t=h;
          else if(/^auth=/i.test(h))t=h.replace(/^auth=/i,'').trim();
          else{const mh=h.match(U);if(mh)t=mh[1];}
        }
        if(!t)try{t=tokenFromHref(String(window.top.location.href));}catch(e){}
        if(!t)try{t=tokenFromHref(String(window.location.href));}catch(e2){}
      }catch(e3){}
      if(!t){showErr(${hintJson});return;}
      google.script.run.withSuccessHandler(function(res){
        if(!res||!res.html){showErr('Risposta vuota dal server.');return;}
        document.title=res.title||'Pannello';
        document.open();document.write(res.html);document.close();
      }).withFailureHandler(function(err){
        showErr(err&&err.message?err.message:'Errore');
      }).recuperaHtmlPannelloProprietario(t);
    });
  }
  run();
})();
<\/script></body></html>`;
  return HtmlService.createHtmlOutput(html)
      .setTitle('Caricamento')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
