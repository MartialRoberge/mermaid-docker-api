// server.js  –  proxy minimal <client> → <kroki>
import express from 'express';
import fetch   from 'node-fetch';   // ^3
import { v4 as uuid } from 'uuid';

const app = express();
app.use(express.json({ limit: '1mb' }));

app.post('/render', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: '`code` field missing' });
    }

    // on envoie tel quel à Kroki (JSON) ― aucune compression
    const krokiResp = await fetch('https://kroki.io/mermaid/png', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ diagram_source: code })
    });

    if (!krokiResp.ok) {
      const text = await krokiResp.text();
      return res.status(502).json({ error: `Kroki error ${krokiResp.status}`, details: text });
    }

    // Kroki renvoie directement un PNG ⇒ on le stream vers le client
    res.set('Content-Type', 'image/png');
    krokiResp.body.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors du rendu de l\'image.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy Mermaid prêt sur :${PORT}`));
