// server.js ─ seules les routes changent
// … generatePng() inchangé …

/* 1.  Route historique : PNG brut (tests manuels). */
app.post('/render', async (req, res) => {
  const { code = '' } = req.body;
  if (!code.trim()) return res.status(400).json({ error: 'Mermaid code manquant.' });

  try {
    const png = await generatePng(code);
    res.setHeader('Content-Type', 'image/png');
    res.send(png);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du rendu de l'image." });
  }
});

/* 2. Route pour ChatGPT Actions : JSON → image_url.url = data:… */
app.post('/render/base64', async (req, res) => {
  const { code = '' } = req.body;
  if (!code.trim()) return res.status(400).json({ error: 'Mermaid code manquant.' });

  try {
    const png  = await generatePng(code);
    const b64  = png.toString('base64');
    res.json({ image_url: { url: `data:image/png;base64,${b64}` } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du rendu de l'image." });
  }
});
