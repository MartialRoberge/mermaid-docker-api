/* ------------------------------------------------------------------ */
/*  server.js – Mermaid → PNG   (ES modules)                          */
/* ------------------------------------------------------------------ */
import express    from 'express';
import bodyParser from 'body-parser';
import puppeteer  from 'puppeteer';
import fs         from 'node:fs/promises';          // ← utile si tu veux servir /img
import crypto     from 'node:crypto';

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '2mb' }));

/* ---------- utilité : génère un PNG (Buffer) ---------------------- */
async function generatePng(code) {
  const escaped = JSON.stringify(code);

  const html = /* html */`
<!DOCTYPE html><html lang="en">
<head>
  <meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
  <style>html,body{margin:0;padding:20px;background:#fff;font-family:Inter,sans-serif}</style>
</head>
<body>
  <div id="container"></div>
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
    mermaid.initialize({
      startOnLoad:false,
      theme:'base',
      themeVariables:{
        primaryColor:'#1A73E8',primaryBorderColor:'#185ABC',primaryTextColor:'#fff',
        lineColor:'#E8EAED',textColor:'#202124',fontFamily:'Inter, sans-serif',fontSize:'14px',
        ganttSectionFill:'#F1F3F4',ganttSectionFontColor:'#202124',ganttAxisFontSize:'12px',
        doneTaskColor:'#5F6368',doneTaskBorderColor:'#5F6368',doneTaskTextColor:'#fff',
        activeTaskColor:'#1A73E8',activeTaskBorderColor:'#185ABC',activeTaskTextColor:'#fff',
        critFill:'#FCE8E6',critStroke:'#D93025'
      }
    });
    const { svg } = await mermaid.render('d', ${escaped});
    document.getElementById('container').innerHTML = svg;
  </script>
</body></html>`;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.waitForSelector('svg', { timeout: 5_000 });

  const el   = await page.$('svg');
  const clip = await el.boundingBox();
  const png  = await page.screenshot({ clip, type: 'png' });

  await browser.close();
  return png;
}

/* ---------- 1. Route PNG binaire (tests manuels) ------------------ */
app.post('/render', async (req, res) => {
  const { code = '' } = req.body;
  if (!code.trim()) return res.status(400).json({ error:'Mermaid code manquant.' });

  try {
    const png = await generatePng(code);
    res.setHeader('Content-Type','image/png');
    res.send(png);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error:"Erreur lors du rendu de l'image." });
  }
});

/* ---------- 2. Route pour ChatGPT Actions (data-URL) -------------- */
app.post('/render/base64', async (req, res) => {
  const { code = '' } = req.body;
  if (!code.trim()) return res.status(400).json({ error:'Mermaid code manquant.' });

  try {
    const png = await generatePng(code);
    const b64 = png.toString('base64');
    res.json({ image_url: { url: `data:image/png;base64,${b64}` } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error:"Erreur lors du rendu de l'image." });
  }
});

/* ---------- (optionnel) fichier statique /img/<id>.png ------------ */
/*
app.post('/render/link', async (req, res) => {
  const { code = '' } = req.body;
  if (!code.trim()) return res.status(400).json({ error:'Mermaid code manquant.' });

  const png = await generatePng(code);
  const id  = crypto.createHash('sha256').update(code).digest('hex').slice(0,24);
  await fs.writeFile(`/tmp/${id}.png`, png);
  res.json({ image_url: { url: `https://mermaid-docker-api.onrender.com/img/${id}.png` }});
});
app.use('/img', express.static('/tmp'));
*/

app.listen(PORT, () =>
  console.log(`✅  API prête : http://localhost:${PORT}`)
);
