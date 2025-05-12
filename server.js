/**
 * server.js  ·  API   /render  →  PNG
 * Style : Google / Material Design (bleu #1A73E8, vert #34A853, gris #5F6368)
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

  /* Échappe la string Mermaid pour l’injecter dans l’HTML */
  const escaped = JSON.stringify(code);

  /* ------------------------------------------------------------------ */
  /*  HTML : Inter + feuille custom + variables Mermaid                 */
  /* ------------------------------------------------------------------ */
  const html = /* html */`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">

  <!-- Police Inter -->
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">

  <!-- Style global (fond blanc + police) -->
  <style>
    *,*:before,*:after{box-sizing:border-box}
    html,body{margin:0;padding:20px;background:#fff;font-family:Inter,sans-serif}
  </style>

  <!-- Override CSS Mermaid pour le Gantt (grid, texte, etc.) -->
  <style id="mermaid-custom">
    .grid .tick        { stroke:#E8EAED; opacity:0.5; shape-rendering:crispEdges }
    .grid path         { stroke-width:0 }
    .taskText, .taskTextOutsideLeft,
    .taskTextOutsideRight { fill:#202124; font-weight:600 }

    /* Tooltip éventuel */
    #tag { color:#fff; background:#D93025; padding:3px 6px; font-size:11px }
    #tag:before { border-bottom-color:#D93025 }
  </style>
</head>
<body>
  <div id="container"></div>

  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';

    const diagram = ${escaped};

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',   // autorise les <style> inline si besoin
      theme: 'base',            // 100 % customisable
      themeVariables: {
        /* Couleurs génériques --------------------------------------- */
        primaryColor:       '#1A73E8',  // bleu Google 600
        primaryBorderColor: '#185ABC',
        primaryTextColor:   '#FFFFFF',
        lineColor:          '#E8EAED',
        textColor:          '#202124',
        fontFamily:         'Inter, sans-serif',
        fontSize:           '14px',

        /* Gantt – sections & axes ----------------------------------- */
        ganttSectionFill:        '#F1F3F4',
        ganttSectionFontColor:   '#202124',
        ganttAxisFontSize:       '12px',

        /* Gantt – tâches DONE --------------------------------------- */
        doneTaskColor:           '#5F6368',   // gris Google 600
        doneTaskBorderColor:     '#5F6368',
        doneTaskTextColor:       '#FFFFFF',

        /* Gantt – tâche ACTIVE -------------------------------------- */
        activeTaskColor:         '#1A73E8',   // bleu
        activeTaskBorderColor:   '#185ABC',
        activeTaskTextColor:     '#FFFFFF',

        /* Gantt – tâche CRITIQUE ------------------------------------ */
        critFill:                '#FCE8E6',   // rouge 50
        critStroke:              '#D93025'
      }
    });

    const { svg } = await mermaid.render('diagram', diagram);
    document.getElementById('container').innerHTML = svg;
  </script>
</body>
</html>`;

  /* ------------------------------------------------------------------ */
  /*  Puppeteer : SVG → PNG                                             */
  /* ------------------------------------------------------------------ */
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.waitForSelector('svg', { timeout: 5000 });

    const svg = await page.$('svg');
    const clip = await svg.boundingBox();
    const png  = await page.screenshot({ clip, type: 'png' });

    await browser.close();

    res.setHeader('Content-Type', 'image/png');
    res.send(png);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du rendu de l'image." });
  }
});

app.listen(PORT, () =>
  console.log(`✅  API Mermaid prête sur http://localhost:${PORT}/render`)
);
