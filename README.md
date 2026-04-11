# Last Minute Bologna — mini app Telegram

Repository dedicata alla **grafica e al front-end** della mini app (cartella `MiniAppTelegram/`). Il backend resta su **Google Apps Script**.

## URL da usare nel bot (BotFather / Menu)

Usa **esattamente** (con **slash finale**):

`https://albertocavazzini.github.io/lastminutebologna/`

Se in **Impostazioni → GitHub Pages** la sorgente è **“Deploy from a branch”** e nella root del repo non c’è un `index.html` generato dalla build, GitHub mostra solo il README (testo tipo “lastminutebologna”) invece dell’app.

**Imposta la pubblicazione così:**

1. Repository → **Settings** → **Pages**
2. **Build and deployment** → **Source**: **GitHub Actions** (non “Deploy from a branch”)
3. Dopo il primo workflow, in **Actions** potrebbe servire **un’approvazione** una tantum per l’ambiente `github-pages`

Il deploy è definito in `.github/workflows/deploy-github-pages.yml` (build Vite in `MiniAppTelegram/` e upload della cartella `dist/`).

## Sviluppo locale

```bash
cd MiniAppTelegram
npm ci
npm run dev
```

Variabili opzionali: vedi `MiniAppTelegram/.env.example`.
