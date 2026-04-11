# Last Minute Bologna — mini app Telegram

Repository dedicata alla **grafica e al front-end** della mini app (cartella `MiniAppTelegram/`). Il backend resta su **Google Apps Script**.

## URL da usare nel bot (BotFather / Menu)

`https://albertocavazzini.github.io/lastminutebologna/`

(Lo slash finale è opzionale; l’importante è che **non** sia l’URL del repository su `github.com`.)

## Pubblicazione su GitHub Pages (scegli così)

Il workflow **Deploy GitHub Pages** compila la mini app e aggiorna il branch **`gh-pages`** solo con i file della build (`dist/`), **senza** questo README.

1. Vai in **Settings** → **Pages**.
2. **Build and deployment** → **Source**: **Deploy from a branch**.
3. **Branch**: **`gh-pages`** → cartella **`/ (root)`** → Save.
4. Attendi il primo run verde in **Actions** (dopo un push su `main` o da **Actions** → **Run workflow**). Se il branch non esiste ancora, lancialo una volta a mano.

Se lasci **main** e **/ (root)**, GitHub mostra il README invece dell’app: è normale, perché in main non c’è `index.html` in root.

### Alternativa: “GitHub Actions” come sorgente Pages

Puoi anche usare **Source: GitHub Actions** con un workflow che usa `actions/deploy-pages` (versione precedente di questo repo). Con **`gh-pages`** + branch deploy di solito si evitano approvazioni ambiente e confusione col README.

## Sviluppo locale

```bash
cd MiniAppTelegram
npm ci
npm run dev
```

Variabili opzionali: vedi `MiniAppTelegram/.env.example`.

## Apps Script (mini app ↔ radar)

Per l’elenco e la mappa con offerte **attive adesso** e **nel raggio radar**, sul progetto Google Apps Script servono:

- il file `WEBAPP/api/api_miniapp.js` (endpoint JSONP `mode=api_miniapp&action=offerte`);
- l’aggancio in `WEBAPP/router/doget.js` (già presente in questo repo).

Dopo il deploy, la mini app usa `VITE_APPS_SCRIPT_WEBAPP_BASE` come `MiniAppTelegram/app.js`.
