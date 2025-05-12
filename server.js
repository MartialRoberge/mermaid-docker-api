// server.js – version simplifiée (Chromium embarqué par Puppeteer)
import express from 'express';
import puppeteer from 'puppeteer';   // ← plus puppeteer-core
import bodyParser from 'body-parser';

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '2mb' }));

app.post('/render', async (req, res) => {
  const { code = '' } = req.body;

  if (!code.trim()) {
    return res.status(400).json({ error: 'Mermaid code manquant.' });
  }

  const escapedCode = JSON.stringify(code);

  const html = /* html */`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>body{margin:0;padding:20px;background:#fff;font-family:Inter,sans-serif}</style>
</head>
<body>
  <div id="container"></div>
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
    const code = ${escapedCode};
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      themeVariables: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        primaryColor: '#0057FF',
        lineColor:    '#C0C0C0',
        textColor:    '#202124'
      }
    });
    const { svg } = await mermaid.render('graph', code);
    document.getElementById('container').innerHTML = svg;
  </script>
</body>
</html>`;

  try {
    // ➜ plus de executablePath : Puppeteer trouve son propre Chromium
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.waitForSelector('svg', { timeout: 5000 });

    const element = await page.$('svg');
    const clip    = await element.boundingBox();
    const buffer  = await page.screenshot({ clip, type: 'png' });

    await browser.close();

    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du rendu de l'image." });
  }
});

app.listen(PORT, () =>
  console.log(`✅  Serveur prêt sur http://localhost:${PORT}`)
);
