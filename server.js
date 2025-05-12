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
      body {
        margin: 0;
        padding: 20px;
        background: #fff;
      }
    </style>
  </head>
  <body>
    <div id="diagram"></div>
    <script type="module">
      import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';

      const code = \`${encodedCode}\`;

      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        themeVariables: {
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          primaryColor: '#0057FF',
          lineColor: '#C0C0C0',
          textColor: '#202124',
          taskTextColor: '#202124',
          ganttAxisFontSize: '12px',
          ganttSectionFill: '#F1F3F4',
          ganttSectionFontColor: '#202124'
        }
      });

      const el = document.getElementById('diagram');
      mermaid.render("theGraph", code).then(({ svg }) => {
        el.innerHTML = svg;
      });
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

    // Attendre que le SVG Mermaid soit bien injecté
    await page.waitForFunction(() => {
      const el = document.querySelector('.mermaid');
      return el && el.querySelector('svg');
    }, { timeout: 5000 });

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
