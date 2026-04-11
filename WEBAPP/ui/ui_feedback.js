/**
 * @fileoverview Interfaccia web per il feedback post-prenotazione.
 */

function interfacciaFeedback(e) {
  const idPre = e.parameter.id || 'N/A';
  const locale = e.parameter.loc || 'Locale';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
        <style>
          :root { --primary: #0088cc; --success: #27ae60; --star-off: #ddd; --star-on: #f1c40f; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; text-align: center; background: #f0f2f5; color: #1c1e21; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
          .card { background: white; padding: 40px 25px; border-radius: 24px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); max-width: 400px; width: 100%; border: 1px solid rgba(0,0,0,0.05); }
          h2 { font-size: 22px; margin-bottom: 10px; font-weight: 800; color: #333; }
          p { color: #606770; font-size: 15px; margin-bottom: 25px; line-height: 1.4; }
          
          .stars { font-size: 42px; margin: 25px 0; display: flex; justify-content: center; gap: 8px; }
          .star { cursor: pointer; color: var(--star-off); transition: transform 0.2s, color 0.2s; -webkit-tap-highlight-color: transparent; }
          .star:active { transform: scale(1.3); }
          .star.active { color: var(--star-on); text-shadow: 0 0 10px rgba(241, 196, 15, 0.3); }
          
          textarea { width: 100%; border-radius: 14px; border: 1px solid #e4e6eb; padding: 15px; margin-top: 15px; box-sizing: border-box; font-family: inherit; font-size: 16px; outline: none; background: #fdfdfd; transition: border-color 0.2s; resize: none; }
          textarea:focus { border-color: var(--primary); background: white; }
          
          button { background: var(--primary); color: white; border: none; padding: 18px; border-radius: 15px; margin-top: 30px; font-weight: 800; width: 100%; font-size: 17px; cursor: pointer; transition: all 0.3s; box-shadow: 0 6px 15px rgba(0,136,204,0.3); }
          button:active { transform: scale(0.98); box-shadow: none; }
          button:disabled { background: #cbd5e0; box-shadow: none; cursor: not-allowed; }
          
          .success-icon { font-size: 60px; color: var(--success); margin-bottom: 20px; }
          #errorMsg { color: #e74c3c; font-size: 14px; font-weight: 600; margin-top: 15px; min-height: 20px; }
        </style>
      </head>
      <body>
        <div class="card" id="mainCard">
          <h2>Com'era la box di ${locale}? 🥯</h2>
          <p>La tua valutazione aiuta il locale e la nostra community a crescere.</p>
          
          <div class="stars" id="starGroup">
            <span class="star" data-value="1" onclick="updateRating(1)">★</span>
            <span class="star" data-value="2" onclick="updateRating(2)">★</span>
            <span class="star" data-value="3" onclick="updateRating(3)">★</span>
            <span class="star" data-value="4" onclick="updateRating(4)">★</span>
            <span class="star" data-value="5" onclick="updateRating(5)">★</span>
          </div>

          <textarea id="commento" rows="3" placeholder="Qualche dettaglio? (opzionale)"></textarea>
          <div id="errorMsg"></div>
          
          <button id="btnInvia" onclick="invia()">PUBBLICA VALUTAZIONE</button>
        </div>

        <script>
          let currentRating = 0;

          function updateRating(r) {
            currentRating = r;
            const stars = document.querySelectorAll('.star');
            stars.forEach((s, i) => {
              s.classList.toggle('active', i < r);
            });
            document.getElementById('errorMsg').innerText = '';
          }

          function invia() {
            const btn = document.getElementById('btnInvia');
            const errorMsg = document.getElementById('errorMsg');
            const commento = document.getElementById('commento').value;

            if (currentRating === 0) {
              errorMsg.innerText = '⚠️ Scegli quante stelle dare!';
              return;
            }

            btn.disabled = true;
            btn.innerText = '⏳ Registrazione...';

            const dati = {
              idPre: "${idPre}",
              loc: "${locale}",
              valutazione: currentRating,
              commento: commento
            };

            google.script.run
              .withSuccessHandler(() => {
                document.getElementById('mainCard').innerHTML = \`
                  <div class="success-icon">✨</div>
                  <h2 style="color: var(--success)">Feedback Inviato!</h2>
                  <p>Grazie mille per il tuo contributo. Puoi tornare su Telegram ora.</p>
                  <button onclick="window.close()" style="background:#e4e6eb; color:#4b4f56; box-shadow:none;">CHIUDI PAGINA</button>
                \`;
              })
              .withFailureHandler((err) => {
                btn.disabled = false;
                btn.innerText = 'RIPROVA';
                errorMsg.innerText = '❌ Errore: ' + err;
              })
              .salvaFeedback(dati);
          }
        </script>
      </body>
    </html>
  `;
  return HtmlService.createHtmlOutput(html)
      .setTitle('Feedback Last Minute')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, user-scalable=no')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}