/**
 * server.js – Mermaid → PNG API
 * Style : Google / Material Design (Inter, bleu #1A73E8, gris #F1F3F4, etc.)
 * Usage : POST /render { "code": "<mermaid code>" }  →  image/png
 */
import express from 'express';
import puppeteer from 'puppeteer';
import bodyParser from 'body-parser';

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '2mb' }));

app.post('/render', async (req, res) => {
  const { code = '' } = req.body;

  if (!code.trim()) {
    return res.status(400).json({ error: 'Mermaid code manquant.' });
  }

  /* Échapper proprement le diagramme pour l’injecter dans l’HTML */
  const esc = JSON.stringify(code);

  /* ------------------------------------------------------------------ */
  /*  HTML : import Google Font + Mermaid + variables Material Design   */
  /* ------------------------------------------------------------------ */
  const html = /* html */`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>

  <!-- Inter : police Google Fonts -->
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">

  <style>
    html,body{margin:0;padding:20px;background:#fff;font-family:Inter,sans-serif}
  </style>
</head>
<body>
  <div id="container"></div>

  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';

    const diagram = ${esc};

    /* --- Palette Google Material --- */
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',                 /* base = zéro contrainte */
      themeVariables: {
        /* Couleurs génériques */
        primaryColor:        '#1A73E8', /* Google Blue-600 */
        primaryBorderColor:  '#185ABC',
        primaryTextColor:    '#FFFFFF',

        lineColor:           '#DADCE0', /* gris clair Google */
        textColor:           '#202124', /* gris quasi-noir   */
        fontFamily:          'Inter, sans-serif',
        fontSize:            '14px',

        /* Gantt – sections & axes */
        ganttSectionFill:        '#F1F3F4', /* background section */
        ganttSectionFontColor:   '#202124',
        ganttAxisFontSize:       '12px',

        /* Gantt – tâches */
        doneTaskColor:           '#1A73E8',
        doneTaskBorderColor:     '#185ABC',
        doneTaskTextColor:       '#FFFFFF',

        activeTaskColor:         '#34A853',   /* Google Green-600   */
        activeTaskBorderColor:   '#0F9D58',
        activeTaskTextColor:     '#FFFFFF',

        critFill:                '#FCE8E6',   /* Google Red 50      */
        critStroke:              '#EA4335'    /* Google Red-600     */
      }
    });

    /* Rendu */
    const { svg } = await mermaid.render('graph', diagram);
    document.getElementById('container').innerHTML = svg;
  </script>
</body>
</html>`;

  /* ------------------------------------------------------------------ */
  /*  Puppeteer : conversion SVG → PNG                                  */
  /* ------------------------------------------------------------------ */
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
      // pas de executablePath : on utilise Chromium embarqué par Puppeteer
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.waitForSelector('svg', { timeout: 5000 });

    const element = await page.$('svg');
    const clip    = await element.boundingBox();
    const png     = await page.screenshot({ clip, type: 'png' });

    await browser.close();

    res.setHeader('Content-Type', 'image/png');
    return res.send(png);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur lors du rendu de l'image." });
  }
});

app.listen(PORT, () =>
  console.log(`✅  API Mermaid prête : http://localhost:${PORT}/render`)
);
