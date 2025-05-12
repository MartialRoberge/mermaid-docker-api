// server.js
import express from 'express';
import puppeteer from 'puppeteer';
import bodyParser from 'body-parser';

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '2mb' }));

async function renderMermaid(code) {
  // page HTML embarquant Mermaid
  const html = `
<!DOCTYPE html><html>
<head><meta charset="utf-8"></head>
<body>
<div id="diagram"></div>
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
  mermaid.initialize({ startOnLoad:false, theme:'default' });
  mermaid.render("g1", \`${code}\`).then(({ svg }) =>
    document.getElementById('diagram').innerHTML = svg);
</script>
</body></html>`;

  const browser = await puppeteer.launch({ headless: 'new' }); // Chromium auto-téléchargé par puppeteer
  const page    = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.waitForSelector('#diagram svg', { timeout: 5000 });

  const svgElem = await page.$('#diagram svg');
  const pngBuf  = await svgElem.screenshot({ type: 'png' });

  await browser.close();
  return pngBuf;
}

// ----- ROUTE PNG BRUTE -------------------------------------------------------
app.post('/render', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Mermaid code manquant.' });

    const png = await renderMermaid(code);
    res.type('png').send(png);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du rendu de l'image." });
  }
});

// ----- ROUTE BASE64 ----------------------------------------------------------
app.post('/render/base64', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Mermaid code manquant.' });

    const png   = await renderMermaid(code);
    const b64   = png.toString('base64');
    res.json({ png: `data:image/png;base64,${b64}` });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du rendu de l'image." });
  }
});

app.listen(PORT, () => console.log(`✅  API Mermaid prête sur :${PORT}`));
