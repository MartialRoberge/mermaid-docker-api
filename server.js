import express from 'express';
import fetch   from 'node-fetch';
import { buffer } from 'stream/consumers';

const app = express();
app.use(express.json({ limit: '1mb' }));

app.post('/render', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: '`code` manquant' });

    const kroki = await fetch('https://kroki.io/mermaid/png', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ diagram_source: code })
    });

    if (!kroki.ok) {
      return res.status(502).json({ error: `Kroki ${kroki.status}`, details: await kroki.text() });
    }

    // on lit le flux PNG puis on encode
    const bin = await buffer(kroki.body);
    const b64 = bin.toString('base64');
    return res.json({ image: `data:image/png;base64,${b64}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors du rendu de l\'image.' });
  }
});

app.listen(process.env.PORT || 3000);
