// server.js – Express + appel à Kroki
import express from 'express';
import bodyParser from 'body-parser';
import { v4 as uuid } from 'uuid';          // pour un nom de fichier unique si besoin
import fetch from 'node-fetch';             // (Node ≥18 builtin, sinon npm i node-fetch@3)

const app = express();
app.use(bodyParser.json({ limit: '200kb' }));   // le code Mermaid arrive en JSON { code: "..." }

// ----------------------------------------------------------------------------
// Petite fonction utilitaire : encode en URL-safe base64 (spécifique à Kroki)
function encodeMermaid(code) {
  return Buffer.from(code, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_');
}

// ----------------------------------------------------------------------------
// Endpoint POST /render  – retourne DIRECTEMENT le PNG (octet / octet)
app.post('/render', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Champ "code" manquant ou invalide.' });
    }

    // Encodage pour Kroki
    const encoded = encodeMermaid(code);

    // Appel Kroki (2 Mo max, timeout raisonnable)
    const krokiUrl = `https://kroki.io/mermaid/png/${encoded}`;
    const krokiResp = await fetch(krokiUrl, { timeout: 10_000 });

    if (!krokiResp.ok) {
      const txt = await krokiResp.text();
      return res.status(502).json({ error: `Kroki error ${krokiResp.status}`, details: txt });
    }

    // Flux → client
    res.setHeader('Content-Type', 'image/png');
    krokiResp.body.pipe(res);
  } catch (err) {
    console.error('Render error', err);
    res.status(500).json({ error: 'Erreur lors du rendu de l’image.' });
  }
});

// ----------------------------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Mermaid proxy ready on :${PORT}`));
