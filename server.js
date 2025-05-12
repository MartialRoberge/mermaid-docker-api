import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs/promises';
import { v4 as uuid } from 'uuid';

// mermaid & puppeteer
import mermaid from '@mermaid-js/mermaid-cli';
import puppeteer from 'puppeteer-core';

const PORT = process.env.PORT || 3000;
const TMP_DIR = '/tmp';

const app = express();
app.use(bodyParser.json({ limit: '500kb' }));
app.use('/tmp', express.static(TMP_DIR)); // sert les PNG écrits dans /tmp

// helper: renvoie l'exécutable chrome déjà présent dans l'image puppeteer
function findChromiumExec() {
  const candidates = [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    puppeteer.executablePath?.() // pour compatibilité si PUPPETEER_DOWNLOAD
  ];
  return candidates.find((p) => p && Bun.spawnSync(['bash', '-c', `test -x ${p}`]).success);
}

/**
 * POST /render
 * Body : { code: "mermaid code" }
 * → stream PNG
 */
app.post('/render', async (req, res) => {
  const { code } = req.body || {};
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Body JSON attendu : { code: "…" }' });
  }

  // 1. validation syntaxe mermaid (évite de lancer chrome pour rien)
  try {
    mermaid.parse(code);
  } catch (err) {
    return res.status(400).json({ error: 'Syntaxe Mermaid invalide', details: err.message });
  }

  // 2. rendu headless via puppeteer + mermaid-cli
  const tmpSvg = `${TMP_DIR}/${uuid()}.svg`;
  const tmpPng = `${TMP_DIR}/${uuid()}.png`;

  try {
    // mermaid-cli peut rendre directement en PNG mais nécessite chrome => on reste full-JS
    await fs.writeFile(tmpSvg, mermaid.renderSync(uuid(), code));

    const browser = await puppeteer.launch({
      executablePath: findChromiumExec(),
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(await fs.readFile(tmpSvg, 'utf8'), { waitUntil: 'networkidle0' });
    const svgElement = await page.$('svg');
    await svgElement.screenshot({ path: tmpPng });
    await browser.close();

    res.type('png');
    res.send(await fs.readFile(tmpPng));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors du rendu de l\'image.' });
  } finally {
    // cleanup best-effort
    await fs.rm(tmpSvg, { force: true });
    // ne supprime pas le PNG car il peut être servi en /tmp/... pour l\'action GPT
  }
});

/**
 * POST /render/base64
 * (utile si on veut directement du data:image/png;base64)
 */
app.post('/render/base64', async (req, res) => {
  try {
    const r = await fetch('http://localhost:' + PORT + '/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: req.body.code })
    });
    if (!r.ok) {
      const json = await r.json();
      return res.status(r.status).json(json);
    }
    const buf = Buffer.from(await r.arrayBuffer());
    res.json({ image_url: { url: `data:image/png;base64,${buf.toString('base64')}` } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur lors du rendu base64' });
  }
});

app.listen(PORT, () => console.log(`Mermaid renderer ready on :${PORT}`));
