/* -----------------------------------------------------------
 * Mermaid → Kroki proxy ultra-léger
 *  - POST /render  { code: "<diagramme mermaid>" }
 *      ↪︎ { url: "https://kroki.io/mermaid/png/<…>" }
 * ---------------------------------------------------------- */

import express from 'express';
import cors from 'cors';
import { deflateSync } from 'zlib';

const app  = express();
const PORT = process.env.PORT || 8080;

/* ---------- middlewares ---------- */
app.use(cors());
app.use(express.json({ limit: '1mb' }));      // petit payload suffisant

/* ---------- utilitaire ---------- */
function toKrokiUrl(code) {
  // 1) compression zlib / deflate
  const deflated = deflateSync(code, { level: 9 });

  // 2) encodage base64 URL-safe (RFC 4648 §5)
  const b64 = deflated
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `https://kroki.io/mermaid/png/${b64}`;
}

/* ---------- route API ---------- */
app.post('/render', (req, res) => {
  const { code } = req.body || {};

  if (typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ error: 'Champ "code" manquant ou vide.' });
  }

  try {
    const url = toKrokiUrl(code);
    return res.json({ url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur interne.' });
  }
});

/* ---------- 404 ---------- */
app.use((_, res) => res.status(404).json({ error: 'Not found' }));

/* ---------- start ---------- */
app.listen(PORT, () =>
  console.log(`✅ Mermaid-Kroki proxy lancé sur http://localhost:${PORT}`)
);
