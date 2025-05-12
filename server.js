// server.js  – ES Modules
import express from 'express';
import puppeteer from 'puppeteer';
import bodyParser from 'body-parser';

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '2mb' }));

/**
 * Encapsulation d’un snippet Mermaid → PNG
 * POST /render  { "code": "graph TD;A-->B" }
 */
app.post('/render', async (req, res) => {
  const { code = '' } = req.body;

  if (!code.trim()) {
    return res.status(400).json({ error: 'Mermaid code manquant.' });
  }

  /* 1. On échappe le code afin de pouvoir l’injecter dans le template.
     Utiliser JSON.stringify est le moyen le plus sûr : */
  const escapedCode = JSON.stringify(code);

  /* 2. HTML de rendu : on charge Mermaid depuis jsDelivr en ESM
        et on applique les variables de thème souhaitées.          */
  const html = /* html */`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body{margin:0;padding:20px;background:#fff;font-family:Inter,sans-serif}
  </style>
</head>
<body>
  <div id="container"></div>
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';

    const code = ${escapedCode};

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',      // autorise les <style> inline
      theme: 'default',
      themeVariables: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        primaryColor: '#0057FF',
        lineColor:    '#C0C0C0',
        textColor:    '#202124',
        taskTextColor: '#202124',
        ganttAxisFontSize: '12px',
        ganttSectionFill:  '#F1F3F4',
        ganttSectionFontColor: '#202124'
      }
    });

    const el = document.getElementById('container');
    const { svg } = await mermaid.render('theGraph', code);
    el.innerHTML = svg;
  </script>
</body>
</html>`;

  try {
    /* 3. Lancement de Chromium.
          – headless:'new' = mode furtif moderne
          – args sans sandbox → indispensable dans un conteneur rootless */
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: '/usr/bin/chromium-browser'   // le binaire installé via apt
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // On attend l’injection du SVG avec un sélecteur simple
    await page.waitForSelector('svg', { timeout: 5000 });

    const element = await page.$('svg');

    // Ajuste la taille de la capture à la boîte englobante du SVG
    const clip = await element.boundingBox();
    const buffer = await page.screenshot({ clip, type: 'png' });

    await browser.close();

    res.setHeader('Content-Type', 'image/png');
    return res.send(buffer);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur lors du rendu de l’image.' });
  }
});

app.listen(PORT, () => {
  console.log(`✅  Serveur prêt sur http://localhost:${PORT}`);
});
