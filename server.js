// server.js  (ES-Modules)
import express from 'express';
import path     from 'node:path';
import { fileURLToPath } from 'node:url';
import { v4 as uuidv4 }  from 'uuid';                //  ➜  ajoute "uuid": "^9" dans package.json
import fs       from 'node:fs/promises';
import mermaid  from '@mermaid-js/mermaid-cli';      //  ➜  "@mermaid-js/mermaid-cli": "^10"
import puppeteer from 'puppeteer-core';              //  ➜  "puppeteer-core": "^22"

const app  = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ---------- middlewares ---------- */
app.use(express.json({ limit: '1mb' }));
// on sert /tmp en statique pour exposer les PNG
app.use('/tmp', express.static('/tmp'));

/* ---------- POST /render ---------- */
app.post('/render', async (req, res) => {
  const code = req.body?.code;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: '`code` (string) manquant' });
  }

  /* 1. validation Mermaid -------------------------------------------------- */
  try {
    mermaid.parse(code);                 // lève si syntaxe invalide
  } catch (err) {
    return res.status(400).json({
      error: 'Syntaxe Mermaid invalide',
      details: err.message
    });
  }

  /* 2. génération ---------------------------------------------------------- */
  const tmpFile = `/tmp/${uuidv4()}.png`;
  let browser;
  try {
    browser = await puppeteer.launch({
      // Render installe chrome stable dans /usr/bin/chromium-browser
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // page HTML minimal avec Mermaid JS chargé depuis un CDN
    const html = /* html */ `
      <!DOCTYPE html><html>
      <head>
        <meta charset="utf-8" />
        <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs" type="module"></script>
        <style>body{margin:0}svg{width:100%;height:auto}</style>
      </head>
      <body>
        <div class="mermaid">${code}</div>
      </body>
      </html>`;

    await page.setContent(html, { waitUntil: 'networkidle0' });
    // on attend le rendu
    await page.waitForSelector('svg', { timeout: 10_000 });

    const svg = await page.$('svg');
    await svg.screenshot({ path: tmpFile, type: 'png' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur lors du rendu de l\'image.' });
  } finally {
    await browser?.close().catch(() => {});
  }

  /* 3. réponse ------------------------------------------------------------- */
  const publicUrl = `${req.protocol}://${req.get('host')}/tmp/${path.basename(tmpFile)}`;
  return res.json({ image_url: { url: publicUrl } });
});

/* ---------- GET /healthz (optionnel) ---------- */
app.get('/healthz', (_, res) => res.send('ok'));

/* ---------- start ---------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Mermaid API ready on :${PORT}`));
