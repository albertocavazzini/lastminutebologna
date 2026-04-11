/**
 * @fileoverview Interfaccia web per i proprietari: pubblicazione offerte (auth con token UUID).
 */

function interfacciaProprietario(e, infoLocale) {
  const nomeLocale = infoLocale ? infoLocale.nome : 'Locale Sconosciuto';
  const tokenLocale = infoLocale ? infoLocale.token : '';
  const nomeAttr = escapeHtmlUi_(nomeLocale);
  const tokenAttr = escapeHtmlUi_(tokenLocale);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
        
        <style>
          :root { --primary: #0088cc; --bg: #f0f2f5; --text: #1c1e21; --success: #27ae60; }
          body { font-family: -apple-system, sans-serif; padding: 15px; background: var(--bg); margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
          .card { background: white; padding: 25px; border-radius: 24px; box-shadow: 0 12px 30px rgba(0,0,0,0.1); max-width: 420px; width: 100%; }
          .header { text-align: center; margin-bottom: 25px; }
          h2 { margin: 0; font-size: 22px; font-weight: 800; color: #333; }
          .locale-name { color: var(--primary); font-size: 12px; font-weight: 800; margin-top: 5px; text-transform: uppercase; letter-spacing: 1px; }
          
          label, .durata-label { font-size: 13px; font-weight: 700; color: #606770; display: block; margin-bottom: 6px; }
          .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
          input { width: 100%; padding: 14px; margin-bottom: 15px; border-radius: 12px; border: 1px solid #ddd; box-sizing: border-box; font-size: 16px; outline: none; transition: 0.2s; -webkit-appearance: none; }
          input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(0,136,204,0.1); }
          
          .row-flex { display: flex; gap: 10px; }
          .col-small { flex: 0 0 85px; } 
          .col-large { flex: 1; }

          .timer-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 20px; }
          .btn-time { background: #e4e6eb; border: none; padding: 10px; border-radius: 10px; font-weight: 800; color: #4b4f56; cursor: pointer; font-size: 13px; }
          .btn-time.active { background: var(--primary); color: white; transform: scale(1.05); }

          button#btnInvio { width: 100%; padding: 16px; border-radius: 15px; border: none; background: var(--primary); color: white; font-size: 17px; font-weight: 800; cursor: pointer; transition: 0.3s; margin-top: 10px; }
          button:disabled { background: #cbd5e0; cursor: not-allowed; }
          
          #stato { text-align: center; margin-top: 15px; font-weight: 700; font-size: 13px; padding: 10px; border-radius: 10px; display: none; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h2>Nuova Offerta 🥯</h2>
            <div class="locale-name">${nomeAttr}</div>
          </div>
          
          <input type="hidden" id="loc" value="${nomeAttr}">
          <input type="hidden" id="authToken" value="${tokenAttr}">
          
          <label for="desc">Cosa offri?</label>
          <div class="row-flex">
            <div class="col-large">
              <input type="text" id="desc" placeholder="es. Mix Dolce e Salato" autocomplete="off">
            </div>
            <div class="col-small">
              <label for="numPezzi" class="sr-only">Numero box</label>
              <input type="number" id="numPezzi" placeholder="Box" inputmode="numeric" value="1" aria-label="Numero box">
            </div>
          </div>
          
          <div class="row-flex">
            <div class="col-large">
              <label for="prezzoF">Scontato (€)</label>
              <input type="number" id="prezzoF" step="0.10" inputmode="decimal" placeholder="4.50">
            </div>
            <div class="col-large">
              <label for="prezzoO">Originale (€)</label>
              <input type="number" id="prezzoO" step="0.10" inputmode="decimal" placeholder="12.00">
            </div>
          </div>
          
          <span class="durata-label" id="durata-lbl">Durata validità (minuti)</span>
          <div class="timer-grid" role="group" aria-labelledby="durata-lbl">
            <button type="button" class="btn-time" onclick="setMin(10, this)">10</button>
            <button type="button" class="btn-time active" onclick="setMin(15, this)">15</button>
            <button type="button" class="btn-time" onclick="setMin(30, this)">30</button>
            <button type="button" class="btn-time" onclick="setMin(60, this)">60</button>
          </div>
          <input type="number" id="minuti" value="15" hidden>
          
          <button type="button" id="btnInvio" onclick="invia()">PUBBLICA OFFERTA 🚀</button>
          <div id="stato"></div>
        </div>

        <script>
          function parsePrezzoCliente_(s) {
            if (s == null || String(s).trim() === '') return NaN;
            return parseFloat(String(s).trim().replace(',', '.'));
          }
          function setMin(val, element) {
            document.getElementById('minuti').value = val;
            document.querySelectorAll('.btn-time').forEach(b => b.classList.remove('active'));
            element.classList.add('active');
          }

          function invia() {
            if (typeof google === 'undefined' || !google.script || !google.script.run) {
              mostraStato('⚠️ Ambiente non pronto: apri il link nel browser o ridistribuisci la web app.', '#f8d7da', '#721c24');
              return;
            }
            const btn = document.getElementById('btnInvio');
            const stato = document.getElementById('stato');
            const desc = document.getElementById('desc').value.trim();
            const prezzoF = parsePrezzoCliente_(document.getElementById('prezzoF').value);
            const prezzoORaw = document.getElementById('prezzoO').value;
            const prezzoO = parsePrezzoCliente_(prezzoORaw);
            const min = document.getElementById('minuti').value;
            const token = document.getElementById('authToken').value;

            if(!desc || isNaN(prezzoF)) {
              mostraStato('⚠️ Inserisci descrizione e prezzo scontato!', '#fff3cd', '#856404');
              return;
            }

            btn.disabled = true;
            btn.innerText = '⏳ PUBBLICAZIONE...';
            mostraStato('Invio in corso...', '#e2e3e5', '#383d41');

            const dati = {
              locale: document.getElementById('loc').value,
              token: token, // Passiamo il token per validazione lato server in salvaDati
              numPezzi: document.getElementById('numPezzi').value,
              desc: desc,
              prezzoF: prezzoF.toFixed(2),
              prezzoO: !isNaN(prezzoO) ? prezzoO.toFixed(2) : '',
              durataMinuti: min
            };

            google.script.run
              .withSuccessHandler(() => {
                mostraStato('✅ OFFERTA PUBBLICATA! Arriverà tra poco.', '#d4edda', '#155724');
                btn.disabled = false;
                btn.innerText = "PUBBLICA UN'ALTRA";
                document.getElementById('desc').value = '';
                document.getElementById('prezzoF').value = '';
                document.getElementById('prezzoO').value = '';
              })
              .withFailureHandler((err) => {
                console.error('salvaDati fallito:', err);
                const msg = (err && err.message) ? err.message : String(err);
                mostraStato('❌ ' + msg, '#f8d7da', '#721c24');
                btn.disabled = false;
                btn.innerText = 'RIPROVA';
              })
              .salvaDati(dati);
          }

          function mostraStato(txt, bg, col) {
            const s = document.getElementById('stato');
            s.style.display = 'block';
            s.innerText = txt;
            s.style.background = bg;
            s.style.color = col;
          }
        </script>
      </body>
    </html>
  `;
  return HtmlService.createHtmlOutput(html)
      .setTitle('Pubblica Offerta - ' + nomeLocale)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, user-scalable=no')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}