// server.js  (extrait ultra-simplifié)
import fs       from "node:fs/promises";
import path     from "node:path";
import { v4 as uuid }  from "uuid";
import mermaid   from "@mermaid-js/mermaid-cli";
import express   from "express";

const app = express();
app.use(express.json());

// dossier public → servi statiquement par Render
app.use("/img", express.static("public/img"));

app.post("/render", async (req, res) => {
  try {
    const { code } = req.body;                         // code Mermaid reçu
    const id   = uuid();                               // nom unique d’image
    const file = path.join("public", "img", `${id}.png`);

    // génère le PNG dans ./public/img/<id>.png
    await mermaid.render( id, code, { output: file } );

    // répond juste l’URL  ⇢ sera servie en binaire par Express
    res.json({ url: `${req.protocol}://${req.get("host")}/img/${id}.png` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "render-error" });
  }
});
