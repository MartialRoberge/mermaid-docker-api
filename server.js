// server.js  — ES modules
import express from 'express';
import puppeteer from 'puppeteer';          // ← puppeteer complet, pas “core”
import bodyParser from 'body-parser';

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '2mb' }));

app.post('/render/base64', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Mermaid code manquant.' });

  const safeCode = code.replace(/\\/g, '\\\\').replace(/`/g, '\\`');

  const html = /* html identique, omis ici pour brièveté */ `<!DOCTYPE html>…`;

  try {
    /* plus de executablePath ⇒ Puppeteer lance son Chrome intégré */
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#diagram svg', { timeout: 5000 });

    const svg   = await page.$('#diagram svg');
    const buf   = await svg.screenshot({ type: 'png' });
    await browser.close();

    return res.json({
      image_url: { url: `data:image/png;base64,${buf.toString('base64')}` }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur lors du rendu de l'image." });
  }
});

app.get('/', (_, res) => res.send('Mermaid renderer API – OK'));
app.listen(PORT, () => console.log(`✅  Serveur en écoute sur le port ${PORT}`));
