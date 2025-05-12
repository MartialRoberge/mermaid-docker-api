import express from 'express';
import cors    from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ────────────────────────────────────────────────────────────────
// Conversion Mermaid → base64 URL-safe (RFC 4648 §5)
// ────────────────────────────────────────────────────────────────
function toKrokiUrl(code) {
  const b64 = Buffer.from(code, 'utf8').toString('base64');
  const urlSafe = b64
    .replace(/\+/g, '-')   // 62nd char
    .replace(/\//g, '_')   // 63rd char
    .replace(/=+$/, '');   // padding
  return `https://kroki.io/mermaid/png/${urlSafe}`;
}

app.post('/render', (req, res) => {
  const { code } = req.body || {};

  if (typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ error: '`code` doit être une chaîne non vide' });
  }

  // On renvoie juste l’URL : affichage instantané + téléchargement direct
  res.json({ url: toKrokiUrl(code) });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Mermaid proxy prêt sur :${PORT}`));
