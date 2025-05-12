// server.js  — ES modules
import express from 'express';
import puppeteer from 'puppeteer';
import bodyParser from 'body-parser';

const app  = express();
const PORT = process.env.PORT || 3000;

/* ────────────────────────────────────────────────────────── */
/*  middlewares                                               */
app.use(bodyParser.json({ limit: '2mb' }));

/* ────────────────────────────────────────────────────────── */
/*  POST /render/base64  : code Mermaid -> PNG base-64        */
app.post('/render/base64', async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Mermaid code manquant.' });
  }

  /* échappe les backticks & antislash pour l’embed JS */
  const safeCode = code.replace(/\\/g, '\\\\').replace(/`/g, '\\`');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { margin:0; padding:20px; background:#fff; }
  </style>
</head>
<body>
  <div id="diagram"></div>
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad:false, theme:'default' });
    mermaid.render('graph', \`${safeCode}\`).then(({ svg }) => {
      document.getElementById('diagram').innerHTML = svg;
    });
  </script>
</body>
</html>
`;

  /* ─────────────  génération & screenshot  ─────────────── */
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: process.env.CHROME_BIN || '/usr/bin/chromium-browser'
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    /* on attend que le SVG soit présent */
    await page.waitForSelector('#diagram svg', { timeout: 5000 });

    const element = await page.$('#diagram svg');
    const buffer  = await element.screenshot({ type: 'png' });

    await browser.close();

    /* réponse au format exigé par ChatGPT Actions */
    return res.json({
      image_url: { url: `data:image/png;base64,${buffer.toString('base64')}` }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur lors du rendu de l'image." });
  }
});

/*  simple ping */
app.get('/', (req, res) => res.send('Mermaid renderer API – OK'));

app.listen(PORT, () =>
  console.log(`✅  Serveur en écoute sur le port ${PORT}`)
);
