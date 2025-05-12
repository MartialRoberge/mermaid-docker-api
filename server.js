import express from 'express';
import puppeteer from 'puppeteer';
import bodyParser from 'body-parser';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '2mb' }));

app.post('/render', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Mermaid code manquant.' });
  }

const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { margin: 0; padding: 20px; background: #fff; }
      .taskText {
        fill: #202124;
        font-family: 'Inter', 'Roboto', sans-serif;
        font-size: 14px;
        text-anchor: middle;
      }
      .grid .tick { stroke: #DADCE0; opacity: 0.4; }
      .grid path { stroke-width: 0; }
    </style>
  </head>
  <body>
    <pre class="mermaid" id="diagram">${code}</pre>
    <script type="module">
      import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
      mermaid.initialize({ startOnLoad: false });
      mermaid.run().then(() => console.log("Mermaid diagram rendered"));
    </script>
  </body>
</html>
`;

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: '/usr/bin/chromium'
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const element = await page.$('.mermaid');
    const buffer = await element.screenshot();

    await browser.close();

    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du rendu de l'image." });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur en écoute sur le port ${PORT}`);
});
