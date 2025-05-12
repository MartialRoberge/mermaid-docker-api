/* ─────────────── server.js (ES modules, Node ≥ 18) ───────────────
   - attend un body JSON : { "code": "...mermaid..." , "format":"png|svg" }
   - renvoie directement le fichier généré  ⇒ pas de base64, affichage immédiat
   - dépendances : express, cors, @mermaid-js/mermaid-cli
   - pense à avoir  "type": "module"  dans ton package.json
────────────────────────────────────────────────────────────────── */

import express           from 'express';
import cors              from 'cors';
import { run }           from '@mermaid-js/mermaid-cli';  // pas de « default » !
import { randomUUID }    from 'crypto';
import fs                from 'fs/promises';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Ping ► GET /
app.get('/', (_, res) => res.send('✅ Mermaid proxy up & running'));

// POST /render  →  retourne l’image (png ou svg)
app.post('/render', async (req, res) => {
  const { code, format = 'png' } = req.body || {};

  if (!code) return res.status(400).json({ error: 'Missing "code" field' });
  if (!['png', 'svg'].includes(format)) {
    return res.status(400).json({ error: 'format must be "png" or "svg"' });
  }

  const file = `/tmp/${randomUUID()}.${format}`;

  try {
    // Génère le diagramme
    await run(code, {
      output: file,
      puppeteerConfig: { headless: true }
    });

    // 🔹 1) pré-visualisation immédiate
    // 🔹 2) l’utilisateur peut « Enregistrer l’image sous… » ou tu peux remplacer
    //       sendFile par download() pour forcer le téléchargement.
    res.sendFile(file, err => {
      if (err) res.status(500).json({ error: String(err) });
      fs.unlink(file).catch(() => {});   // ménage
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

// Lancement serveur
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🖼️  Mermaid proxy listening on :${PORT}`));
